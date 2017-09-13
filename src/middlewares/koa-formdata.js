const path = require('path');

// 还不知道这个干嘛的
const formidable = require('formidable');

const formdata = () => {
  return async function token(ctx, next) {

    // 如果请求头不是multipar（文件上传，则放行）
    let contentType = ctx.request.headers['content-type'] || '';
    if (!contentType.startsWith('multipart')) {
      return await next();
    } else {

      // 否则进行一些form操作，  等看看formidable看完以后再回头处理这
      let form = new formidable.IncomingForm();
      form.uploadDir = path.join(__dirname, '../../', 'uploads');
      form.keepExtensions = true;
      await new Promise((resolve, reject) => {
        form.parse(ctx.req, function (err, fields, files) {
          if (err) {
            return ctx.throw(err);
          }
          ctx.request.files = files;
          ctx.request.fields = fields;
          resolve();
        });
      });
      await next();
    }
  }
};

module.exports = formdata;
