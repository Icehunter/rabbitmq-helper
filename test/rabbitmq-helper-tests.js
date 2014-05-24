'use strict';

process.env.NODE_ENV = 'test';

var stubs = {};
var should = require('should');

var config = {
    connection: {
        host: '127.0.0.1',
        options: {
            reconnect: true
        }
    },
    exchange: {
        name: 'testing-exchange',
        options: {
            type: 'fanout',
            durable: false,
            autoDelete: false
        }
    },
    queue: {
        name: 'testing-queue',
        options: {
            routingKey: 'all-routing',
            durable: true,
            autoDelete: false,
            prefetchCount: 1
        }
    }
};

var rabbitMQHelper = require('../lib/rabbitmq-helper');
var helper;
var sinon = require('sinon');

describe('RabbitMQ Helper Tests', function () {
    beforeEach(function (done) {
        for (var stub in stubs) {
            try {
                stubs[stub].restore();
            }
            catch (err) {
                console.log(err);
            }
        }
        done();
    });
    describe('Initializing', function () {
        describe('with no params', function () {
            it('should be successful', function (done) {
                helper = rabbitMQHelper();
                JSON.stringify(helper.options).should.equal(JSON.stringify({}));
                done();
            });
        });
        describe('with only config', function () {
            it('should be successful', function (done) {
                helper = rabbitMQHelper(config);
                JSON.stringify(helper.options).should.equal(JSON.stringify(config));
                done();
            });
        });
        describe('with config and a logger', function () {
            it('should be successful', function (done) {
                helper = rabbitMQHelper(config, console);
                JSON.stringify(helper.options).should.equal(JSON.stringify(config));
                done();
            });
        });
    });
    describe('Function Calls', function () {
        describe('"ensureRabbitMQ"', function () {
            describe('when RabbitMQ is offline', function () {
                it('should callback an error', function (done) {
                    stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                callback('error');
                            }
                        };
                    });
                    helper.ensureRabbitMQ(sinon.stub(), function (err) {
                        should.exist(err);
                        done();
                    });
                });
            });
            describe('when RabbitMQ is online', function () {
                describe('and only used as a publisher [no processor passed]', function () {
                    it('should not callback an connection_error', function (done) {
                        stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                            return {
                                connect: function (callback) {
                                    var connect = {
                                        on: function () {
                                        },
                                        exchange: function (name, options, callback) {
                                            var exchange = {};
                                            callback(null);
                                            return exchange;
                                        },
                                        queue: function (name, options, callback) {
                                            var queue = {
                                                bindQueue: function (exchange, routingKey, callback) {
                                                    callback(null);
                                                },
                                                listen: function (options, callback) {
                                                    var ack = function () {
                                                    };
                                                    callback({}, ack, {}, {
                                                        routingKey: config.queue.options.routingKey
                                                    });
                                                }
                                            };
                                            callback(null);
                                            return queue;
                                        }
                                    };
                                    callback(null);
                                    return connect;
                                }
                            };
                        });
                        helper.ensureRabbitMQ(function (err) {
                            should.not.exist(err);
                            done();
                        });
                    });
                });
                describe('and only as a subscriber or publisher [processor passed]', function () {
                    it('should not callback an connection_error', function (done) {
                        stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                            return {
                                connect: function (callback) {
                                    var connect = {
                                        on: function () {
                                        },
                                        exchange: function (name, options, callback) {
                                            var exchange = {};
                                            callback(null);
                                            return exchange;
                                        },
                                        queue: function (name, options, callback) {
                                            var queue = {
                                                bindQueue: function (exchange, routingKey, callback) {
                                                    callback(null);
                                                },
                                                listen: function (options, callback) {
                                                    var ack = function () {
                                                    };
                                                    callback({}, ack, {}, {
                                                        routingKey: config.queue.options.routingKey
                                                    });
                                                }
                                            };
                                            callback(null);
                                            return queue;
                                        }
                                    };
                                    callback(null);
                                    return connect;
                                }
                            };
                        });
                        var processor = function (message, callback) {
                            callback(null, message);
                        };
                        helper.ensureRabbitMQ(processor, function (err) {
                            should.not.exist(err);
                            done();
                        });
                    });
                });
            });
        });
    });
    describe('Connection Events', function () {
        describe('connection [ready]', function () {
            it('should fire when connected', function (done) {
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function (event, callback) {
                                    switch (event) {
                                        case 'ready':
                                            callback();
                                            break;
                                    }
                                },
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback(null);
                                    return exchange;
                                },
                                queue: function (name, options, callback) {
                                    var queue = {
                                        bindQueue: function (exchange, routingKey, callback) {
                                            callback(null);
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {
                                            };
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            });
                                        }
                                    };
                                    callback(null);
                                    return queue;
                                }
                            };
                            callback(null);
                            return connect;
                        }
                    };
                });
                helper.ensureRabbitMQ(function (err) {
                    should.not.exist(err);
                    done();
                });
            });
        });
        describe('connection [error]', function () {
            it('should fire if a connection has an error', function (done) {
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function () {
                            var connect = {
                                on: function (event, callback) {
                                    switch (event) {
                                        case 'error':
                                            callback('error');
                                            break;
                                    }
                                },
                                exchange: function () {
                                    var exchange = {};
                                    return exchange;
                                },
                                queue: function () {
                                    var queue = {
                                        bindQueue: function () {
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {
                                            };
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            });
                                        }
                                    };
                                    return queue;
                                }
                            };
                            return connect;
                        }
                    };
                });
                helper.ensureRabbitMQ(function (err) {
                    should.exist(err);
                    done();
                });
            });
        });
        describe('connection [ready]', function () {
            it('should fire when connected', function (done) {
                var called = false;
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function () {
                            var connect = {
                                on: function (event, callback) {
                                    switch (event) {
                                        case 'reconnected':
                                            callback();
                                            break;
                                    }
                                },
                                exchange: function () {
                                    var exchange = {};
                                    return exchange;
                                },
                                queue: function () {
                                    var queue = {
                                        bindQueue: function (exchange, routingKey, callback) {
                                            if (!called) {
                                                called = true;
                                                callback(null);
                                            }
                                        }
                                    };
                                    return queue;
                                }
                            };
                            return connect;
                        }
                    };
                });
                helper.ensureRabbitMQ(function (err) {
                    should.not.exist(err);
                    done();
                });
            });
        });
    });
    describe('Exchange Creation Errors', function () {
        it('should callback an error', function (done) {
            stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                return {
                    connect: function (callback) {
                        var connect = {
                            on: function () {
                            },
                            exchange: function (name, options, callback) {
                                callback('error');
                            }
                        };
                        callback(null);
                        return connect;
                    }
                };
            });
            var processor = function (message, callback) {
                callback(null, message);
            };
            helper.ensureRabbitMQ(processor, function (err) {
                should.exist(err);
                done();
            });
        });
    });
    describe('Queue Creation Errors', function () {
        it('should callback an error', function (done) {
            stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                return {
                    connect: function (callback) {
                        var connect = {
                            on: function () {
                            },
                            exchange: function (name, options, callback) {
                                var exchange = {};
                                callback(null);
                                return exchange;
                            },
                            queue: function (name, routingKey, callback) {
                                callback('error');
                            }
                        };
                        callback(null);
                        return connect;
                    }
                };
            });
            var processor = function (message, callback) {
                callback(null, message);
            };
            helper.ensureRabbitMQ(processor, function (err) {
                should.exist(err);
                done();
            });
        });
    });
    describe('Subscriber Processing', function () {
        describe('when picking up a message from the queue', function () {
            describe('and the processor function is successful', function () {
                it('should not callback an error', function (done) {
                    stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {
                                    },
                                    exchange: function (name, options, callback) {
                                        var exchange = {};
                                        callback(null);
                                        return exchange;
                                    },
                                    queue: function (name, options, callback) {
                                        var queue = {
                                            bindQueue: function (exchange, routingKey, callback) {
                                                callback(null);
                                            },
                                            listen: function (options, callback) {
                                                var ack = function () {
                                                };
                                                callback({}, ack, {}, {
                                                    routingKey: config.queue.options.routingKey
                                                });
                                            }
                                        };
                                        callback(null);
                                        return queue;
                                    }
                                };
                                callback(null);
                                return connect;
                            }
                        };
                    });
                    var processor = function (message, callback) {
                        callback(null, message);
                    };
                    helper.ensureRabbitMQ(processor, function (err) {
                        should.not.exist(err);
                        done();
                    });
                });
            });
            describe('and the processor function is not successful', function () {
                it('should callback an error', function (done) {
                    stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {
                                    },
                                    exchange: function (name, options, callback) {
                                        var exchange = {};
                                        callback(null);
                                        return exchange;
                                    },
                                    queue: function (name, options, callback) {
                                        var queue = {
                                            bindQueue: function (exchange, routingKey, callback) {
                                                callback(null);
                                            },
                                            listen: function (options, callback) {
                                                var ack = function () {
                                                };
                                                callback({}, ack, {}, {
                                                    routingKey: config.queue.options.routingKey
                                                });
                                            }
                                        };
                                        callback(null);
                                        return queue;
                                    }
                                };
                                callback(null);
                                return connect;
                            }
                        };
                    });
                    var processor = function (message, callback) {
                        callback('error');
                    };
                    helper.ensureRabbitMQ(processor, function (err) {
                        should.exist(err);
                        done();
                    });
                });
            });
        });
    });
    describe('Exchange Publishing', function () {
        describe('when the helper is ensured', function () {
            describe('and options are not passed', function () {
                it('should publish the message', function (done) {
                    stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {
                                    },
                                    exchange: function (name, options, callback) {
                                        var exchange = {
                                            send: function (routingKey, message, options, callback) {
                                                callback(null, true);
                                            }
                                        };
                                        callback(null);
                                        return exchange;
                                    },
                                    queue: function (name, options, callback) {
                                        var queue = {
                                            bindQueue: function (exchange, routingKey, callback) {
                                                callback(null);
                                            }
                                        };
                                        callback(null);
                                        return queue;
                                    }
                                };
                                callback(null);
                                return connect;
                            }
                        };
                    });
                    helper.ensureRabbitMQ(function (err) {
                        should.not.exist(err);
                        helper.publishMessage({}, function (err, delivered) {
                            should.not.exist(err);
                            delivered.should.equal(true);
                            done();
                        });
                    });
                });
            });
            describe('and publishing succeeds', function () {
                it('should publish the message', function (done) {
                    stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {
                                    },
                                    exchange: function (name, options, callback) {
                                        var exchange = {
                                            send: function (routingKey, message, options, callback) {
                                                callback(null, true);
                                            }
                                        };
                                        callback(null);
                                        return exchange;
                                    },
                                    queue: function (name, options, callback) {
                                        var queue = {
                                            bindQueue: function (exchange, routingKey, callback) {
                                                callback(null);
                                            }
                                        };
                                        callback(null);
                                        return queue;
                                    }
                                };
                                callback(null);
                                return connect;
                            }
                        };
                    });
                    helper.ensureRabbitMQ(function (err) {
                        should.not.exist(err);
                        helper.publishMessage({}, {}, function (err, delivered) {
                            should.not.exist(err);
                            delivered.should.equal(true);
                            done();
                        });
                    });
                });
            });
            describe('and publishing fails', function () {
                it('should not publish the message', function (done) {
                    stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {
                                    },
                                    exchange: function (name, options, callback) {
                                        var exchange = {
                                            send: function (routingKey, message, options, callback) {
                                                callback('error', false);
                                            }
                                        };
                                        callback(null);
                                        return exchange;
                                    },
                                    queue: function (name, options, callback) {
                                        var queue = {
                                            bindQueue: function (exchange, routingKey, callback) {
                                                callback(null);
                                            }
                                        };
                                        callback(null);
                                        return queue;
                                    }
                                };
                                callback(null);
                                return connect;
                            }
                        };
                    });
                    helper.ensureRabbitMQ(function (err) {
                        should.not.exist(err);
                        helper.publishMessage({}, {}, function (err, delivered) {
                            should.exist(err);
                            delivered.should.equal(false);
                            done();
                        });
                    });
                });
            });
        });
        describe('when the helper is not ensured', function () {
            it('should callback an error', function (done) {
                rabbitMQHelper().publishMessage({}, {}, function (err) {
                    should.exist(err);
                    done();
                });
            });
        });
    });
});