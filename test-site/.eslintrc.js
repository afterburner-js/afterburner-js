module.exports = {
  env: {
    browser: true,
    "es6": true
  },
  parserOptions: {
    ecmaVersion: 9,
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: true
    }
  },
  globals: {
    module: false,
    Promise: false,
    require: false,
  },
};
