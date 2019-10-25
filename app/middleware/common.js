const { URL } = require('url');

const { filter, host } = process.env; // eslint-disable-line no-process-env

const { hostname, origin } = new URL(host);

module.exports = {
  filter,
  hostname,
  origin,
};
