const path = require('path');

// 表单数据处理 https://github.com/felixge/node-formidable 用于处理文件上传
// 简单使用说明 http://www.cnblogs.com/yuanke/archive/2016/02/26/5221853.html
const formidable = require('formidable');

const formdata = () => {
  return async function token(ctx, next) {

    // 如果请求头不是multipar（文件上传，则放行）
    let contentType = ctx.request.headers['content-type'] || '';
    if (!contentType.startsWith('multipart')) {
      return await next();
    } else {

      // 生成一个表单处理对象
      let form = new formidable.IncomingForm();
      // 指定文件上传的存储路径
      form.uploadDir = path.join(__dirname, '../../', 'uploads');
      // 让上传的文件继续保持原后缀
      form.keepExtensions = true;

      // 新建一个promise用于解析上传文件
      await new Promise((resolve, reject) => {

        // 解析表单 返回表单值 和 表单字段，并放在上下文中
        form.parse(ctx.req, function (err, fields, files) {
          if (err) {
            return ctx.throw(err);
          }
          ctx.request.files = files;
          ctx.request.fields = fields;
          resolve();
        });
      });
      // 放行
      await next();
    }
  }
};

module.exports = formdata;
