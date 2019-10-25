const fs = require('fs-extra');
const express = require('express');
const os = require('os');
const { test, testTypeEnum } = require('./test');
const { pCreateApp } = require('./new-app');
const config = require('./config');

const { log } = console;

function startTestSiteServer() {

  const app = express();

  app.use(express.static(`${config.rootDir}/test-site`));

  app.use((req, res) => {
    res.statusCode = 404;
    res.end(`afterburner 404 not found: ${req.url}`);
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
  // todo: install node_modules if not installed

  const { server, host } = await startTestSiteServer();

  config.host = host;

  const exitCode = await test({ cwd: `${config.rootDir}/app`, testType: testTypeEnum.DEV_TEST });
  server.close();
  return exitCode;

}

async function smokeTest() {

  const appPath = `${os.tmpdir()}/afterburner`;

  fs.removeSync(appPath);

  let exitCode = await pCreateApp(appPath);

  if (exitCode !== 0) {
    return exitCode;
  }

  const { server, host } = await startTestSiteServer();

  config.host = host;

  if (!config.devMode) {
    config.ci = 'true';
    config.launch = 'Chrome,Firefox';
  }

  exitCode = await test({ cwd: appPath, testType: testTypeEnum.SMOKE_TEST });
  server.close();
  return exitCode;

}

module.exports = { devTest, smokeTest, startTestSiteServer };
