#!/usr/bin/env node

const chalk = require('chalk');
const { version } = require('./package.json');
const help = require('./src/cli/help');
const { createApp } = require('./src/cli/new-app');
const { test } = require('./src/cli/test');
const { devTest, smokeTest, startTestSiteServer } = require('./src/cli/internal-test');
const config = require('./src/cli/config');
const fs = require('fs');

config.rootDir = __dirname;

const { log } = console;

let pkgJSONModified = false;

process.on('SIGINT', () => {
  // if process is terminated (usually via CTRL+C), do the necessary clean up:
  if (pkgJSONModified) {
    setAfterburnerVersion(false);
  }
});

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
        setAfterburnerVersion(true);
        exitCode = await devTest();
        process.exitCode = exitCode;
        setAfterburnerVersion(false);
        break;
      }

      case 'new': {
        exitCode = await createApp();
        break;
      }

      case 'smoke-test':
      {
        setAfterburnerVersion(true);
        exitCode = await smokeTest();
        process.exitCode = exitCode;
        setAfterburnerVersion(false);
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

/**
 * the tests install afterburner, so we need to make sure it doesn't try to install the non-existent version from npm
 */
function setAfterburnerVersion(isLocal) {

  const filePath = `${config.rootDir}/app/package.json`;
  const pkgJSON = JSON.parse(fs.readFileSync(`${filePath}`));

  if (isLocal) {
    pkgJSON.devDependencies['@afterburner-js/afterburner-js'] = `file:${config.rootDir}`;
    pkgJSONModified = true;
  }
  else {
    pkgJSON.devDependencies['@afterburner-js/afterburner-js'] = '^1.x';
  }

  fs.writeFileSync(filePath, JSON.stringify(pkgJSON, null, 2));

}
