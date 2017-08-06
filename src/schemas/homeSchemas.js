const Joi = require('joi');

const rules = {
  number: Joi.number().required()
};

const TEST_SCHEMA = {
  property1: rules.number,
  property2: Joi.string().required()
};

module.exports = {
  TEST_SCHEMA
};
