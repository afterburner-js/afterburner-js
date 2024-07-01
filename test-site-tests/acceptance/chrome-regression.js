const afterburner = require('@afterburner/test');
const {
  visit,
} = require(`@afterburner/test-helpers`);

afterburner.module('Acceptance | Chrome Regression', () => {

  afterburner.test('load event 1', async assert => {
    await visit('/chrome-regression.html');
    assert.ok(true);
  });

  afterburner.test('load event 2', async assert => {
    await visit('/chrome-regression.html');
    assert.ok(true);
  });

});

