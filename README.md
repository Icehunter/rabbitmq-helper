# rabbitmq-helper
This is a just a abstracted wrapper of node-rabbit-wrap (which in turn wraps node.amqp).

## Installation:

```text
npm i @icehunter/rabbitmq-helper -S
```

## Options:

```javascript
var options = {
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
                type: 'type',
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
```

## Config Notes:
Based on joi validation all fields are optional but types are set to that what you see above. You can change this at anytime here:

[https://github.com/Icehunter/rabbitmq-helper/blob/master/lib/validators/config.js](https://github.com/Icehunter/rabbitmq-helper/blob/master/lib/validators/config.js)

If you don't provide one or more of those values the default is used in place.

## Usage:

```javascript
// setup helper class
var rabbitMQHelper = require('rabbitmq-helper');

// Make an instance of the helper as a local variable.
var rabbit = rabbitMQHelper(options);

// Supported Events
// `initialized`
// fired once
// connection, exchange and queue are ensured

// `reconnected`
// fired one or more times
// fired if rabbitmq crashes or restarts and the helper reconnects

// `error`
// fired one or more times

// `queue-listening`
// fired one or more times (if reconnecting)
// fired after binding a handler to the queue
// binding e.g.:
// var queueHandler = function(queue_item) { };
// rabbit.setQueueHandler(queueHandler);
// this will emit an error if you've already bound a handler.
// NOTE: THIS SHOULD NOT BE CREATED HERE, create inside the initialized event

// Full example (publisher only), event handlers created during declaration.
var rabbit = rabbitMQHelper(options, {
    initialized: function () {
    },
    reconnected: function () {
    },
    error: function (err) {
    },
});


// Full example (publisher and subscriber), event handlers created in declaration.
var rabbit = rabbitMQHelper(config, {
    initialized: function () {
        // declaring the below statement is best used to setup a publisher to point to another queue
        // in this example if you declare everything in this way it will make a nice endless loop :)
        rabbit.setQueueHandler(function processor(queue_item) {
           var ack = queue_item.ack;
           var m = queue_item.message;
           // do stuff here
           // if we think there's an error, ack(false); will reject it
           // if we think every thing's fine with the message ack(); to acknowledge it
           // if we want to put it back in the queue at the bottom we need to republish it and then ack(false);
           // the code below can republish it to the queue
           rabbit.publishMessage(message, function (err, delivered) {
               if (err) {
                   // republishing failed. do something?
               }
               // ignore the failed message
               ack(false);
           });
        });
    },
    reconnected: function () {
    },
    error: function (err) {
    },
    'queue-listening': function() {
    }
});
```
