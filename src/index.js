const path = require('path');
const Koa = require('koa');
const helmet = require('koa-helmet');
const static = require('koa-static-cache');
const logger = require('koa-logger');
const cors = require('koa-cors');
const responseTime = require('koa-response-time');
const bodyParser = require('koa-bodyparser');
const { util } = require('./common');
const config = require('./config');
const { errorHandler, koaToken, formdata } = require('./middlewares');

const app = new Koa();

// Load middleware

// 打印前端请求的资源
app.use(logger());
// 自定义错误处理中间件，用来捕捉请求过程中产生的错误
app.use(errorHandler());
// 响应时间中间件，返回从这个中间件开始到返回给前端的响应时间
app.use(responseTime());
// 安全处理插件，设置一些常用的安全策略
app.use(helmet());
// 跨域插件，解决跨域访问问题
app.use(cors());
// POST body处理中间件，正确处理request中的body
app.use(bodyParser());
// 自定义的token生成中间件
app.use(koaToken());
// 自定义格式数据的中间件
app.use(formdata());
// 静态资源中间件
app.use(static(util.root('../', 'uploads'), {
  prefix: '/files',
  dynamic: true
}));
// Load routes
// 通过自定义工具加载项目中的路由中间件
util.loadRoutes(app, config.routesPath);

// 监听未被捕获的异常，（前面的错误中间件没有捕获处理的，一般来自系统内部）
process.on('uncaughtException', err => {
  console.error('super exception', err);
});

// Startup
// 启动服务器，config是个配置文件，相关设置在内部
const server = app.listen(config.port, err => {
  let addr = server.address();
  console.log(`Server started at ${addr.address}:${addr.port}...`);
});
