'use strict';

var rabbitMQHelper = require('./index');

var config = {
    config: {
        connection: {
            host: '127.0.0.1',
            options: {
                reconnect: true
            }
        },
        exchange: {
            name: 'exchange-name',
            options: {
                type: 'direct',
                durable: false,
                autoDelete: false
            }
        },
        queue: {
            name: 'queue-name',
            options: {
                routingKey: 'routing-key',
                durable: true,
                autoDelete: false,
                prefetchCount: 1
            }
        }
    }
};

var rabbit = rabbitMQHelper(config, {
    initialized: function () {
        // declaring the below statement is best used to setup a publisher to point to another queue
        // in this example if you declare everything in this way it will make a nice endless loop :)
        rabbit.setQueueHandler(function processor(queueItem) {
            console.log('Recieving Message');
            console.log(JSON.stringify(queueItem || {
                message: 'Queue Item Undefined'
            }, null, 4));
            process.exit(1);
        });
        console.log('Pushing Message');
        rabbit.publishMessage({
            message: 'Hey! I\'m here!'
        }, function (err, delivered) {
            if (err) {
                throw err;
            }
            else {
                console.log(JSON.stringify({
                    delivered: delivered
                }, null, 4));
            }
        });
    },
    reconnected: function () {},
    error: function (err) {
        console.log(err.message);
    },
    'queue-listening': function () {}
});
