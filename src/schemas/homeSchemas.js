// 一个表单验证插件
// https://github.com/hapijs/joi/blob/v10.6.0/API.md
const Joi = require('joi');

const rules = {
  number: Joi.number().required()
};

const TEST_SCHEMA = {
  property1: rules.number,
  property2: Joi.string().required()
};

const LOGIN_SCHEMA = {
  username: Joi.string().min(4).max(20).required(),
  password: Joi.string().min(4).max(20).required()
};

module.exports = {
  TEST_SCHEMA,
  LOGIN_SCHEMA
};
