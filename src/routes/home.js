const Router = require('koa-router');
const config = require('../config');
const { homeBiz } = require('../bizs');

const router = new Router({
  prefix: `${config.apiPrefix}`
});

router.get('/', homeBiz.getHome);

router.post('/login', homeBiz.doLogin);

module.exports = router;
