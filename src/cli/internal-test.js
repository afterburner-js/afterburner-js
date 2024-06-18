const fs = require('fs-extra');
const express = require('express');
const os = require('os');
const { test, testTypeEnum } = require('./test');
const { pCreateApp } = require('./new-app');
const config = require('./config');
const { spawn } = require('child_process');

const { log } = console;

function startTestSiteServer() {

  const app = express();

  app.use(express.static(`${config.rootDir}/test-site`));

  app.use((req, res) => {
    res.statusCode = 404;
    res.end(`afterburner 404 not found: ${escapeHTML(req.url)}`);
  });

  return new Promise(resolve => {

    const server = app.listen(0, () => {

      const host = `http://localhost:${server.address().port}`;

      log(`serving test site at: ${host}`);

      resolve({ server, host });

    });

  });

}

async function devTest() {

  const appPath = `${config.rootDir}/app`;

  let exitCode = await lint();

  if (exitCode !== 0) {
    return exitCode;
  }

  if (!fs.existsSync(`${appPath}/node_modules`)) {
    exitCode = await installNodeModules(appPath);
  }

  if (exitCode !== 0) {
    return exitCode;
  }

  const { server, host } = await startTestSiteServer();

  config.host = host; // eslint-disable-line require-atomic-updates

  exitCode = await test({ cwd: appPath, testType: testTypeEnum.DEV_TEST });
  server.close();

  return exitCode;

}

async function smokeTest() {

  let exitCode = await lint();

  if (exitCode !== 0) {
    return exitCode;
  }

  const appPath = `${os.tmpdir()}/afterburner`;

  fs.removeSync(appPath);

  exitCode = await pCreateApp(appPath);

  if (exitCode !== 0) {
    return exitCode;
  }

  const { server, host } = await startTestSiteServer();

  config.host = host;

  if (!config.devMode) {
    config.ci = config.ci || 'true';
    config.launch = config.launch || 'Chrome,Firefox';
  }

  exitCode = await test({ cwd: appPath, testType: testTypeEnum.SMOKE_TEST });
  server.close();
  return exitCode;

}

function installNodeModules(appPath) {

  const npmInstall = spawn('npm i', { cwd: appPath, shell: true, stdio: 'inherit' });

  return new Promise(resolve => {

    npmInstall.on('exit', exitCode => {
      resolve(exitCode);
    });

  });

}

function lint() {

  const runLinter = spawn('./node_modules/.bin/eslint .', { cwd: config.rootDir, shell: true, stdio: 'inherit' });

  return new Promise(resolve => {

    runLinter.on('exit', exitCode => {
      resolve(exitCode);
    });

  });

}

/**
 * Escape HTML for rendering
*/
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { devTest, smokeTest, startTestSiteServer };
