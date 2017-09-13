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

  /**
   * 以当前工程调用为例，当前的路径指向routes这个文件夹（是一个绝对路径）
   * 通过同步的方法读取该文件夹（必须是同步的），返回一个包含路由名字的数组[‘home’]
   * 通过forEach方法读取每一个名字，在将名字拼接位绝对路径。再通过同步的文件读取信息，判断当前是不是文件
   * 如果是文件夹则递归调用
   * 如果是文件，则拼接路径通过require调用，这里可以看见和ES6模块的区别，require没有提升，而ES6的import from具有提升作用
   * 不能动态加载，webpack实现import（）方法，ES本身没有实现
   * 接着就是通过app加载路由了。
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

  // 分页处理插件，根据前端URL参数拼接出一个分页对象
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
  // 通过promisify将node fs库 promise化
  async saveFile(filepath, file) {
    await util.promisify(fs.writeFile)(filepath, file);
  },

  async moveFile(oldPath, newPath) {
    await util.promisify(fs.rename)(oldPath, newPath);
  },

  // 取得路径的绝对路径 
  root(...args) {
    return path.join(__dirname, '../', ...args);
  }
};
