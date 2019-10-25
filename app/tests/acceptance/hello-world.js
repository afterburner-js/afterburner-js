const afterburner = require('@afterburner/test');
const { visit } = require('@afterburner/test-helpers');

afterburner.module('Acceptance | Hello World', () => {

  afterburner.test('Load Home Page', async assert => {
    await visit('/');
    assert.dom('body').exists('successfully loaded page and displayed <body>');
  });

});

