'use strict';

var Joi = require('joi');

var schema = {
    connection: Joi.object().keys({
        host: Joi.string().min(1).required(),
        options: Joi.object().keys({
            reconnect: Joi.boolean().required()
        }).required()
    }).required(),
    exchange: Joi.object().keys({
        name: Joi.string().min(1).required(),
        options: Joi.object().keys({
            type: Joi.string().min(1).required(),
            durable: Joi.boolean().required(),
            autoDelete: Joi.boolean().required()
        }).required()
    }).required(),
    queue: Joi.object().keys({
        name: Joi.string().min(1).required(),
        options: Joi.object().keys({
            routingKey: Joi.string().min(1).required(),
            durable: Joi.boolean().required(),
            autoDelete: Joi.boolean().required(),
            prefetchCount: Joi.number().required()
        }).required()
    }).required(),
    mocking: Joi.any().optional()
};
var options = {
    allowUnknown: true,
    abortEarly: false
};

module.exports = function incomingEventValidatorInit(config, callback) {
    Joi.validate(config, schema, options, function (err, value) {
        callback(err, value);
    });
};