const chalk = require('chalk');
const { spawn } = require('child_process');
const { URL, URLSearchParams } = require('url');
const config = require('./config');

const { log } = console;

const testTypeEnum = Object.freeze({
  APP: 0,
  DEV_TEST: 1,
  SMOKE_TEST: 2,
});

function test({ cwd = null, testType = testTypeEnum.APP } = {}) {

  const { ci, debug, filter, host, launch } = config;

  return new Promise((resolve, reject) => { // eslint-disable-line complexity

    if (typeof ci !== 'undefined' && ci !== 'false' && ci !== 'true') {
      log(chalk.red(`invalid value for ${chalk.inverse('ci')} argument - must be 'true' or 'false'`));
      reject();
      return 1;
    }

    if (!host) {
      log(chalk.red(`${chalk.inverse('host')} argument is required or must be set in afterburner-config.js`));
      reject();
      return 1;
    }

    try {
      new URL(host); // eslint-disable-line no-new
    }
    catch (error) {

      if (error instanceof TypeError) {
        log(chalk.red(`${chalk.inverse('host')} is invalid.  must be a full URL with scheme, such as: https://example.com`));
      }
      else {
        log(error);
      }

      reject();
      return 1;

    }

    let cmd;

    if (ci === 'true') {
      cmd = getCICommand(filter, host, launch, testType);
    }
    else {
      cmd = getLocalCommand(filter, host, testType);
    }

    if (debug) { log(chalk.grey('running afterburner command: ') + chalk.yellow(cmd)); }

    const aterburner = spawn(cmd, { shell: true, stdio: 'inherit', cwd });

    aterburner.on('exit', exitCode => {
      resolve(exitCode);
    });

    return 0;

  });

}

function getCICommand(filter, host, launch, testType) {

  let cmd = `./node_modules/eslint/bin/eslint.js . || exit 1 ; host=${host}`;

  const params = new URLSearchParams();

  params.set('ci', 'true');
  params.set('host', host);

  if (filter) {
    params.set('filter', filter);
  }

  if (testType === testTypeEnum.DEV_TEST) {
    cmd += ' devTest=true';
  }
  else if (testType === testTypeEnum.SMOKE_TEST) {
    cmd += ` afterburnerRootDir=${config.rootDir}`;
  }

  cmd += ` ./node_modules/.bin/testem ci --test_page="afterburner/tests.html?${decodeURIComponent(params.toString())}"`;

  if (launch) {
    cmd += ` --launch=${launch}`;
  }

  return cmd;

}

function getLocalCommand(filter, host, testType) {

  let cmd = `./node_modules/eslint/bin/eslint.js . ; host=${host}`;

  if (filter) {
    cmd += ` filter="${filter}"`;
  }

  if (testType === testTypeEnum.DEV_TEST) {
    cmd += ' devTest=true';
  }
  else if (testType === testTypeEnum.SMOKE_TEST) {
    cmd += ` afterburnerRootDir=${config.rootDir}`;
  }

  cmd += ` ./node_modules/.bin/gulp`;

  return cmd;

}

module.exports = { test, testTypeEnum };
