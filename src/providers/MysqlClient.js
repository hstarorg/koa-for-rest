class MysqlClient {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Begin database transaction
   */
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
  getConnection() {
    return this._getConnection();
  }

  /**
   * Execute sql, return query result(array)
   * @param {string} sqlString 
   * @param {object | array} values 
   * @param {any} conn 
   */
  executeQuery(sqlString, values, conn = null) {
    return this._execute(sqlString, values, conn);
  }

  /**
   * Execute sql, return single result(the first one)
   * @param {string} sqlString 
   * @param {object | array} values 
   * @param {any} conn 
   */
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
    let { sql, params } = this._processSqlAndParameter(sqlString, values);
    let p = conn ? Promise.resolve(conn) : this._getConnection();
    return p.then(conn => {
      return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results, fields) => {
          // If conn is in transaction, not release
          if (!conn.inTransaction) {
            this._releaseConnection(conn);
          }
          if (err) { return reject(err); }
          resolve(results);
        });
      });
    });
  }

  _processSqlAndParameter(sqlString, params) {
    let result;
    // If is an array, direct return.
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
        sqlString = sqlString.replace(/@[a-zA-Z0-9_]+/g, (match, offset, str) => {
          let matchKey = match.replace('@', '');
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
