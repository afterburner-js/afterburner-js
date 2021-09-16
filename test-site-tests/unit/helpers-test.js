const afterburner = require('@afterburner/test');
const {
  escapeHTML,
  trimAndRemoveLineBreaks
} = require(`@afterburner/test-helpers`);

afterburner.module('Unit | Helpers', () => {

  afterburner.test('trimAndRemoveLineBreaks', assert => {

    const strX = `

    These

  pretzels

  are
  making

      me

  thirsty.

  `;

    const expected = 'These pretzels are making me thirsty.';

    assert.equal(trimAndRemoveLineBreaks(strX), expected, 'the string was trimmed correctly');

  });

  afterburner.test('escapeHTML', assert => {

    const strX = '<script value="These pretzels are making my thirsty.">These pretzels are making me thirsty. &</script>';

    const expected = '&lt;script value=&quot;These pretzels are making my thirsty.&quot;&gt;These pretzels are making me thirsty. &amp;&lt;/script&gt;';

    assert.equal(escapeHTML(strX), expected, 'the string was escaped correctly.');

  });

});

