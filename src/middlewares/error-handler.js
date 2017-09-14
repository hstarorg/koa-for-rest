const http = require('http');

module.exports = options => {
  if (!options) {
    options = { env: 'development' };
  }
  return async function error(ctx, next) {
    try {
      // 将错误处理中间件放在第二个位置，处理logger中间件之后产生的错误
      // 先放行
      await next();

      // 根据洋葱圈模型，请求然后一圈后再次回到错误中间件
      // 如果请求的状态为404，或者请求的body为空，则抛出一个404错误
      if (ctx.response.status === 404 && !ctx.response.body) {
        ctx.throw(404);
      }
    } catch (err) {

      // 捕获这个错误信息，如果请求的status是一个数值，则继续处理该错误，否则抛出500,服务器错误
      ctx.status = typeof err.status === 'number' ? err.status : 500;
      // application
      // ctx.app.emit('error', err, ctx);

      // Send error
      let errObj = {};
      // Joi 错误
      // 如果错误是Joi的错误（表单验证错误）或者错误是业务层的错误，则返回400和错误信息
      if (err.isJoi || err.isBiz) {
        ctx.status = 400;
        errObj.error = err.message;
      } else {
        // 否则根据http的错误码返回相应的错误信息
        errObj.error = http.STATUS_CODES[ctx.status]
      }


      // 为什么这里还要检查一次是不是number呢？
      if (typeof err.status === 'number') {
        ctx.status = err.status;
      }
      // 如果当前是开发环境，则抛出错误信息的堆栈
      if (options.env === 'development') {
        errObj.stack = err.stack;
      }
      // 将错误信息装载到请求的body上
      ctx.body = errObj;
    }
  };
};
