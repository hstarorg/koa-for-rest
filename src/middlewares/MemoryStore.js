/**
 * 为了兼容第三方数据库，因此虽然内存存储是同步过程，依然要使用Promise处理为异步过程
 */


// 新建一个map用于存储token, map是ES6中的结构，通过键值对存储数据
const tokenMap = new Map();

class MemoryStore {
  constructor(options) {
    this._options = options;
  }

  // 获取保存时间
  _getExpires() {
    // 返回当前时间 + 设置中的期望时间  
    return Date.now() + this._options.ttl;
  }

  // 设置存储对象
  set(key, value) {
    // 设置保存时间
    let expires = this._getExpires();
    // 将保存时间和值存为一个data对象
    let data = { expires, value };
    // 将对象存储在tokenmap中
    tokenMap.set(key, data);
    // 这里用promise返回了存储的key值 ？？
    return Promise.resolve(key);
  }

  get(key) {
    let data = tokenMap.get(key);
    // 如果资源过期（大于保存时间）或者资源不存在，返回一个promise包装的null
    if (!data || data.expires < Date.now()) {
      return Promise.resolve(null);
    }
    this.set(key, data.value);
    return Promise.resolve(data.value);
  }

  remove(key) {
    tokenMap.delete(key);
    return Promise.resolve();
  }

  clear() {
    tokenMap.clear();
    return Promise.resolve();
  }

  length() {
    return tokenMap.size;
  }
}

module.exports = MemoryStore;
