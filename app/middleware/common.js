const { URL } = require('url');

const { host } = process.env; // eslint-disable-line no-process-env

const { hostname, origin } = new URL(host);

module.exports = {
  hostname,
  origin,
};
