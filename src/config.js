const path = require('path');

module.exports = {
  // 开启debug模式
  debug: true,
  // 设置port号
  port: 999,
  // 设置api的前缀
  apiPrefix: '/api/v1',
  // 设着路由的加载地址
  routesPath: path.join(__dirname, 'routes'),
  // sqliteConnectionString: path.join(__dirname, '../src', 'database', 'Test.sqlite'),
  // 是否打印sql语句 （enablePrintDbSQL）
  enableDbTrace: true,
  downloadHost: 'http://localhost:889/files'
};
