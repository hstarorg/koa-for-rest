const uid = require('uid-safe');
const MemoryStore = require('./MemoryStore');

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

const tokenFn = options => {
  let opts = Object.assign({}, defaults, options);
  opts.store = opts.store || new MemoryStore(opts);
  tokenOptions = opts;

  return async function token(ctx, next) {
    if (ctx.request.method === 'OPTIONS') {
      return await next();
    }
    let token = await opts.getToken(ctx.request, opts.tokenHeader);
    if (!token) {
      return await next();
    }
    let tokenData = await opts.store.get(token);
    if (tokenData) {
      ctx.state.token = token;
      ctx.state.user = tokenData;
    }
    await next();
  }
};

tokenFn.sign = async (userData, t) => {
  let token = t || tokenOptions.generateToken();
  await tokenOptions.store.set(token, userData);
  return token;
};

tokenFn.signOut = async token => {
  return await tokenOptions.store.remove(token);
};

module.exports = tokenFn;
