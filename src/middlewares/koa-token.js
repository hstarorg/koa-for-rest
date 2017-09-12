const uid = require('uid-safe');

// 内存数据库
const MemoryStore = require('./MemoryStore');

// 设着数据库保存时间
const defaults = {
  ttl: 1000 * 60 * 60 * 24 * 90, // 30 days
  tokenHeader: 'x-token',
  generateToken() {
    return uid.sync(24);
  },
  getToken(req, tokenHeader) {
    return req.headers[tokenHeader];
  }
};

let tokenOptions;

/** 
 * 注意，对于存储token的过程，因为可能是外在的数据库，需要异步处理，因此这个地方所有的存储过程都为异步方法
 *在内存数据库中，虽然存储是同步的，但是为了兼容使用Promise.reslove处理为异步操作 
 *额外的数据库需要实现set,get方法
*/


const tokenFn = options => {
  // 配置参数
  let opts = Object.assign({}, defaults, options);
  // 如果没有制定数据库，则使用内存数据库
  opts.store = opts.store || new MemoryStore(opts);
  // 将配置参数缓存到全局 ？？
  tokenOptions = opts;

  return async function token(ctx, next) {
    // 如果请求头 是OPTIONS 则放行（POST请求前会进行一次OPTIONS次请求，检测请求是否可用，之后再进行数据传输）
    if (ctx.request.method === 'OPTIONS') {
      return await next();
    }
    // 检查请求头header中是否有token
    let token = await opts.getToken(ctx.request, opts.tokenHeader);

    // 如果token不存在，则到下一个中间件
    if (!token) {
      return await next();
    }
    // 如果token存在，且数据不为空，则把相关信息存储在上下文ctx中，并执行下一个中间件
    let tokenData = await opts.store.get(token);
    if (tokenData) {
      ctx.state.token = token;
      ctx.state.user = tokenData;
    }
    await next();
  }
};

// 登录，将用户信息以（token, userData）的形式存储在数据库中
tokenFn.sign = async (userData, t) => {
  let token = t || tokenOptions.generateToken();
  await tokenOptions.store.set(token, userData);
  return token;
};

// 登出，将用户信息从数据库中删除
tokenFn.signOut = async token => {
  return await tokenOptions.store.remove(token);
};

module.exports = tokenFn;
