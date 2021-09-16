/* eslint-env node */

const proxy = require('./middleware/proxy');
const shelly = require('./middleware/shelly');
const { origin } = require('./middleware/common');
const { checkPort } = require('./check-port');

(async() => {
  await checkPort();
})().catch(err => {
  throw err;
});

const middleware = app => {
  app.use(shelly.route, shelly.handle);
  app.use(proxy(origin));
};

module.exports = {
  'before_tests': './node_modules/.bin/gulp ci',
  'on_exit': 'rm -rf ./dist/',
  'serve_files': ['dist/'],
  'test_page': 'afterburner/tests.html',
  'routes': {
    '/afterburner': 'dist/',
  },
  'port': 3000,
  'disable_watching': true,
  'launch_in_ci': ['Chrome'],
  'launch_in_dev': ['Chrome'],
  'browser_args': {
    Chrome: {
      ci: [
        // --no-sandbox is needed when running Chrome inside a container
        process.env.CI ? '--no-sandbox' : null, // eslint-disable-line no-process-env
        '--headless',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--mute-audio',
        '--remote-debugging-port=0',
        '--window-size=1440,900'
      ].filter(Boolean)
    },
    Firefox: {
      ci: ['-headless'].filter(Boolean)
    }
  },
  'ignore_missing_launchers': false,
  'middleware': [middleware]
};
