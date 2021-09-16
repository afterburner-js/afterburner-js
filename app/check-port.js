const tcpPortUsed = require('tcp-port-used');

module.exports = {

  checkPort() {

    return tcpPortUsed.check(3000, '127.0.0.1')
      .then(inUse => {
        if (inUse) {
          throw new Error(`port 3000 is in use. can't start afterburner :(`);
        }
      }, err => {
        throw new Error(`can't start afterburner :(\n\n ${err.message}`);
      });

  },

};
