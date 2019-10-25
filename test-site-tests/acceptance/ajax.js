const afterburner = require('@afterburner/test');
const {
  pause,
  visit,
} = require(`@afterburner/test-helpers`);

afterburner.module('Acceptance | AJAX', () => {

  afterburner.test('ajax events', async assert => {

    await visit('/', { waitForAjaxRequests: true });
    await pause(3 * 1000);
    assert.dom('body').exists('successfully loaded page and displayed <body>');

  });

});

