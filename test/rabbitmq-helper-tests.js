'use strict';

process.env.NODE_ENV = 'test';

var stubs = {};
var should = require('should');

function generateConfig(mocked) {
    var result = {
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
    };
    if (mocked) {
        result.mocking = {};
    }
    return result;
}

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
        helper = null;
        done();
    });
    describe('Initializing', function () {
        describe('with no "config"', function () {
            it('should throw an error', function (done) {
                try {
                    rabbitMQHelper();
                }
                catch (err) {
                    done();
                }
            });
        });
        describe('with a proper "config"', function () {
            it('should be successful', function (done) {
                var test = rabbitMQHelper(generateConfig(true));
                JSON.stringify(test.options).should.equal(JSON.stringify(generateConfig(true)));
                done();
            });
        });
    });
    describe('Function Calls', function () {
        describe('"ensureRabbitMQ"', function () {
            describe('when RabbitMQ is offline', function () {
                it('should callback an error', function (done) {
                    helper = rabbitMQHelper(generateConfig(true));
                    helper.initializeRabbitMQHelper(helper);
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
                        var config = generateConfig();
                        helper = rabbitMQHelper(generateConfig(true));
                        helper.initializeRabbitMQHelper(helper);
                        stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                            return {
                                connect: function (callback) {
                                    var connect = {
                                        on: function () {
                                        },
                                        exchange: function (name, options, callback) {
                                            var exchange = {};
                                            callback();
                                            return exchange;
                                        },
                                        queue: function (name, options, callback) {
                                            var queue = {
                                                bindQueue: function (exchange, routingKey, callback) {
                                                    callback();
                                                },
                                                listen: function (options, callback) {
                                                    var ack = function () {
                                                    };
                                                    callback({}, ack, {}, {
                                                        routingKey: config.queue.options.routingKey
                                                    });
                                                }
                                            };
                                            callback();
                                            return queue;
                                        }
                                    };
                                    callback();
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
                        var config = generateConfig();
                        helper = rabbitMQHelper(generateConfig(true));
                        helper.initializeRabbitMQHelper(helper);
                        stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                            return {
                                connect: function (callback) {
                                    var connect = {
                                        on: function () {
                                        },
                                        exchange: function (name, options, callback) {
                                            var exchange = {};
                                            callback();
                                            return exchange;
                                        },
                                        queue: function (name, options, callback) {
                                            var queue = {
                                                bindQueue: function (exchange, routingKey, callback) {
                                                    callback();
                                                },
                                                listen: function (options, callback) {
                                                    var ack = function () {
                                                    };
                                                    callback({}, ack, {}, {
                                                        routingKey: config.queue.options.routingKey
                                                    });
                                                }
                                            };
                                            callback();
                                            return queue;
                                        }
                                    };
                                    callback();
                                    return connect;
                                }
                            };
                        });
                        var processor = function () {
                            done();
                        };
                        helper.ensureRabbitMQ(processor, function () {
                        });
                    });
                });
                describe('and was already initilized the first time', function () {
                    it('should callback without initializing', function (done) {
                        var config = generateConfig();
                        helper = rabbitMQHelper(generateConfig(true));
                        helper.initializeRabbitMQHelper(helper);
                        stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                            return {
                                connect: function (callback) {
                                    var connect = {
                                        on: function () {
                                        },
                                        exchange: function (name, options, callback) {
                                            var exchange = {};
                                            callback();
                                            return exchange;
                                        },
                                        queue: function (name, options, callback) {
                                            var queue = {
                                                bindQueue: function (exchange, routingKey, callback) {
                                                    callback();
                                                },
                                                listen: function (options, callback) {
                                                    var ack = function () {
                                                    };
                                                    callback({}, ack, {}, {
                                                        routingKey: config.queue.options.routingKey
                                                    });
                                                }
                                            };
                                            callback();
                                            return queue;
                                        }
                                    };
                                    callback();
                                    return connect;
                                }
                            };
                        });
                        var processor = function () {
                            done();
                        };
                        helper.ensureRabbitMQ(processor, function () {
                        });
                        // second ensure
                        helper.ensureRabbitMQ(processor, function () {
                        });
                    });
                });
            });
        });
    });
    describe('Connection Events', function () {
        describe('connection [ready]', function () {
            it('should fire when connected', function (done) {
                var config = generateConfig();
                helper = rabbitMQHelper(generateConfig(true));
                helper.initializeRabbitMQHelper(helper);
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
                                    callback();
                                    return exchange;
                                },
                                queue: function (name, options, callback) {
                                    var queue = {
                                        bindQueue: function (exchange, routingKey, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {
                                            };
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            });
                                        }
                                    };
                                    callback();
                                    return queue;
                                }
                            };
                            callback();
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
        describe('connection [connection error]', function () {
            it('should fire if a connection has a connection error', function (done) {
                var config = generateConfig();
                helper = rabbitMQHelper(generateConfig(true));
                helper.initializeRabbitMQHelper(helper);
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function () {
                            var connect = {
                                on: function (event, callback) {
                                    switch (event) {
                                        case 'connection error':
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
                helper = rabbitMQHelper(generateConfig(true));
                helper.initializeRabbitMQHelper(helper);
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
                                                callback();
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
            helper = rabbitMQHelper(generateConfig(true));
            helper.initializeRabbitMQHelper(helper);
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
                        callback();
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
            helper = rabbitMQHelper(generateConfig(true));
            helper.initializeRabbitMQHelper(helper);
            stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                return {
                    connect: function (callback) {
                        var connect = {
                            on: function () {
                            },
                            exchange: function (name, options, callback) {
                                var exchange = {};
                                callback();
                                return exchange;
                            },
                            queue: function (name, routingKey, callback) {
                                callback('error');
                            }
                        };
                        callback();
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
        describe('when picking up a queue item', function () {
            it('should have a "message" object', function (done) {
                var config = generateConfig();
                helper = rabbitMQHelper(generateConfig(true));
                helper.initializeRabbitMQHelper(helper);
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {
                                },
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function (name, options, callback) {
                                    var queue = {
                                        bindQueue: function (exchange, routingKey, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {
                                            };
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            }, {});
                                        }
                                    };
                                    callback();
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                var processor = function (queue_item) {
                    should.exist(queue_item.message);
                    (queue_item.message.constructor === {}.constructor).should.equal(true);
                    done();
                };
                helper.ensureRabbitMQ(processor, function () {
                });
            });
            it('should have a "ack" function', function (done) {
                var config = generateConfig();
                helper = rabbitMQHelper(generateConfig(true));
                helper.initializeRabbitMQHelper(helper);
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {
                                },
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function (name, options, callback) {
                                    var queue = {
                                        bindQueue: function (exchange, routingKey, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {
                                            };
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            }, {});
                                        }
                                    };
                                    callback();
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                var processor = function (queue_item) {
                    should.exist(queue_item.ack);
                    ('function' === typeof queue_item.ack).should.equal(true);
                    done();
                };
                helper.ensureRabbitMQ(processor, function () {
                });
            });
            it('should have a "headers" object', function (done) {
                var config = generateConfig();
                helper = rabbitMQHelper(generateConfig(true));
                helper.initializeRabbitMQHelper(helper);
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {
                                },
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function (name, options, callback) {
                                    var queue = {
                                        bindQueue: function (exchange, routingKey, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {
                                            };
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            }, {});
                                        }
                                    };
                                    callback();
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                var processor = function (queue_item) {
                    should.exist(queue_item.headers);
                    (queue_item.headers.constructor === {}.constructor).should.equal(true);
                    done();
                };
                helper.ensureRabbitMQ(processor, function () {
                });
            });
            it('should have a "fields" object', function (done) {
                var config = generateConfig();
                helper = rabbitMQHelper(generateConfig(true));
                helper.initializeRabbitMQHelper(helper);
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {
                                },
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function (name, options, callback) {
                                    var queue = {
                                        bindQueue: function (exchange, routingKey, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {
                                            };
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            }, {});
                                        }
                                    };
                                    callback();
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                var processor = function (queue_item) {
                    should.exist(queue_item.fields);
                    (queue_item.fields.constructor === {}.constructor).should.equal(true);
                    done();
                };
                helper.ensureRabbitMQ(processor, function () {
                });
            });
            it('should have a "m" object', function (done) {
                var config = generateConfig();
                helper = rabbitMQHelper(generateConfig(true));
                helper.initializeRabbitMQHelper(helper);
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {
                                },
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function (name, options, callback) {
                                    var queue = {
                                        bindQueue: function (exchange, routingKey, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {
                                            };
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            }, {});
                                        }
                                    };
                                    callback();
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                var processor = function (queue_item) {
                    should.exist(queue_item.m);
                    (queue_item.m.constructor === {}.constructor).should.equal(true);
                    done();
                };
                helper.ensureRabbitMQ(processor, function () {
                });
            });
        });
    });
    describe('Exchange Publishing', function () {
        describe('when the helper is ensured', function () {
            describe('and options are not passed', function () {
                it('should publish the message', function (done) {
                    helper = rabbitMQHelper(generateConfig(true));
                    helper.initializeRabbitMQHelper(helper);
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
                                        callback();
                                        return exchange;
                                    },
                                    queue: function (name, options, callback) {
                                        var queue = {
                                            bindQueue: function (exchange, routingKey, callback) {
                                                callback();
                                            }
                                        };
                                        callback();
                                        return queue;
                                    }
                                };
                                callback();
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
                    helper = rabbitMQHelper(generateConfig(true));
                    helper.initializeRabbitMQHelper(helper);
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
                                        callback();
                                        return exchange;
                                    },
                                    queue: function (name, options, callback) {
                                        var queue = {
                                            bindQueue: function (exchange, routingKey, callback) {
                                                callback();
                                            }
                                        };
                                        callback();
                                        return queue;
                                    }
                                };
                                callback();
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
                    helper = rabbitMQHelper(generateConfig(true));
                    helper.initializeRabbitMQHelper(helper);
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
                                        callback();
                                        return exchange;
                                    },
                                    queue: function (name, options, callback) {
                                        var queue = {
                                            bindQueue: function (exchange, routingKey, callback) {
                                                callback();
                                            }
                                        };
                                        callback();
                                        return queue;
                                    }
                                };
                                callback();
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
                helper = rabbitMQHelper(generateConfig(true));
                helper.publishMessage({}, function (err) {
                    should.exist(err);
                    done();
                });
            });
        });
    });
});