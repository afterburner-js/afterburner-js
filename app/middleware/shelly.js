const { URLSearchParams } = require('url');
const util = require('util');

const exec = util.promisify(require('child_process').exec);
const { spawn } = require('child_process');

module.exports = {
  route: '/afterburner/shelly',
  async handle(req, res /* , next */) {

    const data = req.url.substr(1); // remove leading / from path
    const params = new URLSearchParams(data);
    const responseData = {};

    const booContinue = params.has('cmd');

    if (booContinue) {

      const cmd = hexDecode(params.get('cmd'));
      const cwd = hexDecode(params.get('cwd'));
      const useSpawn = params.get('spawn');

      let timeout = params.get('timeout');

      if (timeout) {
        timeout *= 1000;
      }
      else {
        timeout = 60 * 1000;
      }

      res.setHeader('Content-Type', 'application/json');

      // uncomment for debugging:
      // console.info(`running command ${cmd} from dir ${cwd || process.cwd()}`);

      if (useSpawn === 'true') {

        const splitCMD = cmd.split(/ /g);

        try {
          spawn(splitCMD[0], splitCMD.slice(1), { stdio: 'ignore', detached: true, cwd, timeout }).unref();
          responseData.exitCode = 0;
        }
        catch (error) {
          responseData.stderr = JSON.stringify(error);
        }
      }
      else {

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

    }
    else {
      responseData.stderr = `shelly failed:\n  bad data received: ${req.url}`;
    }

    res.write(`${JSON.stringify(responseData)}\n`);

    res.end();

  }
};

// duplicate of the decode function in @afterburner/test-helpers, which we can't import here
function hexDecode(hex) {

  const hexChars = hex.match(/.{1,4}/g) || [];

  let decoded = '';

  for (let i = 0; i < hexChars.length; i++) {
    decoded += String.fromCharCode(parseInt(hexChars[i], 16));
  }

  return decoded;

}
