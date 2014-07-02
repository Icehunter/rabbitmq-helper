'use strict';

// setup internal EventEmitter
var InternalEvents = function internalEvents() {
    if (!(this instanceof internalEvents)) {
        return new InternalEvents();
    }
};

require('util').inherits(InternalEvents, require('events').EventEmitter);

// emit external errors
function emitError(parent, err) {
    // if you don't listen to this it is not a good idea
    parent.emit('error', {
        err: err,
        message: err.message || 'no_message'
    });
}

// private functions
function ensureExchange(parent) {
    var _this = parent;
    var options = _this.options;
    _this.exchange = _this.connection.exchange(options.exchange.name, options.exchange.options, function (err) {
        if (err) {
            emitError(_this, err);
        }
    });
    if (_this.exchange) {
        _this.internalEvents.emit('exchange-ensured');
    }
}

function ensureQueue(parent) {
    var _this = parent;
    var options = _this.options;
    _this.queue = _this.connection.queue(options.queue.name, options.queue.options, function (err) {
        if (err) {
            emitError(_this, err);
        }
    });
    if (_this.queue) {
        _this.internalEvents.emit('queue-ensured');
    }
}

function bindQueueToExchange(parent, emitEnsured) {
    var _this = parent;
    var options = _this.options;
    _this.queue.bindQueue(_this.exchange.name, options.queue.options.routingKey, function () {
        _this.internalEvents.emit('queue-bound');
        var previousStatus = _this.currentStatus;
        _this.currentStatus = 'connected';
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
}

function bindListenerToQueue(parent) {
    var _this = parent;
    var options = _this.options;
    if (_this.queueHandler) {
        _this.queue.listen({
            ack: true,
            prefetchCount: options.queue.options.prefetchCount
        }, function (message, ack, headers, fields, m) {
            _this.queueHandler({
                message: message,
                ack: ack,
                headers: headers,
                fields: fields,
                m: m
            });
        });
        _this.emit('queue-listening');
    }
}

// export helper functions
var SetQueueHandler = function setQueueHandler(handler) {
    var _this = this;
    if (_this.queueHandler) {
        emitError(_this, new Error('handler_already_set'));
    }
    else {
        _this.queueHandler = handler;
        bindListenerToQueue(_this);
    }
};

var PublishMessage = function publishMessage(message, options, callback) {
    var _this = this;
    if ('function' === typeof options) {
        callback = options;
        options = {};
    }
    options = options || {};
    if (undefined === options.persistent) {
        options.persistent = true;
    }
    if (undefined === options.mandatory) {
        options.mandatory = true;
    }
    if ('connected' === _this.currentStatus) {
        var routingKey = options.routingKey || _this.options.queue.options.routingKey;
        _this.exchange.send(routingKey, message, options, callback);
    }
    else {
        callback('rabbitmq_helper_not_ensured');
    }
};

// initializer
var InitializeRabbitMQHelper = function initializeRabbitMQHelper(parent) {
    if (!(this instanceof InitializeRabbitMQHelper)) {
        return new InitializeRabbitMQHelper(parent);
    }
    var _this = parent || this;
    var options = _this.options;
    _this.internalEvents.on('connected', function () {
        _this.connection.on('connection error', function (err) {
            _this.connection.channel = null;
            if ('Unexpected close' === err.message) {
                _this.currentStatus = 'reconnecting';
            }
            if (err) {
                emitError(_this, err);
            }
        });
        _this.connection.on('reconnected', function () {
            ensureExchange(_this);
        });
        ensureExchange(_this);
    });
    _this.internalEvents.on('exchange-ensured', function () {
        ensureQueue(_this);
    });
    _this.internalEvents.on('queue-ensured', function () {
        bindQueueToExchange(_this, true);
    });
    _this.internalEvents.on('queue-bound', function () {
        bindListenerToQueue(_this);
    });
    // connect and fire off events
    _this.connection = _this.rabbit('amqp://' + options.connection.host, options.connection.options).connect(function (err) {
        if (err) {
            emitError(_this, err);
        }
    });
    if (_this.connection) {
        _this.internalEvents.emit('connected');
    }
    return _this;
};

// module entry point
var SetupRabbitMQHelper = function setupRabbitMQHelper(config, eventHandlers) {
    if (!(this instanceof SetupRabbitMQHelper)) {
        return new SetupRabbitMQHelper(config, eventHandlers);
    }
    var _initialize = true;
    var _this = this;
    config = config || {};
    require('./validators/config')(config, function (err) {
        if (err) {
            throw new Error(err);
        }
        else {
            if (eventHandlers) {
                for (var key in eventHandlers) {
                    _this.on(key, eventHandlers[key]);
                }
            }
            _this.rabbit = require('rabbit-wrapper');
            // variables that need to be different/changeable can be exported
            // as noted at the top of this file any variables there are global to all instantiations
            _this.options = config || {};
            _this.logger = _this.options.logger || console;
            _this.connection = null;
            _this.exchange = null;
            _this.queue = null;
            _this.currentStatus = 'initializing';
            _this.internalEvents = new InternalEvents();
            _this.setQueueHandler = SetQueueHandler;
            _this.publishMessage = PublishMessage;
            // exports functions if needed
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

// setup external EventEmitter
require('util').inherits(module.exports, require('events').EventEmitter);