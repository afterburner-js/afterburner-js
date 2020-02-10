const chalk = require('chalk');
const { spawn } = require('child_process');
const { URL, URLSearchParams } = require('url');
const config = require('./config');

const { log } = console;

const reservedCLIArgs = [
  'afterburnerRootDir',
  'ci',
  'debug',
  'dev', // (anything starting with dev)
  'filter',
  'host',
  'launch',
  'rootDir',
  'test',
];

/* eslint-disable no-multi-spaces */

const testTypeEnum = Object.freeze({
  APP: 0,         // running afterburner normally to test an external application
  DEV_TEST: 1,    // test afterburner itself during framework development
  SMOKE_TEST: 2,  // CI test
});

/* eslint-enable no-multi-spaces */

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

  let cmd = '';

  if (testType === testTypeEnum.APP) {
    cmd += ' ./node_modules/eslint/bin/eslint.js . || exit 1 ;';
  }

  cmd += ` host=${host}`;

  const params = new URLSearchParams();

  params.set('ci', 'true');
  params.set('host', new URL(host).hostname);

  if (filter) {
    params.set('filter', filter);
  }

  getCustomArguments().forEach(arg => {
    const [k, v] = arg.split('=');
    params.set(k, v);
  });

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

  let cmd = '';

  if (testType === testTypeEnum.APP) {
    cmd += ' ./node_modules/eslint/bin/eslint.js . ;';
  }

  cmd += ` host=${host}`;

  if (testType === testTypeEnum.DEV_TEST) {
    cmd += ' devTest=true';
  }
  else if (testType === testTypeEnum.SMOKE_TEST) {
    cmd += ` afterburnerRootDir=${config.rootDir}`;
  }

  const params = new URLSearchParams();

  params.set('host', new URL(host).hostname);

  if (filter) {
    params.set('filter', filter);
  }

  getCustomArguments().forEach(arg => {
    const [k, v] = arg.split('=');
    params.set(k, v);
  });

  cmd += ` testPage="afterburner/tests.html?${decodeURIComponent(params.toString())}"`;

  cmd += ` ./node_modules/.bin/gulp`;

  return cmd;

}

function getCustomArguments() {

  const args = [];

  for (const arg of config.args) {

    const [key] = arg.split('=');

    if (!key.startsWith('dev') && !reservedCLIArgs.includes(key)) {
      args.push(arg);
    }

  }

  return args;

}

module.exports = { test, testTypeEnum };
