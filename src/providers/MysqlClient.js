/**
 * 一个Mysql客户端，封装了开启连接，执行查询等操作。
 * 封装了四个普通方法，查询所有，查询第一个，查看影响的列，返回插入的ID
 * 一个私有方法_excu然后开启事务，te，这个方法使用私有方法_processSqlAndParameter格式化参数
 * ？？ 为什么没有更新UPDATE 和 DELETE 方法呢？
 */
class MysqlClient {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Begin database transaction
   */
  // 开始事务，首先取得连接
  beginTransaction() {
    return this._getConnection()
      .then(conn => {
        return new Promise((resolve, reject) => {
          conn.beginTransaction(err => {
            if (err) { return reject(err); }
            conn.inTransaction = true;
            resolve(conn);
          })
        });
      });
  }

  /**
   * Commit transaction
   * @param {any} conn 
   */
  commitTransaction(conn) {
    return new Promise((resolve, reject) => {
      conn.commit(err => {
        if (err) {
          conn.rollback(() => {
            this._releaseConnection(conn, true);
            reject(err);
          });
        } else {
          this._releaseConnection(conn, true);
          resolve();
        }
      });
    });
  }

  /**
   * Rollback transaction
   * @param {any} conn 
   */
  rollbackTransaction(conn) {
    return new Promise((resolve, reject) => {
      conn.rollback(() => {
        this._releaseConnection(conn, true);
        resolve();
      });
    });
  }

  /**
   * Get a database connection
   */
  // ？？为什么要把取得连接的私有方法暴露出去呢
  getConnection() {
    return this._getConnection();
  }

  /**
   * Execute sql, return query result(array)
   * @param {string} sqlString 
   * @param {object | array} values 
   * @param {any} conn 
   */
  // 返回查询返回的结果数组
  executeQuery(sqlString, values, conn = null) {
    return this._execute(sqlString, values, conn);
  }

  /**
   * Execute sql, return single result(the first one)
   * @param {string} sqlString 
   * @param {object | array} values 
   * @param {any} conn 
   */
  // 返回查询到的第一个
  executeScalar(sqlString, values, conn = null) {
    return this._execute(sqlString, values, conn)
      .then(results => {
        if (results.length === 0) {
          return null;
        }
        return results[0];
      });
  }

  /**
   * Execute sql, return affected rows
   * @param {string} sqlString 
   * @param {object | array} values 
   * @param {any} conn 
   */
  // 返回受影响的行数
  executeNonQuery(sqlString, values, conn = null) {
    return this._execute(sqlString, values, conn)
      .then(results => {
        return results.affectedRows;
      });
  }

  /**
   * Execute sql, return insertId(for auto id)
   * @param {string} sqlString 
   * @param {object | array} values 
   * @param {any} conn 
   */
  executeInsert(sqlString, values, conn = null) {
    return this._execute(sqlString, values, conn)
      .then(results => {
        return results.insertId;
      });
  }

  /**
 * private function, get db connection
 */
// 从连接池中取得连接并打开mysql数据库
  _getConnection() {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err, conn) => {
        if (err) { return reject(err); }
        resolve(conn);
      });
    });
  }

  /**
   * Release connection
   * @param {any} conn 
   * @param {boolean} closeTran 
   */
  // 释放连接
  _releaseConnection(conn, closeTran = false) {
    if (closeTran) {
      conn.inTransaction = false;
    }
    conn.release();
  }

  /**
   * Execute sql, return resuluts;
   * @param {string} sqlString 
   * @param {object|array} values 
   * @param {any} conn 
   */
  _execute(sqlString, values, conn) {
    // 通过格式化参数，将占位符替换为具体数值，变成一条可执行的SQL语句
    let { sql, params } = this._processSqlAndParameter(sqlString, values);
    // 判断是否有第三方的连接，否则使用默认连接
    let p = conn ? Promise.resolve(conn) : this._getConnection();
    return p.then(conn => {
      return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results, fields) => {
          // If conn is in transaction, not release
          // 如果事务结束则释放连接
          // ？？封装的开启事务，回滚事务该怎么用呢？
          if (!conn.inTransaction) {
            this._releaseConnection(conn);
          }
          // 返回查询的值
          if (err) { return reject(err); }
          resolve(results);
        });
      });
    });
  }
    // 格式化参数
  _processSqlAndParameter(sqlString, params) {
    let result;
    // If is an array, direct return.
    // 如果参数已经是一个数组，直接返回
    if (Array.isArray(params)) {
      result = {
        sql: sqlString,
        params: params.slice()
      };
    } else {
      // Replace object to array, and use ? replace @Property
      let paramArr = [];
      if (params) {
        let paramKeys = Object.keys(params);

        // 这里用了一个高阶函数，将以@修饰的占位符替换为匹配的数值
        sqlString = sqlString.replace(/@[a-zA-Z0-9]+/g, (match, offset, str) => {
          // 首先把匹配的占位符@去掉
          let matchKey = match.replace('@', '');
          // 接着从参数对象中通过键名查找是否有对应的值，如果有则返回值，否则返回？
          // 最后返回将占位符替换为具体的值
          if (paramKeys.indexOf(matchKey) >= 0) {
            paramArr.push(params[matchKey]);
            return '?';
          }
          return match;
        });
      }
      result = {
        sql: sqlString,
        params: paramArr
      };
    }
    return result;
  }
}

module.exports = MysqlClient;
