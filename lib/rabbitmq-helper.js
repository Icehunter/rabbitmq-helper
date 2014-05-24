'use strict';

var connection;
var exchange;
var queue;
var initialized;

function ensureExchangeBinding(connection, callback) {
    var _this = exports;
    var options = _this.options;
    exchange = connection.exchange(options.exchange.name, options.exchange.options, function (exchange_error) {
        if (exchange_error) {
            callback(exchange_error);
        }
    });
    if (exchange) {
        callback(null, connection, exchange);
    }
}

function ensureQueueBinding(processor, connection, exchange, callback) {
    var _this = exports;
    var options = _this.options;
    queue = connection.queue(options.queue.name, options.queue.options, function (queue_error) {
        if (queue_error) {
            callback(queue_error);
        }
    });
    if (queue) {
        queue.bindQueue(exchange.name, options.queue.options.routingKey, function () {
            //flag to ensure queue/exchange/connection are set and bound appropriately before publishing messages
            initialized = true;
            if (processor) {
                queue.listen({
                    ack: true,
                    prefetchCount: options.queue.options.prefetchCount
                }, function (message, ack, headers, fields, m) {
                    processor({
                        message: message,
                        ack: ack,
                        headers: headers,
                        fields: fields,
                        m: m
                    }, callback);
                });
            }
            else {
                callback();
            }
        });
    }
}

function ensureExchange(callback) {
    var _this = exports;
    var options = _this.options;
    connection = _this.rabbit('amqp://' + options.connection.host, options.connection.options).connect(function (connection_error) {
        if (connection_error) {
            callback(connection_error);
        }
    });
    if (connection) {
        connection.on('error', function (err) {
            callback(err);
        });
        connection.on('reconnected', function () {
            ensureExchangeBinding(connection, function () {
            });
        });
        ensureExchangeBinding(connection, callback);
    }
}

var EnsureRabbitMQ = function ensureRabbitMQ(processor, callback) {
    if (!callback) {
        callback = processor;
        processor = null;
    }
    ensureExchange(function (err, connection, exchange) {
        if (err) {
            callback(err);
        }
        else {
            connection.on('reconnected', function () {
                ensureQueueBinding(processor, connection, exchange, callback);
            });
            ensureQueueBinding(processor, connection, exchange, callback);
        }
    });
};

var PublishMessage = function publishMessage(message, options, callback) {
    var _this = exports;
    if ('function' === typeof options) {
        callback = options;
        options = {};
    }
    options = options || {};
    if (initialized) {
        var routingKey = options.routingKey || _this.options.queue.options.routingKey;
        exchange.send(routingKey, message, options, callback);
    }
    else {
        callback('initialize with "ensureRabbitMQ" first');
    }
};

var RabbitMQHelperInit = function rabbitMQHelperInit(options, logger) {
    if (!(this instanceof RabbitMQHelperInit)) {
        return new RabbitMQHelperInit(options, logger);
    }
    connection = null;
    exchange = null;
    queue = null;
    initialized = false;
    var _this = exports;
    _this.logger = logger || console;
    _this.rabbit = require('rabbit-wrapper');
    _this.options = options || {};
    _this.ensureRabbitMQ = EnsureRabbitMQ;
    _this.publishMessage = PublishMessage;
    return _this;
};

module.exports = RabbitMQHelperInit;