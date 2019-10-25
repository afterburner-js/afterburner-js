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
    module: false,
    process: false,
    Promise: false,
    require: false,
  },
  rules: { }
};
