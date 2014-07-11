'use strict';

// module entry point
var SetupRabbitMQHelper = function setupRabbitMQHelper(options, eventHandlers) {
    if (!(this instanceof SetupRabbitMQHelper)) {
        return new SetupRabbitMQHelper(options, eventHandlers);
    }

    if (!eventHandlers) {
        eventHandlers = options || {};
        options = null;
    }
    options = options || {};

    var _initialize = true;
    var _this = this;

    var tool = require('cloneextend');
    var config = tool.cloneextend({
        connection: {
            host: '127.0.0.1',
            options: {
                heartbeat: 5,
                reconnect: true
            }
        },
        exchange: {
            name: 'testing-exchange',
            options: {
                type: 'direct',
                durable: false,
                autoDelete: false
            }
        },
        queue: {
            name: 'testing-queue',
            options: {
                routingKey: 'event-routing',
                durable: true,
                autoDelete: false,
                prefetchCount: 1
            }
        }
    }, options.config || {});

    require('./validators/config')(config, function (err) {
        if (err) {
            throw new Error(err);
        }
        else {
            // setup internal EventEmitter
            var InternalEventsHandler = function internalEventsHandler() {
                if (!(this instanceof InternalEventsHandler)) {
                    return new InternalEventsHandler();
                }
            };
            require('util').inherits(InternalEventsHandler, require('events').EventEmitter);

            var internalEvents = new InternalEventsHandler();

            // var logger = options.logger || console;

            // setup storage variables
            var connection;
            var exchange;
            var queue;
            var queueHandler;
            var helpers;

            var currentStatus = 'initializing';

            // emit external errors
            var EmitError = function emitError(err) {
                // if you don't listen to this it is not a good idea
                _this.emit('error', {
                    err: err,
                    message: err.message || 'no_message'
                });
            };

            var EnsureExchange = function ensureExchange() {
                exchange = connection.exchange(config.exchange.name, config.exchange.options, function (err) {
                    if (err) {
                        helpers.emitError(err);
                    }
                });
                if (exchange) {
                    internalEvents.emit('exchange-ensured');
                }
            };

            var EnsureQueue = function ensureQueue() {
                queue = connection.queue(config.queue.name, config.queue.options, function (err) {
                    if (err) {
                        helpers.emitError(err);
                    }
                });
                if (queue) {
                    internalEvents.emit('queue-ensured');
                }
            };

            var BindQueueToExchange = function bindQueueToExchange(emitEnsured) {
                queue.bindQueue(exchange.name, config.queue.options.routingKey, function () {
                    internalEvents.emit('queue-bound');
                    var previousStatus = currentStatus;
                    currentStatus = 'connected';
                    if (emitEnsured) {
                        switch (previousStatus) {
                        case 'initializing':
                            _this.emit('initialized');
                            break;
                        case 'reconnecting':
                            _this.emit('reconnected');
                            break;
                        }
                    }
                });
            };

            var BindListenerToQueue = function bindListenerToQueue() {
                if (queueHandler) {
                    queue.listen({
                        ack: true,
                        prefetchCount: config.queue.options.prefetchCount
                    }, function (message, ack, headers, fields, m) {
                        queueHandler({
                            message: message,
                            ack: ack,
                            headers: headers,
                            fields: fields,
                            m: m
                        });
                    });
                    _this.emit('queue-listening');
                }
            };

            // setup helper functions
            helpers = {
                emitError: EmitError,
                ensureExchange: EnsureExchange,
                ensureQueue: EnsureQueue,
                bindQueueToExchange: BindQueueToExchange,
                bindListenerToQueue: BindListenerToQueue
            };

            // setup exported functions
            var SetQueueHandler = function setQueueHandler(handler) {
                if (queueHandler) {
                    helpers.emitError(new Error('handler_already_set'));
                }
                else {
                    queueHandler = handler;
                    helpers.bindListenerToQueue();
                }
            };

            var PublishMessage = function publishMessage(message, messageOptions, callback) {
                if ('function' === typeof messageOptions) {
                    callback = messageOptions;
                    messageOptions = {};
                }
                messageOptions = messageOptions || {};
                if (undefined === messageOptions.persistent) {
                    messageOptions.persistent = true;
                }
                if (undefined === messageOptions.mandatory) {
                    messageOptions.mandatory = true;
                }
                if ('connected' === currentStatus) {
                    var routingKey = messageOptions.routingKey || config.queue.options.routingKey;
                    exchange.send(routingKey, message, messageOptions, callback);
                }
                else {
                    callback('rabbitmq_helper_not_ensured');
                }
            };

            // initializer
            var InitializeRabbitMQHelper = function initializeRabbitMQHelper() {
                if (!(this instanceof InitializeRabbitMQHelper)) {
                    return new InitializeRabbitMQHelper();
                }
                internalEvents.on('connected', function () {
                    connection.on('connection error', function (err) {
                        connection.channel = null;
                        if ('Unexpected close' === err.message) {
                            currentStatus = 'reconnecting';
                        }
                        if (err) {
                            helpers.emitError(err);
                        }
                    });
                    connection.on('reconnected', function () {
                        helpers.ensureExchange();
                    });
                    helpers.ensureExchange();
                });
                internalEvents.on('exchange-ensured', function () {
                    helpers.ensureQueue();
                });
                internalEvents.on('queue-ensured', function () {
                    helpers.bindQueueToExchange(true);
                });
                internalEvents.on('queue-bound', function () {
                    helpers.bindListenerToQueue();
                });
                // connect and fire off events
                connection = _this.rabbit('amqp://' + config.connection.host, config.connection.options).connect(function (err) {
                    if (err) {
                        helpers.emitError(err);
                    }
                });
                if (connection) {
                    internalEvents.emit('connected');
                }
                return _this;
            };

            if (eventHandlers) {
                for (var key in eventHandlers) {
                    _this.on(key, eventHandlers[key]);
                }
            }
            _this.rabbit = require('rabbit-wrapper');
            // variables that need to be different/changeable can be exported
            // as noted at the top of this file any variables there are global to all instantiations

            _this.setQueueHandler = SetQueueHandler;
            _this.publishMessage = PublishMessage;
            // exports functions if needed
            if (options.mocking) {
                _initialize = false;
                _this.initializeRabbitMQHelper = InitializeRabbitMQHelper;
            }
            if (_initialize) {
                return new InitializeRabbitMQHelper();
            }
            return _this;
        }
    });
};

module.exports = SetupRabbitMQHelper;

// setup external EventEmitter
require('util').inherits(module.exports, require('events').EventEmitter);