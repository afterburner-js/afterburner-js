const chalk = require('chalk');
const fs = require('fs');

const { log } = console;

const args = process.argv.splice(2);

let config;

const appConfig = `${process.cwd()}/afterburner-config.js`;

if (fs.existsSync(appConfig)) {
  // use config from project folder if project exists
  config = require(appConfig); // eslint-disable-line global-require
}
else {
  // use default config (project doesn't exist)
  config = require(`../../app/afterburner-config`); // eslint-disable-line global-require
}

module.exports = {
  appName: args[1],
  ci: getArg('ci'),
  cmd: args[0],
  debug: getArg('debug') === 'true',
  devMode: args.some(e => {
    return e.startsWith('dev');
  }),
  filter: getArg('filter'),
  host: getArg('host'),
  launch: getArg('launch'),
  rootDir: '', // this must be set in the root index.js file
};

function getArg(name) {

  const key = `${name}=`;

  let value, valueFromConfig;

  const a = args.find(e => {
    return e.startsWith(key);
  });

  if (typeof a === 'undefined') {

    valueFromConfig = config[name];

    if (typeof valueFromConfig !== 'undefined') {
      value = valueFromConfig;
      log(`using ${chalk.inverse(name)} from config: ${chalk.magenta(value)}`);
    }

  }
  else {
    value = a.slice(key.length);
    log(`using ${chalk.inverse(name)} from command line: ${chalk.magenta(value)}`);
  }

  return value;

}
