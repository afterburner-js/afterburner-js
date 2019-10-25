const proxy = require('http-proxy-middleware');

module.exports = proxyTarget => {
  return proxy(pathname => {
    // TODO: document this

    // ideally, we would want to have testem.js served somewhere other than the root, but this is not currently an option
    if (pathname.indexOf('/afterburner/') >= 0 || pathname.indexOf('/testem.js') >= 0) {
      return false;
    }

    return true;

  },
  {
    target: proxyTarget,
    changeOrigin: true,
    autoRewrite: true,
    protocolRewrite: 'http',
    secure: false,
    logLevel: 'warn',
    onProxyRes: proxyRes => {

      const cookie = proxyRes.headers['set-cookie'];

      if (Array.isArray(cookie)) {

        proxyRes.headers['set-cookie'] = cookie.map(c => {
          return c.split(';')
            .filter(v => { return v.trim().toLowerCase() !== 'secure'; })
            .join('; ');
        });

      }

    },
  });
};
