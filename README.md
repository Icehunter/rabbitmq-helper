# rabbitmq-helper

This is a just a abstracted wrapper of node-rabbit-wrap (which in turn wraps node.amqp).

### Installation:
```text
npm i git://github.com/icehunter/rabbitmq-helper -S
```

### Config:
```javascript
var config = {
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
};
```
### Config Notes:
Based on joi validation all fields are required that you see above. You can change this at anytime here:

https://github.com/Icehunter/rabbitmq-helper/blob/master/lib/validators/config.js

### Usage:
```javascript
// setup helper class
var rabbitMQHelper = require('rabbitmq-helper');

// create instance
var rabbit = rabbitMQHelper(config);

// connect (publisher only)
rabbit.ensureRabbitMQ(function(err, response) {
    
});

// connect (publisher and subscriber), requires a "processor" function
var Processor = function processor(queue_item) {
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
};

rabbit.ensureRabbitMQ(Processor, function(err, response) {

});
```
