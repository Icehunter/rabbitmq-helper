'use strict';

var EnsureExchangeBinding = function ensureExchangeBinding(connection, callback) {
    var _this = this;
    var options = _this.options;
    _this.exchange = connection.exchange(options.exchange.name, options.exchange.options, function (exchange_error) {
        if (exchange_error) {
            callback(exchange_error);
        }
    });
    if (_this.exchange) {
        callback(null, connection, _this.exchange);
    }
};

var EnsureQueueBinding = function ensureQueueBinding(processor, connection, exchange, callback) {
    var _this = this;
    var options = _this.options;
    _this.queue = connection.queue(options.queue.name, options.queue.options, function (queue_error) {
        if (queue_error) {
            callback(queue_error);
        }
    });
    if (_this.queue) {
        _this.queue.bindQueue(exchange.name, options.queue.options.routingKey, function () {
            //flag to ensure queue/exchange/connection are set and bound appropriately before publishing messages
            _this.initialized = true;
            if (processor) {
                _this.queue.listen({
                    ack: true,
                    prefetchCount: options.queue.options.prefetchCount
                }, function (message, ack, headers, fields, m) {
                    processor({
                        message: message,
                        ack: ack,
                        headers: headers,
                        fields: fields,
                        m: m
                    });
                });
            }
            else {
                callback();
            }
        });
    }
};

var EnsureExchange = function ensureExchange(callback) {
    var _this = this;
    var options = _this.options;
    _this.connection = _this.rabbit('amqp://' + options.connection.host, options.connection.options).connect(function (connection_error) {
        if (connection_error) {
            callback(connection_error);
        }
    });
    if (_this.connection) {
        _this.connection.on('error', function (err) {
            callback(err);
        });
        _this.connection.on('reconnected', function () {
            _this.ensureExchangeBinding(_this.connection, function () {
            });
        });
        _this.ensureExchangeBinding(_this.connection, callback);
    }
};

var EnsureRabbitMQ = function ensureRabbitMQ(processor, callback) {
    var _this = this;
    if (!callback) {
        callback = processor;
        processor = null;
    }
    _this.ensureExchange(function (err, connection, exchange) {
        if (err) {
            callback(err);
        }
        else {
            _this.connection.on('reconnected', function () {
                _this.ensureQueueBinding(processor, connection, exchange, callback);
            });
            _this.ensureQueueBinding(processor, connection, exchange, callback);
        }
    });
};

var PublishMessage = function publishMessage(message, options, callback) {
    var _this = this;
    if ('function' === typeof options) {
        callback = options;
        options = {};
    }
    options = options || {};
    if (_this.initialized) {
        var routingKey = options.routingKey || _this.options.queue.options.routingKey;
        _this.exchange.send(routingKey, message, options, callback);
    }
    else {
        callback('initialize with "ensureRabbitMQ" first');
    }
};

var InitializeRabbitMQHelper = function initializeRabbitMQHelper(parent) {
    if (!(this instanceof InitializeRabbitMQHelper)) {
        return new InitializeRabbitMQHelper(parent);
    }
    var _this = parent || this;
    _this.rabbit = _this.imports.rabbit;
    return _this;
};

var SetupRabbitMQHelper = function setupRabbitMQHelper(config) {
    if (!(this instanceof SetupRabbitMQHelper)) {
        return new SetupRabbitMQHelper(config);
    }
    var _initialize = true;
    var _this = this;
    config = config || {};
    require('./validators/config')(config, function (err) {
        if (err) {
            throw new Error(err);
        }
        else {
            // instantiate anything here that needs to be mocked in tests
            _this.imports = {};
            _this.imports.rabbit = require('rabbit-wrapper');

            // variables that need to be different/changeable can be exported
            // as noted at the top of this file any variables there are global to all instantiations
            _this.options = config || {};
            _this.logger = _this.options.logger || console;

            _this.connection = null;
            _this.exchange = null;
            _this.queue = null;
            _this.initialized = false;

            // exports functions if needed
            _this.ensureExchangeBinding = EnsureExchangeBinding;
            _this.ensureQueueBinding = EnsureQueueBinding;
            _this.ensureExchange = EnsureExchange;
            _this.ensureRabbitMQ = EnsureRabbitMQ;
            _this.publishMessage = PublishMessage;

            if (_this.options.mocking) {
                _initialize = false;
                _this.initializeRabbitMQHelper = InitializeRabbitMQHelper;
            }
            if (_initialize) {
                return new InitializeRabbitMQHelper(_this);
            }
            return _this;
        }
    });
};

module.exports = SetupRabbitMQHelper;