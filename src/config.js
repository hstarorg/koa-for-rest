const path = require('path');

module.exports = {
  debug: true,
  port: 999,
  apiPrefix: '/api/v1',
  routesPath: path.join(__dirname, 'routes'),
  // sqliteConnectionString: path.join(__dirname, '../src', 'database', 'Test.sqlite'),
  enableDbTrace: true,
  downloadHost: 'http://localhost:889/files'
};
