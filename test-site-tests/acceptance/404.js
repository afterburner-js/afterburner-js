const afterburner = require('@afterburner/test');
const {
  visit,
} = require(`@afterburner/test-helpers`);

afterburner.module('Acceptance | 404', () => {

  afterburner.test('404 handling', async assert => {

    await visit('/');
    assert.dom('body').doesNotIncludeText('afterburner 404 not found:', '404 message does not appear');

    await visit('/doesNotExist');
    assert.dom('body').includesText('afterburner 404 not found:', '404 message appears');

  });

});

