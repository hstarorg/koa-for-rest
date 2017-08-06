const getHome = async ctx => {
  ctx.body = {
    key: 'Hello'
  };
};

module.exports = {
  getHome
};
