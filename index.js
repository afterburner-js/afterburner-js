#!/usr/bin/env node

const chalk = require('chalk');
const { version } = require('./package.json');
const help = require('./src/cli/help');
const { createApp } = require('./src/cli/new-app');
const { test } = require('./src/cli/test');
const { devTest, smokeTest, startTestSiteServer } = require('./src/cli/internal-test');
const config = require('./src/cli/config');

config.rootDir = __dirname;

const { log } = console;

(async() => { // eslint-disable-line complexity

  let exitCode = 0;

  try {

    log(chalk.green(`\nafterburner v${version}`, chalk.grey('- https://github.com/afterburner-js/afterburner-js\n')));

    switch (config.cmd) {

      case 'dev-server':
      {
        startTestSiteServer();
        break;
      }

      case 'dev-test':
      {
        exitCode = await devTest();
        process.exitCode = exitCode;
        break;
      }

      case 'new': {
        exitCode = await createApp();
        break;
      }

      case 'smoke-test':
      {
        exitCode = await smokeTest();
        process.exitCode = exitCode;
        break;
      }

      case 'test':
      {
        exitCode = await test();
        process.exitCode = exitCode;
        break;
      }

      case 'version': case '--version': case '-v': case '--v':
        log(`v${version}\n`);
        break;

      case 'help': case '--help': case '-h': case '--h':
      default:
        help();
    }

  }
  catch (error) {

    exitCode = 1;

    if (error) { log(error); }

  }
  finally {
    process.exitCode = exitCode;
  }

})();

