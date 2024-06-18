const { createProxyMiddleware } = require('http-proxy-middleware');

const customProxySettings = {
  allowCrossOrigin: false,
  disableBrowserLoginPrompt: false,
  disableSecureCookies: false,
  ignoreECONNRESET: false,
};

module.exports = proxyTarget => {
  return createProxyMiddleware(pathname => {
    // TODO: document this

    // ideally, we would want to have testem.js served somewhere other than the root, but this is not currently an option
    if (pathname.indexOf('/afterburner/') >= 0 || pathname.indexOf('/testem') >= 0) {
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
    onProxyRes: (proxyRes, req) => {

      if (customProxySettings.disableBrowserLoginPrompt) {
        // prevents browser login prompt from appearing when we get a 401 response
        delete proxyRes.headers['www-authenticate'];
      }

      if (customProxySettings.disableSecureCookies) {
        disableSecureCookies(proxyRes);
      }

      if (customProxySettings.allowCrossOrigin) {
        allowCrossOrigin(req, proxyRes);
      }

    },
    logProvider: logProvider => {

      logProvider.error = function(e) {

        if (customProxySettings.ignoreECONNRESET) {
          ignoreECONNRESET(e);
        }
        else {
          console.error(e);
        }

      };

      return logProvider;

    }
  });
};

function allowCrossOrigin(req, proxyRes) {

  if (req.method === 'OPTIONS') {
    proxyRes.statusCode = 200;
  }

  // ALL THE CORS
  proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  proxyRes.headers['Access-Control-Allow-Headers'] = '*';
  proxyRes.headers['Access-Control-Allow-Methods'] = '*';

}

function disableSecureCookies(proxyRes) {

  const cookie = proxyRes.headers['set-cookie'];

  if (Array.isArray(cookie)) {

    proxyRes.headers['set-cookie'] = cookie.map(c => {
      return c.split(';')
        .filter(v => { return v.trim().toLowerCase() !== 'secure'; })
        .join('; ');
    });

  }

}

function ignoreECONNRESET(e) {

  // we get these ECONNRESET errors in the log when
  // the test navigates away from a page before an
  // AJAX/fetch request completes.  we don't care so,
  // we don't log it:

  if (!e.endsWith('[ECONNRESET] (https://nodejs.org/api/errors.html#errors_common_system_errors)')) {
    console.error(e);
  }

}
