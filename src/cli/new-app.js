const chalk = require('chalk');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const config = require('./config');

const { log } = console;

function createApp() {

  if (!config.appName) {
    log(chalk.red('app name argument is required for the new app\nexample: ') + chalk.inverse('afterburner new myAppName'));
    return 1;
  }

  const appPath = `${process.cwd()}/${config.appName}`;

  if (fs.existsSync(appPath)) {
    log(chalk.red(`app directory already exists: ${appPath}`));
    return 1;
  }

  return pCreateApp(appPath);

}

function pCreateApp(appPath) {

  log(`creating app at: ${appPath}`);

  const afterburnerPath = `${config.rootDir}/app`;
  const pathNodeModules = `${afterburnerPath}/node_modules`;
  const pathTests = `${afterburnerPath}/tests/test-site-tests`;
  const pathDist = `${afterburnerPath}/dist`;
  const pathTmp = `${afterburnerPath}/tmp`;
  const dsStore = `.DS_Store`;

  fs.copySync(afterburnerPath, appPath, { filter(src, dest) {

    if (
      src.indexOf(pathNodeModules) < 0 &&
      src.indexOf(pathTests) < 0 &&
      src.indexOf(pathDist) < 0 &&
      src.indexOf(pathTmp) < 0 &&
      src.indexOf(dsStore) < 0
    ) {

      if (config.debug) { log(chalk.yellow(dest)); }

      return true;
    }

    return false;

  } });

  const eslintrcPath = `${appPath}/.eslintrc.js`;
  const lines = fs.readFileSync(eslintrcPath, 'utf8').split('\n');
  lines.splice(1, 0, '  root: true,');
  fs.writeFileSync(eslintrcPath, lines.join('\n'));

  const npmInstall = spawn('npm i', { cwd: appPath, shell: true, stdio: 'inherit' });

  return new Promise(resolve => {

    npmInstall.on('exit', exitCode => {

      if (exitCode === 0) {
        log(chalk.blueBright(`successfully created app at: ${appPath}`));

      }
      else {
        log(chalk.red('failed to create app - see errors above'));
      }

      resolve(exitCode);

    });

  });

}

module.exports = { createApp, pCreateApp };
