const chalk = require('chalk');

module.exports = function() {

  const { log } = console;

  log(`Usage: ${chalk.yellow('afterburner')} ${chalk.cyan('<command>')}\n`);
  log('Available commands:\n');
  log(chalk.yellow('afterburner') + chalk.cyan(' version'));
  log('  outputs version information');
  log(chalk.grey('  aliases: --version, -v, --v\n'));
  log(chalk.yellow('afterburner') + chalk.cyan(' help'));
  log('  this help!\n');
  log(chalk.yellow('afterburner') + chalk.cyan(' new') + chalk.magenta(' <appName>'));
  log(`  creates a new afterburner app in the specified directory ${chalk.magenta('<appName>')}\n`);
  log(chalk.yellow('afterburner') + chalk.cyan(' test') + chalk.magenta(' <options...>'));
  log(`  runs your afterburner test suite`);
  log(`  ${chalk.magenta('host (String)')} the hostname or IP address of the test target - overrides value set in ${chalk.grey('afterburner-config.js')}`);
  log(`  ${chalk.magenta('filter (String)')} the filter applied to determine which test modules to run - overrides value set in ${chalk.grey('afterburner-config.js')}`);
  log(`  ${chalk.magenta('ci (Boolean) (Default: false)')} run tests in CI mode`);
  log(`  ${chalk.magenta('launch (String)')} only available if ci=true - comma-delimited list of launchers to use - values must be capitalized: e.g. Chrome,Firefox\n`);

};
