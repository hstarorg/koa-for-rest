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
app.use(logger());
app.use(errorHandler());
app.use(responseTime());
app.use(helmet());
app.use(cors());
app.use(bodyParser());
app.use(koaToken());
app.use(formdata());
app.use(static(util.root('../', 'uploads'), {
  prefix: '/files',
  dynamic: true
}));
// Load routes
util.loadRoutes(app, config.routesPath);

process.on('uncaughtException', err => {
  console.error('super exception', err);
});

// Startup
const server = app.listen(config.port, err => {
  let addr = server.address();
  console.log(`Server started at ${addr.address}:${addr.port}...`);
});
