const afterburner = require('@afterburner/test');
const {
  find,
  log,
  pause,
  retry,
  visit,
} = require(`@afterburner/test-helpers`);

afterburner.module('Acceptance | Chrome Regression', () => {

  afterburner.test('load event', async assert => {
    await visit('/chrome-regression.html');
    await retry(5, 5000, 'wait for loading to complete', () => {
      const counter = find('#srcCounter').textContent;
      log(`counter is ${counter}`);
      return counter !== '1000';
    });
    await pause(5333); // wait just over 5 seconds to account for regression page's load/timeout
    assert.strictEqual(find('#loadCounter').textContent, '1000');
  });

});

