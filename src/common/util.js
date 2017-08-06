const fs = require('fs');
const path = require('path');
const util = require('util');
const Joi = require('joi');
const uuid = require('uuid');
const config = require('../config');

module.exports = {
  /**
   * 批量加载路由
   * @param {*} app 
   * @param {string} routesPath 
   */
  loadRoutes(app, routesPath) {
    fs.readdirSync(routesPath)
      .forEach(filename => {
        let routeFilePath = path.join(routesPath, filename);
        if (fs.statSync(routeFilePath).isFile()) {
          let router = require(routeFilePath);
          app.use(router.routes());
        }
      });
  },

  /**
   * 数据验证
   * @param {*} data 要验证的数据
   * @param {*} schema 数据Schema
   * @param {*} options 默认验证所有属性，允许多余属性
   */
  validate(data, schema, options = { abortEarly: false, allowUnknown: true }) {
    return new Promise((resolve, reject) => {
      Joi.validate(data, schema, options, (err, value) => {
        if (err) { return reject(err); }
        resolve();
      });
    });
  },
  /**
   * 扔错误
   * @param {string} message 
   * @param {number} status 
   */
  throwError(message, status = 400) {
    throw { message, status, isBiz: true };
  },

  generateUUID() {
    return uuid.v4();
  },

  getPageObj(query, defaultPageIndex = 1, defaultPageSize = 20) {
    let pageIndex = +(query.page || defaultPageIndex);
    let pageSize = +(query.size || defaultPageSize);
    return {
      StartIndex: (pageIndex - 1) * pageSize,
      PageSize: pageSize
    };
  },

  /**
   * 保存文件
   * @param {string} filepath 
   * @param {File} file 
   */
  async saveFile(filepath, file) {
    await util.promisify(fs.writeFile)(filepath, file);
  },

  async moveFile(oldPath, newPath) {
    await util.promisify(fs.rename)(oldPath, newPath);
  },

  root(...args) {
    return path.join(__dirname, '../', ...args);
  }
};
