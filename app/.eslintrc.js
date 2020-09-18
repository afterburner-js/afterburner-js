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
  extends: [
    'eslint:recommended',
  ],
  globals: {
    find: 'off', // detect when we fail to import find() in tests since there is a (non-standard) find() function in many browsers
    module: false,
    process: false,
    Promise: false,
    require: false,
  },
  rules: { }
};
