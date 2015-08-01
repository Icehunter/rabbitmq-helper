'use strict';

var Joi = require('joi');

var schema = {
    connection: Joi.object().keys({
        host: Joi.string().min(1).optional(),
        options: Joi.object().keys({
            reconnect: Joi['boolean']().optional()
        }).optional()
    }).optional(),
    exchange: Joi.object().keys({
        name: Joi.string().min(1).optional(),
        options: Joi.object().keys({
            type: Joi.string().min(1).optional(),
            durable: Joi['boolean']().optional(),
            autoDelete: Joi['boolean']().optional()
        }).optional()
    }).optional(),
    queue: Joi.object().keys({
        name: Joi.string().min(1).optional(),
        options: Joi.object().keys({
            routingKey: Joi.string().min(1).optional(),
            durable: Joi['boolean']().optional(),
            autoDelete: Joi['boolean']().optional(),
            prefetchCount: Joi.number().optional()
        }).optional()
    }).optional()
};

module.exports = function configValidatorInit(config, callback) {
    Joi.validate(config, schema, {
        allowUnknown: true,
        abortEarly: false
    }, function (err, value) {
        callback(err, value);
    });
};
