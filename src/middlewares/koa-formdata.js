const path = require('path');
const formidable = require('formidable');

const formdata = () => {
  return async function token(ctx, next) {
    let contentType = ctx.request.headers['content-type'] || '';
    if (!contentType.startsWith('multipart')) {
      return await next();
    } else {
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
