/* eslint-disable max-lines */

/**
 * Custom QUnit assertions.  See {@link module:helpers/assertions~DomAssertions DomAssertions} for specific assertions for DOM verification.
 * @module helpers/assertions
 *
*/

const QUnit = require('qunit');
const {
  currentPage,
  currentPageIs,
  elementIsVisible,
  frameWindow,
  resolveSelector,
  trimAndRemoveLineBreaks
} = require('@afterburner/test-helpers');

/**
 * Wrapper for curried functions returned from `assert.dom()`.
 * See methods below for usage examples.
 */
class DomAssertions {

  /**
  * private constructor - nothing to see here 👀
  */
  constructor(selector, e, qunitThis) {
    this.selector = selector;
    this.e = e;
    this.qunitThis = qunitThis;
  }

  /**
   * @private
   */
  pushResult(result) {
    this.qunitThis.pushResult(result);
  }

  /**
   * `dom()` returns 0 elements
   * @param {string} message assertion message
   * @example
   * assert.dom('.someSelector').doesNotExist('element does not exist');
   */
  doesNotExist(message) {

    this.pushResult({
      result: this.e.length === 0,
      actual: this.e.length,
      expected: 0,
      message: message || `${this.selector} yielded ${this.e.length} elements`
    });

  }

  doesNotIncludeText(expected, options) {

    let useOptions;

    switch (typeof options) {
      case 'string':
        useOptions = { message: options };
        break;
      case 'object':
        useOptions = options;
        break;
      default:
        useOptions = {};
    }

    useOptions.doesNot = true;

    this.hasText(expected, useOptions);

  }

  /**
   * `dom()` returns more than 0 elements (or exact number specified by `options.count`)
   * @param {string} message assertion message (if not using `options`)
   * @param {object} [options]
   * @param {integer} [options.count] expected number of elements
   * @param {string} [options.message] assertion message
   */
  exists(options) {

    let count, message, result;

    if (typeof options === 'string') {
      count = null;
      message = options;
    }
    else {
      ({ count, message } = options);
    }

    if (count === null) {
      result = this.e.length > 0;
    }
    else {
      result = this.e.length === count;
    }

    this.pushResult({
      result,
      actual: this.e.length,
      expected: count || '> 0',
      message: message || `${this.selector} yielded ${this.e.length} elements`
    });

  }

  hasClass(cssClass, message) {

    const actualClass = this.e[0].getAttribute('class');

    this.pushResult({
      result: this.e[0].classList.contains(cssClass),
      actual: actualClass,
      expected: cssClass,
      message: message || `${this.selector} has class ${actualClass}`
    });

  }

  /**
   * element text matches `expected` exactly
   * @param {string} expected expected text
   * @param {string} message assertion message
   * @example
   * assert.dom('.someSelector').hasText('some text', 'element has the text we expect');
   */
  hasText(expected, options = {}) {

    let doesNot, dontTrim, element, includes, message, removeLineBreaks, result, text;

    if (typeof options === 'string') {
      message = options;
    }
    else {
      ({ doesNot, dontTrim, includes, message, removeLineBreaks } = options);
    }

    if (typeof this.e.length === 'number') {
      [element] = this.e;
    }
    else {
      element = this.e;
    }

    text = element.textContent;

    if (typeof text !== 'string') { text = ''; }

    if (dontTrim) {
      // don't trim, obviously :D
    }
    else if (removeLineBreaks) {
      text = trimAndRemoveLineBreaks(text);
    }
    else {
      text = text.trim();
    }

    if (doesNot) {
      result = !text.includes(expected);
    }
    else {
      result = includes ? text.includes(expected) : text === expected;
    }

    this.pushResult({
      result,
      actual: text,
      expected,
      message: message || `${this.selector} has text '${text}'`
    });

  }

  /**
   * element text includes `expected` anywhere
   * @param {string} expected expected text
   * @param {string} message assertion message
   * @example
   * assert.dom('.someSelector').includesText('some text', 'element includes the text we expect');
   */
  includesText(expected, options) {

    let useOptions;

    switch (typeof options) {
      case 'string':
        useOptions = { message: options, includes: true };
        break;
      case 'object':
        useOptions = options;
        useOptions.includes = true;
        break;
      default:
        useOptions = { includes: true };
    }

    this.hasText(expected, useOptions);

  }

  isChecked(message, inverse) {

    const result = inverse ? !this.e[0].checked : this.e[0].checked;

    this.pushResult({
      result,
      actual: result,
      expected: true,
      message: message || `${this.selector} is checked: ${result}`
    });

  }

  isDisabled(message, inverse) {

    const result = inverse ? !this.e[0].disabled : this.e[0].disabled;

    this.pushResult({
      result,
      actual: result,
      expected: true,
      message: message || `${this.selector} is disabled: ${result}`
    });

  }

  isEnabled(message) {
    this.isDisabled(message, true);
  }

  isNotChecked(message) {
    this.isChecked(message, true);
  }

  isVisible(message, inverse) {

    const result = inverse ? !elementIsVisible(this.e) : elementIsVisible(this.e);

    this.pushResult({
      result,
      actual: result,
      expected: true,
      message: message || `${this.selector} is visible: ${result}`
    });

  }

  isNotVisible(message) {
    this.isVisible(message, true);
  }

}

module.exports = function() {

  /**
   * Current page (url) matches `expected`.
   * Uses {@link module:helpers/test-helpers#currentPageIs currentPageIs()} test helper
   * @param {string} expected expected page
   * @param {string} message assertion message
   * @alias module:helpers/assertions.currentPageIs
   */
  QUnit.assert.currentPageIs = function(expected, message, isNot) {

    const result = currentPageIs(expected, isNot);

    let pExpected, pMessage;

    if (message) {
      pMessage = message;
    }
    else if (isNot) {
      pMessage = result ? `we are NOT on the ${expected} page` : `we are on the ${expected} page`;
    }
    else {
      pMessage = result ? `we are on the ${expected} page` : `we are NOT on the ${expected} page`;
    }

    if (isNot) {
      pExpected = `not ${expected}`; // required because `actual` and `expected` cannot be the same for a failed result
    }
    else {
      pExpected = expected;
    }

    this.pushResult({
      result,
      actual: currentPage(),
      expected: pExpected,
      message: pMessage
    });

  };

  /**
   * Current page (url) is something other than `expected`.
   * Uses {@link module:helpers/test-helpers#currentPageIsNot currentPageIsNot()} test helper
   * @param {string} expected expected page
   * @param {string} message assertion message
   * @alias module:helpers/assertions.currentPageIsNot
   */
  QUnit.assert.currentPageIsNot = function(expected, message) {
    QUnit.assert.currentPageIs(expected, message, true);
  };

  /**
   * Gets element(s) from the DOM.  First part of a curried function call to a DOM assertion.
   * This cannot be called on its own and requires a chained DomAssertion function call.
   * See {@link module:helpers/assertions~DomAssertions DomAssertions} for usage information.
   * @param {selector|HTMLElement|Array} selector
   * - a string containing a selector expression
   * <br> - an HTMLElement
   * <br> - an Array of HTMLElements
   * @returns {DomAssertions} {@link module:helpers/assertions~DomAssertions DomAssertions} instance with curried functions
   * @alias module:helpers/assertions.dom
   */
  QUnit.assert.dom = function(selector) {

    const e = resolveSelector(selector);

    let mutatedSelector;

    if (selector instanceof frameWindow().HTMLElement) {
      mutatedSelector = selector.nodeName;
    }
    else if (typeof selector === 'string') {
      mutatedSelector = selector;
    }
    else if (selector) {
      mutatedSelector = selector.toString();
    }

    return new DomAssertions(mutatedSelector, e, this);

  };

};
