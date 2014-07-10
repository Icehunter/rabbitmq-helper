/* global describe, it, beforeEach */

'use strict';

process.env.NODE_ENV = 'test';

var stubs = {};
var should = require('should');

function generateOptions(mocked) {
    var result = {
        config: {
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
            it('should be succesful', function (done) {
                rabbitMQHelper();
                done();
            });
        });
        describe('with a proper "config" and no event handlers', function () {
            it('should be successful', function (done) {
                rabbitMQHelper(generateOptions(true));
                done();
            });
        });
        describe('with a proper "config" and event handlers', function () {
            it('should be successful', function (done) {
                rabbitMQHelper(generateOptions(true), {
                    initialized: function () {},
                    reconnected: function () {},
                    error: function () {}
                });
                done();
            });
        });
    });
    describe('Function Calls', function () {
        describe('"setQueueHandler"', function () {
            describe('and it\'s called once', function () {
                it('should should not have an error and fire the "queue-listening" event', function (done) {
                    var myHelper;
                    var eventHandlers = {
                        initialized: function () {
                            myHelper.setQueueHandler(function () {});
                        },
                        reconnected: function () {},
                        error: function () {},
                        'queue-listening': function () {}
                    };
                    var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                    var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                    var errorSpy = sinon.spy(eventHandlers, 'error');
                    var queueListeningSpy = sinon.spy(eventHandlers, 'queue-listening');
                    myHelper = rabbitMQHelper(generateOptions(true), eventHandlers);
                    stubs.rabbit = sinon.stub(myHelper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {},
                                    exchange: function (name, options, callback) {
                                        var exchange = {};
                                        callback();
                                        return exchange;
                                    },
                                    queue: function () {
                                        var queue = {
                                            bindQueue: function (name, options, callback) {
                                                callback();
                                            },
                                            listen: function () {}
                                        };
                                        return queue;
                                    }
                                };
                                callback();
                                return connect;
                            }
                        };
                    });
                    myHelper.initializeRabbitMQHelper(myHelper);
                    initializedSpy.callCount.should.equal(1);
                    reconnectedSpy.callCount.should.equal(0);
                    errorSpy.callCount.should.equal(0);
                    queueListeningSpy.callCount.should.equal(1);
                    done();
                });
            });
            describe('and it\'s called twice', function () {
                it('should fire the "error"', function (done) {
                    var myHelper;
                    var eventHandlers = {
                        initialized: function () {
                            myHelper.setQueueHandler(function () {});
                        },
                        reconnected: function () {},
                        error: function () {},
                        'queue-listening': function () {
                            myHelper.setQueueHandler(function () {});
                        }
                    };
                    var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                    var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                    var errorSpy = sinon.spy(eventHandlers, 'error');
                    var queueListeningSpy = sinon.spy(eventHandlers, 'queue-listening');
                    myHelper = rabbitMQHelper(generateOptions(true), eventHandlers);
                    stubs.rabbit = sinon.stub(myHelper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {},
                                    exchange: function (name, options, callback) {
                                        var exchange = {};
                                        callback();
                                        return exchange;
                                    },
                                    queue: function () {
                                        var queue = {
                                            bindQueue: function (name, options, callback) {
                                                callback();
                                            },
                                            listen: function () {}
                                        };
                                        return queue;
                                    }
                                };
                                callback();
                                return connect;
                            }
                        };
                    });
                    myHelper.initializeRabbitMQHelper(myHelper);
                    initializedSpy.callCount.should.equal(1);
                    reconnectedSpy.callCount.should.equal(0);
                    errorSpy.callCount.should.equal(1);
                    queueListeningSpy.callCount.should.equal(1);
                    done();
                });
            });
        });
    });
    describe('Event Handling', function () {
        describe('[initialized]', function () {
            it('should fire the "initialized" when fully initialized', function (done) {
                var options = generateOptions(true);
                var config = options.config;
                var eventHandlers = {
                    initialized: function () {},
                    reconnected: function () {},
                    error: function () {}
                };
                var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                var errorSpy = sinon.spy(eventHandlers, 'error');
                helper = rabbitMQHelper(generateOptions(true), eventHandlers);
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {},
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function () {
                                    var queue = {
                                        bindQueue: function (name, options, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {};
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            });
                                        }
                                    };
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                helper.initializeRabbitMQHelper(helper);
                initializedSpy.callCount.should.equal(1);
                reconnectedSpy.callCount.should.equal(0);
                errorSpy.callCount.should.equal(0);
                done();
            });
        });
        describe('[reconnected]', function () {
            it('should fire the "reconnected" when rabbitmq comes back online', function (done) {
                var called = false;
                var options = generateOptions(true);
                var config = options.config;
                var eventHandlers = {
                    initialized: function () {},
                    reconnected: function () {},
                    error: function () {}
                };
                var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                var errorSpy = sinon.spy(eventHandlers, 'error');
                helper = rabbitMQHelper(generateOptions(true), eventHandlers);
                stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function (event, callback) {
                                    switch (event) {
                                    case 'connection error':
                                        callback(new Error('Unexpected close'));
                                        break;
                                    case 'reconnected':
                                        callback();
                                        break;
                                    }
                                },
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function () {
                                    var queue = {
                                        bindQueue: function (name, options, callback) {
                                            if (!called) {
                                                called = true;
                                                callback();
                                            }
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {};
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            });
                                        }
                                    };
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                helper.initializeRabbitMQHelper(helper);
                initializedSpy.callCount.should.equal(0);
                reconnectedSpy.callCount.should.equal(1);
                errorSpy.callCount.should.equal(1);
                done();
            });
        });
        describe('[error]', function () {
            describe('and it\'s a "connect error"', function () {
                it('should fire the "error" event once', function (done) {
                    var eventHandlers = {
                        initialized: function () {},
                        reconnected: function () {},
                        error: function () {}
                    };
                    var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                    var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                    var errorSpy = sinon.spy(eventHandlers, 'error');
                    helper = rabbitMQHelper(generateOptions(true), eventHandlers);
                    stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                callback('error');
                                return null;
                            }
                        };
                    });
                    helper.initializeRabbitMQHelper(helper);
                    initializedSpy.callCount.should.equal(0);
                    reconnectedSpy.callCount.should.equal(0);
                    errorSpy.callCount.should.equal(1);
                    done();
                });
            });
            describe('and it\'s a "connection error"', function () {
                it('should fire the "error" event once', function (done) {
                    var called = false;
                    var options = generateOptions(true);
                    var config = options.config;
                    var eventHandlers = {
                        initialized: function () {},
                        reconnected: function () {},
                        error: function () {}
                    };
                    var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                    var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                    var errorSpy = sinon.spy(eventHandlers, 'error');
                    helper = rabbitMQHelper(generateOptions(true), eventHandlers);
                    stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function (event, callback) {
                                        switch (event) {
                                        case 'connection error':
                                            callback('error');
                                            break;
                                        }
                                    },
                                    exchange: function (name, options, callback) {
                                        var exchange = {};
                                        callback();
                                        return exchange;
                                    },
                                    queue: function () {
                                        var queue = {
                                            bindQueue: function (name, options, callback) {
                                                if (!called) {
                                                    called = true;
                                                    callback();
                                                }
                                            },
                                            listen: function (options, callback) {
                                                var ack = function () {};
                                                callback({}, ack, {}, {
                                                    routingKey: config.queue.options.routingKey
                                                });
                                            }
                                        };
                                        return queue;
                                    }
                                };
                                callback();
                                return connect;
                            }
                        };
                    });
                    helper.initializeRabbitMQHelper(helper);
                    initializedSpy.callCount.should.equal(1);
                    reconnectedSpy.callCount.should.equal(0);
                    errorSpy.callCount.should.equal(1);
                    done();
                });
            });
            describe('and it\'s a "exchange error"', function () {
                it('should fire the "error" event once', function (done) {
                    var called = false;
                    var options = generateOptions(true);
                    var config = options.config;
                    var eventHandlers = {
                        initialized: function () {},
                        reconnected: function () {},
                        error: function () {}
                    };
                    var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                    var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                    var errorSpy = sinon.spy(eventHandlers, 'error');
                    helper = rabbitMQHelper(generateOptions(true), eventHandlers);
                    stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {},
                                    exchange: function (name, options, callback) {
                                        callback('error');
                                        return null;
                                    },
                                    queue: function () {
                                        var queue = {
                                            bindQueue: function (name, options, callback) {
                                                if (!called) {
                                                    called = true;
                                                    callback();
                                                }
                                            },
                                            listen: function (options, callback) {
                                                var ack = function () {};
                                                callback({}, ack, {}, {
                                                    routingKey: config.queue.options.routingKey
                                                });
                                            }
                                        };
                                        return queue;
                                    }
                                };
                                callback();
                                return connect;
                            }
                        };
                    });
                    helper.initializeRabbitMQHelper(helper);
                    initializedSpy.callCount.should.equal(0);
                    reconnectedSpy.callCount.should.equal(0);
                    errorSpy.callCount.should.equal(1);
                    done();
                });
            });
            describe('and it\'s a "queue error"', function () {
                it('should fire the "error" event once', function (done) {
                    var eventHandlers = {
                        initialized: function () {},
                        reconnected: function () {},
                        error: function () {}
                    };
                    var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                    var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                    var errorSpy = sinon.spy(eventHandlers, 'error');
                    helper = rabbitMQHelper(generateOptions(true), eventHandlers);
                    stubs.rabbit = sinon.stub(helper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {},
                                    exchange: function (name, options, callback) {
                                        var exchange = {};
                                        callback();
                                        return exchange;
                                    },
                                    queue: function (name, options, callback) {
                                        callback('error');
                                        return null;
                                    }
                                };
                                callback();
                                return connect;
                            }
                        };
                    });
                    helper.initializeRabbitMQHelper(helper);
                    initializedSpy.callCount.should.equal(0);
                    reconnectedSpy.callCount.should.equal(0);
                    errorSpy.callCount.should.equal(1);
                    done();
                });
            });
        });
    });
    describe('Subscriber Processing', function () {
        describe('when picking up a queue item', function () {
            it('should have a "message" object', function (done) {
                var options = generateOptions(true);
                var config = options.config;
                var myHelper;
                var eventHandlers = {
                    initialized: function () {
                        myHelper.setQueueHandler(function (queue_item) {
                            should.exist(queue_item.message);
                            (queue_item.message.constructor === {}.constructor).should.equal(true);
                            done();
                        });
                    },
                    reconnected: function () {},
                    error: function () {},
                    'queue-listening': function () {}
                };
                var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                var errorSpy = sinon.spy(eventHandlers, 'error');
                var queueListeningSpy = sinon.spy(eventHandlers, 'queue-listening');
                myHelper = rabbitMQHelper(generateOptions(true), eventHandlers);
                stubs.rabbit = sinon.stub(myHelper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {},
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function () {
                                    var queue = {
                                        bindQueue: function (name, options, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {};
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            }, {});
                                        }
                                    };
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                myHelper.initializeRabbitMQHelper(myHelper);
                initializedSpy.callCount.should.equal(1);
                reconnectedSpy.callCount.should.equal(0);
                errorSpy.callCount.should.equal(0);
                queueListeningSpy.callCount.should.equal(1);
            });
            it('should have a "ack" function', function (done) {
                var options = generateOptions(true);
                var config = options.config;
                var myHelper;
                var eventHandlers = {
                    initialized: function () {
                        myHelper.setQueueHandler(function (queue_item) {
                            should.exist(queue_item.ack);
                            ('function' === typeof queue_item.ack).should.equal(true);
                            done();
                        });
                    },
                    reconnected: function () {},
                    error: function () {},
                    'queue-listening': function () {}
                };
                var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                var errorSpy = sinon.spy(eventHandlers, 'error');
                var queueListeningSpy = sinon.spy(eventHandlers, 'queue-listening');
                myHelper = rabbitMQHelper(generateOptions(true), eventHandlers);
                stubs.rabbit = sinon.stub(myHelper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {},
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function () {
                                    var queue = {
                                        bindQueue: function (name, options, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {};
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            }, {});
                                        }
                                    };
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                myHelper.initializeRabbitMQHelper(myHelper);
                initializedSpy.callCount.should.equal(1);
                reconnectedSpy.callCount.should.equal(0);
                errorSpy.callCount.should.equal(0);
                queueListeningSpy.callCount.should.equal(1);
            });
            it('should have a "headers" object', function (done) {
                var options = generateOptions(true);
                var config = options.config;
                var myHelper;
                var eventHandlers = {
                    initialized: function () {
                        myHelper.setQueueHandler(function (queue_item) {
                            should.exist(queue_item.headers);
                            (queue_item.headers.constructor === {}.constructor).should.equal(true);
                            done();
                        });
                    },
                    reconnected: function () {},
                    error: function () {},
                    'queue-listening': function () {}
                };
                var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                var errorSpy = sinon.spy(eventHandlers, 'error');
                var queueListeningSpy = sinon.spy(eventHandlers, 'queue-listening');
                myHelper = rabbitMQHelper(generateOptions(true), eventHandlers);
                stubs.rabbit = sinon.stub(myHelper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {},
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function () {
                                    var queue = {
                                        bindQueue: function (name, options, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {};
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            }, {});
                                        }
                                    };
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                myHelper.initializeRabbitMQHelper(myHelper);
                initializedSpy.callCount.should.equal(1);
                reconnectedSpy.callCount.should.equal(0);
                errorSpy.callCount.should.equal(0);
                queueListeningSpy.callCount.should.equal(1);
            });
            it('should have a "fields" object', function (done) {
                var options = generateOptions(true);
                var config = options.config;
                var myHelper;
                var eventHandlers = {
                    initialized: function () {
                        myHelper.setQueueHandler(function (queue_item) {
                            should.exist(queue_item.fields);
                            (queue_item.fields.constructor === {}.constructor).should.equal(true);
                            done();
                        });
                    },
                    reconnected: function () {},
                    error: function () {},
                    'queue-listening': function () {}
                };
                var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                var errorSpy = sinon.spy(eventHandlers, 'error');
                var queueListeningSpy = sinon.spy(eventHandlers, 'queue-listening');
                myHelper = rabbitMQHelper(generateOptions(true), eventHandlers);
                stubs.rabbit = sinon.stub(myHelper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {},
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function () {
                                    var queue = {
                                        bindQueue: function (name, options, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {};
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            }, {});
                                        }
                                    };
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                myHelper.initializeRabbitMQHelper(myHelper);
                initializedSpy.callCount.should.equal(1);
                reconnectedSpy.callCount.should.equal(0);
                errorSpy.callCount.should.equal(0);
                queueListeningSpy.callCount.should.equal(1);
            });
            it('should have a "m" object', function (done) {
                var options = generateOptions(true);
                var config = options.config;
                var myHelper;
                var eventHandlers = {
                    initialized: function () {
                        myHelper.setQueueHandler(function (queue_item) {
                            should.exist(queue_item.m);
                            (queue_item.m.constructor === {}.constructor).should.equal(true);
                            done();
                        });
                    },
                    reconnected: function () {},
                    error: function () {},
                    'queue-listening': function () {}
                };
                var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                var errorSpy = sinon.spy(eventHandlers, 'error');
                var queueListeningSpy = sinon.spy(eventHandlers, 'queue-listening');
                myHelper = rabbitMQHelper(generateOptions(true), eventHandlers);
                stubs.rabbit = sinon.stub(myHelper, 'rabbit', function () {
                    return {
                        connect: function (callback) {
                            var connect = {
                                on: function () {},
                                exchange: function (name, options, callback) {
                                    var exchange = {};
                                    callback();
                                    return exchange;
                                },
                                queue: function () {
                                    var queue = {
                                        bindQueue: function (name, options, callback) {
                                            callback();
                                        },
                                        listen: function (options, callback) {
                                            var ack = function () {};
                                            callback({}, ack, {}, {
                                                routingKey: config.queue.options.routingKey
                                            }, {});
                                        }
                                    };
                                    return queue;
                                }
                            };
                            callback();
                            return connect;
                        }
                    };
                });
                myHelper.initializeRabbitMQHelper(myHelper);
                initializedSpy.callCount.should.equal(1);
                reconnectedSpy.callCount.should.equal(0);
                errorSpy.callCount.should.equal(0);
                queueListeningSpy.callCount.should.equal(1);
            });
        });
    });
    describe('Exchange Publishing', function () {
        describe('when the helper is initialized', function () {
            describe('and publishing succeeds', function () {
                it('should publish the message', function (done) {
                    var myHelper;
                    var eventHandlers = {
                        initialized: function () {
                            myHelper.setQueueHandler(function () {});
                        },
                        reconnected: function () {},
                        error: function () {},
                        'queue-listening': function () {
                            myHelper.publishMessage({}, function (err, delivered) {
                                should.not.exist(err);
                                delivered.should.equal(true);
                                done();
                            });
                        }
                    };
                    var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                    var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                    var errorSpy = sinon.spy(eventHandlers, 'error');
                    var queueListeningSpy = sinon.spy(eventHandlers, 'queue-listening');
                    myHelper = rabbitMQHelper(generateOptions(true), eventHandlers);
                    stubs.rabbit = sinon.stub(myHelper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {},
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
                                            },
                                            listen: function () {}
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
                    myHelper.initializeRabbitMQHelper(myHelper);
                    initializedSpy.callCount.should.equal(1);
                    reconnectedSpy.callCount.should.equal(0);
                    errorSpy.callCount.should.equal(0);
                    queueListeningSpy.callCount.should.equal(1);
                });
            });
            describe('and publishing fails', function () {
                it('should publish the message', function (done) {
                    var myHelper;
                    var eventHandlers = {
                        initialized: function () {
                            myHelper.setQueueHandler(function () {});
                        },
                        reconnected: function () {},
                        error: function () {},
                        'queue-listening': function () {
                            myHelper.publishMessage({}, function (err, delivered) {
                                should.exist(err);
                                delivered.should.equal(false);
                                done();
                            });
                        }
                    };
                    var initializedSpy = sinon.spy(eventHandlers, 'initialized');
                    var reconnectedSpy = sinon.spy(eventHandlers, 'reconnected');
                    var errorSpy = sinon.spy(eventHandlers, 'error');
                    var queueListeningSpy = sinon.spy(eventHandlers, 'queue-listening');
                    myHelper = rabbitMQHelper(generateOptions(true), eventHandlers);
                    stubs.rabbit = sinon.stub(myHelper, 'rabbit', function () {
                        return {
                            connect: function (callback) {
                                var connect = {
                                    on: function () {},
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
                                            },
                                            listen: function () {}
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
                    myHelper.initializeRabbitMQHelper(myHelper);
                    initializedSpy.callCount.should.equal(1);
                    reconnectedSpy.callCount.should.equal(0);
                    errorSpy.callCount.should.equal(0);
                    queueListeningSpy.callCount.should.equal(1);
                });
            });
        });
        describe('when the helper is not ensured', function () {
            it('should callback an error', function (done) {
                helper = rabbitMQHelper(generateOptions(true));
                helper.publishMessage({}, function (err) {
                    should.exist(err);
                    done();
                });
            });
        });
    });
});