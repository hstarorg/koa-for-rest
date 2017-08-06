const path = require('path');
// const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

class SqliteHelper {
  constructor() {
    // this._initDatabase()
    //   .then(db => {
    //     this.db = db;
    //     console.log('Database initialized.');
    //     if (config.enableDbTrace) {
    //       db.on('trace', sql => {
    //         let now = new Date();
    //         console.log(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} ${sql}`);
    //       });
    //     }
    //   }).catch(console.error);
  }

  _initDatabase() {
    return new Promise((resolve, reject) => {
      let db = new sqlite3.Database(config.sqliteConnectionString, err => {
        if (err) { return reject(err); }
        resolve(db);
      });
    });
  }

  _execute(type, sql, params) {
    if (!sql) {
      throw new Error('SQL 不存在');
    }
    return new Promise((resolve, reject) => {
      // 先处理动态拼接的参数
      sql = sql.replace(/#[a-zA-Z0-9]+/g, (match, offset, source) => {
        return params[match.slice(1)] || '';
      });
      // 参数不允许多，所以先找到需要的参数
      let sqlNeedParamKeys = (sql.match(/@[a-zA-Z0-9]+/g) || []).map(x => x.slice(1));
      params = params || {};
      let sqlParams = {};
      // 处理参数
      sqlNeedParamKeys.forEach(k => {
        sqlParams[`@${k}`] = params[k];
      });

      this.db[type](sql, sqlParams, function (err, row) {
        if (err) { return reject(err) }
        if (type === 'run') {
          row = {
            lastID: this.lastID,
            changes: this.changes
          };
        }
        resolve(row);
      });
    });
  }

  executeQuery(sql, params) {
    return this._execute('all', sql, params);
  }

  executeNonQuery(sql, params) {
    return this._execute('run', sql, params);
  }

  executeScalar(sql, params) {
    return this._execute('get', sql, params);
  }

  _exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err, row) => {
        if (err) { return reject(err) }
        resolve();
      });
    });
  }

  beginTransaction() {
    return this._exec('BEGIN TRANSACTION;');
  }

  commitTransaction() {
    return this._exec('COMMIT TRANSACTION;');
  }

  rollbackTransaction() {
    return this._exec('ROLLBACK TRANSACTION;');
  }
}

module.exports = new SqliteHelper();
