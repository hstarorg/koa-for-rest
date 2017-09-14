const { util } = require('../common');
const { homeSchemas } = require('../schemas');

// 具体的业务层，对应JAVA中的service层
const getHome = async ctx => {
  ctx.body = {
    key: 'Hello'
  };
};

const doLogin = async ctx => {
  // 获取提交的数据
  let data = ctx.request.body;
  // 校验数据合法性
  await util.validate(data, homeSchemas.LOGIN_SCHEMA);
  // 执行登录逻辑（查数据库）

  // 返回数据
  ctx.body = {
    token: util.generateUUID()
  };
};

module.exports = {
  getHome,
  doLogin
};
