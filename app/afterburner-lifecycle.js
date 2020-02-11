module.exports = {

  begin() {
    // run something before the suite runs
  },

  before(/* assert */) {
    // run something before each module runs
  },
  beforeEach(/* assert */) {
    // run something before each test runs
  },
  afterEach(/* assert */) {
    // run something after each test runs
  },
  after(/* assert */) {
    // run something after each module runs
  }

};
