const { URLSearchParams } = require('url');
const util = require('util');

const exec = util.promisify(require('child_process').exec);

module.exports = {
  route: '/afterburner/shelly',
  async handle(req, res /* , next */) {

    const data = req.url.substr(1); // remove leading / from path
    const params = new URLSearchParams(data);
    const responseData = {};

    const booContinue = params.has('cmd');

    if (booContinue) {

      const cmd = params.get('cmd');
      const cwd = params.get('cwd');

      let timeout = params.get('timeout');

      if (timeout) {
        timeout *= 1000;
      }
      else {
        timeout = 60 * 1000;
      }

      res.setHeader('Content-Type', 'application/json');

      try {
        const { stdout, stderr } = await exec(`${cmd}`, { cwd, timeout });
        responseData.exitCode = 0; // exit code is 0 if there was no error / rejected promise
        responseData.stdout = stdout ? stdout.trim() : '';
        responseData.stderr = stderr ? stderr.trim() : '';
      }
      catch (error) {
        responseData.exitCode = error.code;
        responseData.stdout = error.stdout ? error.stdout.trim() : '';
        responseData.stderr = error.stderr ? error.stderr.trim() : '';
      }

    }
    else {
      responseData.stderr = `shelly failed:\n  bad data received: ${req.url}`;
    }

    res.write(`${JSON.stringify(responseData)}\n`);

    res.end();

  }
};
