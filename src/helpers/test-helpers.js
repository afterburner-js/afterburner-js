/* eslint-disable max-lines */

/** @module helpers/test-helpers */

const StackyError = require('@afterburner/stacky-error');
const config = require('@afterburner/config');
const { detectPageLoadErrors, settled: customSettled } = require('@afterburner/helper-hooks');

const iframeContainer = document.getElementById('iframeContainer');

let isFramezillaVisible = true;
let logLineNumber = 1;
let consoleLog, framezilla, pFrameWindow, resizeTimer, scrollTimer, lastHighlightedLine, activeAjaxRequests, lastAJAXRequestCompleted;

const ci = new URL(document.location).searchParams.get('ci');

const testHelpers = {
  afterEach,
  beforeEach,
  click,
  currentPage,
  currentPageIs,
  currentPageIsNot,
  elementIsVisible,
  escapeHTML,
  executeCommand,
  fillIn,
  find,
  findAll,
  frameWindow,
  getCurrentPageSearchParams,
  getElementByText,
  getJSON,
  getRandomElement,
  getText,
  getValue,
  hang,
  hideFrameContainer,
  log,
  pause,
  post,
  postJSON,
  reload,
  resolveSelector,
  retry,
  submitForm,
  trimAndRemoveLineBreaks,
  visit,
  waitForPageRedirect
};

function find(selector) {
  return frameWindow().document.querySelector(selector);
}

function findAll(selector) {
  return Array.from(frameWindow().document.querySelectorAll(selector));
}

/**
 * Returns the iframe window object
 * @private
 * @instance
*/
function frameWindow() {
  return pFrameWindow;
}

/**
 * This method is called after every page load.
 * @private
 * @instance
*/
async function afterEachLoad() { // eslint-disable-line require-await
  // await pause(0);

  // override the window open function to prevent annoying popups during tests
  frameWindow().open = function(...args) {
    log(`window.open() was called with args: ${JSON.stringify(args)}`, { emoji: '◻️', color: 'grey', fontStyle: 'italic' });
  };

}

/**
 * Hide the iframe container
 * @private
 * @instance
*/
function hideFrameContainer() {
  iframeContainer.style.height = '0';
  iframeContainer.style.width = '0';
}

/**
 * This method is called after every test run.
 * @private
 * @instance
*/
function afterEach() {

  const removeFrameAfterEachTest = true;

  if (removeFrameAfterEachTest) {
    framezilla.remove();
    hideFrameContainer();
  }

}

/**
 * Show the iframe
 * @private
 * @instance
*/
function showFramezilla() {
  framezilla.style.opacity = '1';
  setFrameContainerSize();
  isFramezillaVisible = true;
}

/**
 * Hide the iframe
 * @private
 * @instance
*/
function hideFramezilla() {
  framezilla.style.position = 'fixed';
  framezilla.style.opacity = '0';
  hideFrameContainer();
  isFramezillaVisible = false;
}

/**
 * Show or hide the iframe depending on scroll position
 *   the reason we do this is because the browser will scroll to elements that get focus
 *   such as calling element.focus().  if we are scrolled down, it is annoying to be
 *   automatically scrolled up.  there is no good workaround, so the solution here is to
 *   always keep the iframe in the viewport, but make it invisible when we are scrolled
 *   down, and make it visible again when we scroll back up
 * @private
 * @instance
*/
window.addEventListener('scroll', () => {

  clearTimeout(scrollTimer);

  scrollTimer = setTimeout(() => {

    if (framezilla) {

      // set position back to where it normally is to determine if it's truly visible or not
      framezilla.style.position = 'static';

      if (elementIsInViewport(framezilla)) {
        showFramezilla();
      }
      else {
        hideFramezilla();
      }

    }

  }, 100);

});

/**
 * Resize the iframe container when window is resized
 * @private
 * @instance
*/
window.addEventListener('resize', () => {

  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {

    if (framezilla) {
      setFrameContainerSize();
    }

  }, 100);

});

/**
 * Resize the iframe container
 * @private
 * @instance
*/
function setFrameContainerSize() {
  const rect = framezilla.getBoundingClientRect();
  iframeContainer.style.width = `${rect.width}px`;
  iframeContainer.style.height = `${rect.height}px`;
}

/**
 * This method is called before every test run.
 * @private
 * @instance
*/
function beforeEach() {

  framezilla = document.createElement('iframe');

  iframeContainer.appendChild(framezilla);

  if (isFramezillaVisible) {
    setFrameContainerSize();
  }
  else {
    hideFramezilla();
  }

  pFrameWindow = framezilla.contentWindow;

}

/**
 * Log AJAX requests.
 * @private
 * @instance
*/
function eavesdrop() {

  activeAjaxRequests = 0;
  lastAJAXRequestCompleted = null;

  log(`${new Date().toISOString()} -- listening for AJAX events on: ${currentPage()}`, { color: 'grey', emoji: '👂', fontStyle: 'italic' });

  const { open } = pFrameWindow.XMLHttpRequest.prototype;

  pFrameWindow.XMLHttpRequest.prototype.open = function(...args) {

    const [, url] = args;

    // requests to browser-sync will show up here.  ignore them.
    if (!url.startsWith('http://localhost:3000/browser-sync')) {

      activeAjaxRequests += 1;

      log(`${new Date().toISOString()} -- ajaxSend: ${url}`, { color: 'grey', emoji: '➡️', fontStyle: 'italic' });

      this.addEventListener('loadend', function() {
        lastAJAXRequestCompleted = new Date();
        activeAjaxRequests -= 1;
        log(`${lastAJAXRequestCompleted.toISOString()} -- ajaxComplete: ${url} -- status: ${this.statusText}`, { color: 'grey', emoji: '⬅️', fontStyle: 'italic' });
      });

    }

    open.apply(this, args);

  };

}

/**
 * Wait for AJAX requests to complete.
 * @private
 * @instance
*/
async function waitForAjaxRequestsToFinish() {

  await pause(1000); // wait before checking for active AJAX requests.  prevents race condition situations

  let inactiveDuration;

  if (lastAJAXRequestCompleted) {
    inactiveDuration = new Date() - lastAJAXRequestCompleted;
  }

  while (activeAjaxRequests > 0 || inactiveDuration < 1000) { // eslint-disable-line no-unmodified-loop-condition

    if (activeAjaxRequests > 0) {
      log(`waiting for ${activeAjaxRequests} AJAX request(s) to complete...`, { emoji: '⌛', color: 'grey', fontStyle: 'italic' });
    }

    await pause(1000); // eslint-disable-line no-await-in-loop

    inactiveDuration = new Date() - lastAJAXRequestCompleted;

  }

  return lastAJAXRequestCompleted;

}

/**
 * Detect proxy errors
 * @private
 * @instance
*/
function detectProxyErrors(reject, outerStack) {

  const { contentType } = frameWindow().document;

  let pageLoaded = true;
  let docTxt;

  if (contentType === 'text/plain') {

    docTxt = frameWindow().document.documentElement.textContent;

    if (docTxt.startsWith('Error occured while trying to proxy')) {
      reject(new StackyError(outerStack, `could not load page: ${docTxt}`));
      pageLoaded = false;
    }

  }

  return pageLoaded;

}

/**
 * Code that executes when we load a page - error detection, waiting for page to finish loading, and tracking load time
 * @private
 * @instance
*/
function bindLoad(resolve, reject, { clickedElement, waitForAjaxRequests = false, isPerformanceTest, logErrors = true, waitForElements }) {

  // get stack information in the outer scope, so if we have failures within the event handler function below, we have more useful information for debugging
  const outerStack = Error().stack;

  let pageLoadSuccess = true;

  const start = new Date();

  framezilla.addEventListener('load', async function afterburnerLoadHandler() {
    framezilla.removeEventListener('load', afterburnerLoadHandler);

    eavesdrop();

    pageLoadSuccess = detectProxyErrors(reject, outerStack);

    if (pageLoadSuccess && typeof detectPageLoadErrors === 'function') {

      const { error, pageLoaded } = detectPageLoadErrors(testHelpers, logErrors, isPerformanceTest);

      if (pageLoaded === false) {
        reject(new StackyError(outerStack, `could not load page: ${error}`));
        pageLoadSuccess = false;
      }

    }

    if (pageLoadSuccess) {

      await settled();

      if (waitForElements) {
        await waitForElementsToLoad(waitForElements); // wait for specific elements to appear in the DOM before considering the page loaded
      }

      let end = new Date();

      if (waitForAjaxRequests) {

        const ajaxEnd = await waitForAjaxRequestsToFinish(waitForAjaxRequests);

        if (ajaxEnd) { end = ajaxEnd; }

      }

      let elementText;

      if (clickedElement) { elementText = clickedElement.outerHTML; }

      logLoadDuration(start, end, elementText, isPerformanceTest);
      log(`${new Date().toISOString()} -- page loaded: ${currentPage()} -- waited for AJAX requests: ${waitForAjaxRequests}`, { color: 'grey', emoji: '📄', fontStyle: 'italic' });

    }

    await afterEachLoad();
    resolve();

  });

}

/**
 * Wait for DOM elements to be available
 * @private
 * @instance
*/
async function waitForElementsToLoad(elements) {

  // TODO: update callers public API documentation to reflect acceptable values for `elements`:
  // * - a string containing a selector expression
  // * <br> - an Array of selector expression strings

  for (const s of elements) {

    const e = resolveSelector(s);

    await retry(0.1, 100, '', () => { // eslint-disable-line no-await-in-loop
      return e.length === 0 || !elementIsVisible(e);
    }, true);

  }

}

// todo: add note in jsdoc that click(), elementIsVisible, etc. will get the first element that matches if an array or selector is passed in

/**
 * Click on an element.  If the element is an &lt;a&gt; or [type="submit"], then this will resolve after page load completes.
 * @param {selector|HTMLElement|Array} selector
 * - a string containing a selector expression
 * <br> - an HTMLElement
 * <br> - an Array of HTMLElements
 * @param {object} [options]
 * @param {boolean} [options.expectPageLoad=null] if true, forces a page load to occur before resolving.  if false, resolves immediately after click.  if not specified, the default behavior is such that a page load will be expected if the clicked element is an anchor tag or an element of type="submit"
 * @param {boolean} [options.waitForAjaxRequests=false] wait for pending AJAX requests to complete before resolving
 * @param {number} [options.timeout=1] fractional minutes - custom timeout for rejecting
 * @param {boolean} [options.logErrors=true] log errors
 * @param {selector} [options.waitForElements] elements to wait for being available in the DOM before resolving (same type as selector (first argument))
 * @returns {promise}
 * @instance
 * @example
 * await click('.someSelector');
 * await click('.someSelector', { expectPageLoad: true });
*/
function click(selector, { expectPageLoad = null, waitForAjaxRequests, timeout, logErrors = true, waitForElements } = { expectPageLoad: null }) {

  const [e] = resolveSelector(selector);

  return new Promise((resolve, reject) => {

    if (!e) {
      reject(new Error(`'${selector}' did not exist on page ${currentPage()}`));
      return;
    }

    setPromiseTimeout(reject, timeout);

    if (expectPageLoad === true || (expectPageLoad === null && (e.getAttribute('type') === 'submit' || e.nodeName === 'A'))) { // eslint-disable-line no-extra-parens
      bindLoad(resolve, reject, { $clickedElement: e, waitForAjaxRequests, logErrors, waitForElements });
      simulateMouseClick(e);
    }
    else {
      resolveSynchronousClick(e, resolve, waitForElements);
    }

  });

}

/**
 * Simulate a mouse click, and optionally wait for elements to load before resolving
 * @private
 * @instance
*/
async function resolveSynchronousClick(e, resolve, waitForElements) {

  simulateMouseClick(e);

  await settled();

  if (waitForElements) {
    await waitForElementsToLoad(waitForElements);
  }

  resolve();

}

/**
 * Simulate a key press
 * @private
 * @instance
*/
function simulateKeyPress(e) {

  const element = e.length > 1 ? e[0] : e;

  // all three of these events fire, in this order, when a key is pressed
  element.dispatchEvent(new KeyboardEvent('keydown'));
  element.dispatchEvent(new KeyboardEvent('keypress'));
  element.dispatchEvent(new KeyboardEvent('keyup'));

}

/**
 * Simulate a mouse click
 * @private
 * @instance
*/
function simulateMouseClick(e) {

  const element = e.length > 1 ? e[0] : e;

  const options = {
    bubbles: true, // make the event bubble up, since sometimes click handlers are bound to other DOM elements that wrap the content we are clicking
    button: 0 // simulate that we clicked the primary mouse button
  };

  // all three of these events fire, in this order, when the mouse button is clicked
  element.dispatchEvent(new MouseEvent('mousedown', options));
  element.dispatchEvent(new MouseEvent('mouseup', options));
  element.dispatchEvent(new MouseEvent('click', options));

}

/**
 * Submit the &lt;form&gt; by clicking on the first [type="submit"] in the DOM
 * @param {object} [options]
 * @param {boolean} [options.logErrors=true] log errors
 * @returns {promise}
 * @instance
 * @example
 * await submitForm();
*/
async function submitForm({ logErrors = true } = {}) {
  await click('[type="submit"]', { logErrors });
}

/**
 * Get the current page
 * @returns {string} window.location.pathname
 * @instance
*/
function currentPage() {
  return frameWindow().location.pathname;
}

/**
 * Determine whether the current page matches a provided string
 * @param {string} expected expected page
 * @returns {boolean}
 * @instance
*/
function currentPageIs(expected, isNot) {

  if (!expected) { throw new Error('expected page is undefined'); }

  const page = currentPage();

  if (isNot) {
    return page.indexOf(expected) < 0;
  }

  return page.indexOf(expected) >= 0;

}

/**
 * Determine whether the current page does not match a provided string
 * @param {string} expected expected page
 * @returns {boolean}
 * @instance
*/
function currentPageIsNot(expected) {
  return currentPageIs(expected, true);
}

/**
 * Set the value of a form element
 * @param {selector|HTMLElement|Array} selector
 * - a string containing a selector expression
 * <br> - an HTMLElement
 * <br> - an Array of HTMLElements
 * @param {string} value
 * @instance
 * @example
 * fillIn('.someSelector', 'someValue');
*/
function fillIn(selector, value) {
  // TODO: add error message to the log if resolveSelector returns []
  resolveSelector(selector).forEach(e => {

    if (e instanceof frameWindow().HTMLElement && !e.disabled) {

      if (e instanceof frameWindow().HTMLInputElement && e.getAttribute('type') === 'checkbox') {

        if (value) {
          if (!e.checked) {
            simulateMouseClick(e);
            e.dispatchEvent(new Event('change'));
          }
        }
        else if (e.checked) {
          simulateMouseClick(e);
          e.dispatchEvent(new Event('change'));
        }

      }
      else if (e.value != value) { // eslint-disable-line eqeqeq
        // relaxed comparison in case the caller passes in a number or something
        // for this check, we would consider 1 and "1" to be equal
        // and we wouldn't change the value nor fire an event
        e.value = value;
        simulateKeyPress(e); // fire event handlers that may be bound
        e.dispatchEvent(new Event('change'));
      }

    }

  });
}

function resolveSelector(selector) {

  if (typeof selector === 'string') {
    return findAll(selector);
  }

  if (Array.isArray(selector)) {
    return selector;
  }

  if (!selector) {
    return [];
  }

  return [selector];

}

/**
 * Navigate to a page
 * @param {string} url the url to navigate to
 * @param {object} [options]
 * @param {boolean} [options.waitForAjaxRequests=false] wait for pending AJAX requests to complete before resolving
 * @param {number} [options.timeout=1] fractional minutes - custom timeout for rejecting
 * @param {boolean} [options.isPerformanceTest=false] context is a performance test - additional logging and waiting for AJAX requests before resolving
 * @param {boolean} [options.logErrors=true] log errors
 * @param {selector|HTMLElement|Array} [options.waitForElements] elements to wait for being available in the DOM before resolving<br>
 * - a string containing a selector expression
 * <br> - an HTMLElement
 * <br> - an Array of HTMLElements
 * @returns {promise}
 * @instance
 * @example
 * await visit('someURL');
 * await visit('someURL', { waitForAjaxRequests: true, waitForElements: ['.someElement', '.someOtherElement'] });
*/
function visit(url, { waitForAjaxRequests, timeout, isPerformanceTest, logErrors = true, waitForElements } = {}) {

  return new Promise((resolve, reject) => {

    setPromiseTimeout(reject, timeout);
    bindLoad(resolve, reject, { waitForAjaxRequests, timeout, isPerformanceTest, logErrors, waitForElements });

    log(`${new Date().toISOString()} -- navigating to: ${url}`, { color: 'grey', emoji: '🔗', fontStyle: 'italic' });

    framezilla.src = url;

  });

}

/**
 * Wait for page to be redirected automatically
 * @param {object} [options]
 * @param {boolean} [options.waitForAjaxRequests=false] wait for pending AJAX requests to complete before resolving
 * @param {number} [options.timeout=1] fractional minutes - custom timeout for rejecting
 * @returns {promise}
 * @instance
 * @example
 * await waitForPageRedirect();
 * await waitForPageRedirect({ waitForAjaxRequests: true });
*/
function waitForPageRedirect({ waitForAjaxRequests, timeout } = {}) {

  return new Promise((resolve, reject) => {
    setPromiseTimeout(reject, timeout);
    bindLoad(resolve, reject, { waitForAjaxRequests, timeout });
  });

}

async function settled() {

  if (config.environments && config.environments.includes('ember')) {

    const w = frameWindow();

    if (w.Ember) {
      // we're on an Ember page

      let router;

      while (
        // check run loop is clear
        w.Ember.run.currentRunLoop ||
        // check run loop schedule is clear
        w.Ember.run.hasScheduledTimers() ||
        // check router is available
        !router ||
        // check route transitions
        router._routerMicrolib.activeTransition // eslint-disable-line no-underscore-dangle
      ) {

        await pause(100); // eslint-disable-line no-await-in-loop

        if (!router) {
          ({ router } = w.Ember.A(w.Ember.Namespace.NAMESPACES).find(a => { return a.name !== 'DS'; })._applicationInstances.values().next().value); // eslint-disable-line no-underscore-dangle,new-cap
        }

      }

    }

  }

  if (typeof customSettled === 'function') {
    await customSettled();
  }

}

/**
 * Log information about page load
 * @private
 * @instance
*/
function logLoadDuration(start, end, elementText, isPerformanceTest) {

  const duration = end - start;

  let txt, time, emoji, color, fontStyle;

  if (duration >= 1000) {
    time = `${(duration / 1000).toFixed(1)}s`;
  }
  else {
    time = `${duration}ms`;
  }

  while (time.length < 7) {
    time += ' ';
  }

  const { location } = frameWindow();

  txt = `${time} to load ${location.pathname}${decodeURIComponent(location.search)}`;

  if (elementText) {
    txt += ` -- via ${escapeHTML(elementText).replace(/\n/g, ' ')}`;
  }

  let dataAttributes = 'data-page-load-time';

  if (isPerformanceTest) {
    dataAttributes += ' data-page-load-time-performance';
    emoji = '⏱️';
    txt = `(Perf) ${txt}`;
  }
  else {
    color = 'grey';
    emoji = '⌚';
    fontStyle = 'italic';
  }

  log(txt, { color, dataAttributes, emoji, fontStyle });

}

// todo: move everything out of test-helpers that's not actually a test helper

function toggleDisplay(selector, show) {

  document.querySelectorAll(selector).forEach(e => {

    if (show) {
      e.style.display = 'block';
    }
    else {
      e.style.display = 'none';
    }

  });

}

function toggleDisplayBasedOnMatch(selector, matchSelector) {

  document.querySelectorAll(selector).forEach(e => {

    if (e.matches(matchSelector)) {
      e.style.display = 'block';
    }
    else {
      e.style.display = 'none';
    }

  });

}

/**
 * Handler for checkbox controlling hiding/showing DOM output in the UI console
 * @private
 * @instance
*/
function handleDOMOutputCheckboxChange(e) {

  if (!e.checked) {
    toggleDisplay('.console-log p[data-dom-output]', false);
  }
  else if (elementIsVisible(find('.console-log p[data-errors]'))) {
    toggleDisplay('.console-log p[data-dom-output]', true);
  }

}

function setupConsole() {

  consoleLog = document.createElement('div');
  consoleLog.classList.add('console-log');

  const chkShowDOM = document.createElement('input');
  chkShowDOM.type = 'checkbox';
  chkShowDOM.id = 'chkShowDOM';

  const lblShowDOM = document.createElement('label');
  lblShowDOM.htmlFor = 'chkShowDOM';
  lblShowDOM.textContent = 'Show DOM Output for Failures';

  chkShowDOM.addEventListener('change', () => {
    handleDOMOutputCheckboxChange(chkShowDOM);
  });

  const bttnClearFilters = document.createElement('button');
  bttnClearFilters.classList.add('console-log__button');
  bttnClearFilters.textContent = 'Clear Filters';

  bttnClearFilters.addEventListener('click', () => {
    toggleDisplay('.console-log p', true);
    handleDOMOutputCheckboxChange(chkShowDOM);
  });

  const bttnErrors = document.createElement('button');
  bttnErrors.classList.add('console-log__button');
  bttnErrors.textContent = 'Errors';

  bttnErrors.addEventListener('click', () => {
    const showSelector = chkShowDOM.checked ? '[data-errors]' : '[data-errors]:not([data-dom-output])';
    toggleDisplayBasedOnMatch('.console-log p', showSelector);
  });

  const bttnLoad = document.createElement('button');
  bttnLoad.classList.add('console-log__button');
  bttnLoad.textContent = 'Load Times';

  bttnLoad.addEventListener('click', () => {
    toggleDisplayBasedOnMatch('.console-log p', '[data-page-load-time]');
  });

  const bttnPerf = document.createElement('button');
  bttnPerf.classList.add('console-log__button');
  bttnPerf.textContent = 'Performance Load Times';

  bttnPerf.addEventListener('click', () => {
    toggleDisplayBasedOnMatch('.console-log p', '[data-page-load-time-performance]');
  });

  bindFutureElementEvent(consoleLog, 'p.console-log__entry', 'mousedown', line => {

    if (lastHighlightedLine === line) { return; }

    if (lastHighlightedLine) { lastHighlightedLine.style.backgroundColor = '#1e1e1e'; }

    lastHighlightedLine = line;
    lastHighlightedLine.style.backgroundColor = '#282A2E';

  });

  consoleLog.appendChild(bttnClearFilters);
  consoleLog.appendChild(bttnErrors);
  consoleLog.appendChild(bttnLoad);
  consoleLog.appendChild(bttnPerf);
  consoleLog.appendChild(chkShowDOM);
  consoleLog.appendChild(lblShowDOM);
  consoleLog.appendChild(document.createElement('hr'));
  document.body.appendChild(consoleLog);

}

function bindFutureElementEvent(container, futureElementSelector, eventType, callback) {

  container.addEventListener(eventType, function(e) {

    let element, parent;

    switch (true) {
      case e.target.matches(futureElementSelector):
        element = e.target;
        break;
      case e.target === this:
        return;

      default:

        while (parent !== container) {
          parent = e.target.parentElement;

          if (parent.matches(futureElementSelector)) {
            element = parent;
            break;
          }
        }

    }

    if (element) {
      callback(element); // eslint-disable-line callback-return
    }

  });

}

/**
 * Log text
 * @param {string} txt the text to write to the log
 * @param {object} [options]
 * @param {string} [options.color=amber] CSS color value for the text
 * @param {string} [options.dataAttributes] data attributes for the log entry
 * @param {string} [options.emoji] emoji to prefix the log entry
 * @param {string} [options.fontStyle=normal] CSS font style for the text
 * @param {string} [options.fontWeight=normal] CSS font weight for the text
 * @param {boolean} [options.hidden=false] make the log entry hidden
 * @instance
 * @example
 * log('These pretzels are making me thirsty.');
 * log('These pretzels are making ME thirsty.', { color: 'red'; });
 * log('THESE pretzels are making me THIRSTY.', { emoji: '🥨', color: '#051243', fontWeight: 'bold' });
*/
function log(txt, { color = '#ffbf00', dataAttributes = '', emoji = '', fontStyle = 'normal', fontWeight = 'normal', hidden } = { color: '#ffbf00', dataAttributes: '', emoji: '', fontStyle: 'normal', fontWeight: 'normal' }) {

  if (!consoleLog) { setupConsole(); }

  const p = document.createElement('p');
  p.classList.add('console-log__entry');

  if (dataAttributes) {
    dataAttributes.split(' ').forEach(a => {
      p.setAttribute(a, '');
    });
  }

  p.innerHTML = `<span class="console-log__entry-line-number">${logLineNumber}</span> `;

  if (hidden) { p.style.display = 'none'; }

  if (emoji) { p.textContent += `${emoji} `; }

  const style = `color:${color};font-weight:${fontWeight};font-style:${fontStyle};`;

  p.innerHTML += `<span class="console-log__entry-content" style="${style}">${txt}</span>`;

  consoleLog.appendChild(p);

  if (ci) {
    console.log(`${p.textContent.trim()}`);
  }
  else {
    console.log(`%c${p.textContent.trim()}`, style);
  }

  logLineNumber += 1;

}

/**
 * Escape HTML for rendering
 * @private
 * @instance
*/
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Pause thread for an amount of time
 * @param {number} ms milliseconds to pause
 * @returns {promise}
 * @instance
 * @example
 * await pause(1 * 1000); // pause for 1 second
*/
function pause(ms) {
  return new Promise(resolve => { return setTimeout(resolve, ms); });
}

/**
 * Pause forever!  While writing tests or debugging, sometimes we want to halt execution.  Calling this function is often easier than setting a breakpoint
 * @returns {promise} returned promise will never resolve nor reject
 * @instance
 * @example
 * await hang(); // hangin' tough
*/
function hang() {
  return new Promise(() => { }); // eslint-disable-line no-empty-function
}

/**
 * Gets the first element matching the provided text if the text appears anywhere in the element
 * @param {selector|HTMLElement|Array} selector
 * - a string containing a selector expression
 * <br> - an HTMLElement
 * <br> - an Array of HTMLElements
 * @returns {HTMLElement | null} the element found or null
 * @instance
 * @example
 * getElementByText(myElements, 'textToLookFor');
*/
function getElementByText(selector, text) {

  const elements = resolveSelector(selector);

  for (const e of elements) {

    if (e.textContent.trim().includes(text)) {
      return e;
    }

  }

  return null;

}

/**
 * Remove whitespace and linebreaks from text input
 * @private
 * @instance
*/
function trimAndRemoveLineBreaks(txt) {
  return txt.replace(/\s+/g, ' ').trim();
}

/**
 * Reject a promise after the specified time has passed
 * @param {function} reject the reject function of a promise
 * @param {number} [timeout=1] fractional minutes - custom timeout for rejecting
 * @param {function} [callback] a callback function to execute after the promise is rejected
 * @private
 * @instance
*/
function setPromiseTimeout(reject, timeout) {

  let pTimeout, message;

  if (timeout) {
    pTimeout = timeout * 60000;
    message = `${pTimeout} minute(s)`;
  }
  else {
    pTimeout = 60000;
    message = '1 minute';
  }

  setTimeout(() => {
    reject(new Error(`promise did not resolve within ${message}`));
  }, pTimeout);

}

/**
 * Reload the current page
 * @param {object} [options]
 * @param {boolean} [options.waitForAjaxRequests=false] wait for pending AJAX requests to complete before resolving
 * @param {number} [options.timeout=1] fractional minutes - custom timeout for rejecting
 * @returns {promise}
 * @instance
 * @example
 * await reload();
 * await reload({ waitForAjaxRequests: true });
*/
async function reload({ waitForAjaxRequests, timeout } = {}) {
  await visit(frameWindow().location.href, { waitForAjaxRequests, timeout });
}

/**
 * Retry a function until it returns false, or timeout expires
 * @param {number} timeout fractional minutes - length of time to retry
 * @param {number} pauseRate milliseconds - time to pause between retries (frequency)
 * @param {string} logMessage message to write to log before each retry (should describe what retryFunction is doing)
 * @param {function} retryFunction function to retry - must return a boolean - function will be retried until it returns false
 * @param {boolean} [suppressLog=false] don't write to the log (useful for retry operations with a high frequency)
 * @instance
 * @example
 * // retry every 5 seconds, timeout after 3 minutes
 * await retry(3, 5000, 'reload page and look for a change in text', async() => {
 *   await reload();
 *   return find('.someSelector').textContent === 'some text';
 * });
 *
 * // retry every 100ms, timeout after 6 seconds (.1 minute).  suppressLog=true because we don't want 60 messages in the log
 * await retry(0.1, 100, 'waiting for DOM element to appear', () => { // eslint-disable-line no-await-in-loop
 *   return findAll('.someSelector').length === 0;
 * }, true);
*/
async function retry(timeout, pauseRate, logMessage, retryFunction, suppressLog) {

  const start = new Date();

  while (new Date() - start < timeout * 60000 && await retryFunction()) { // eslint-disable-line no-await-in-loop

    if (!suppressLog) {
      log(`${new Date().toISOString()} -- pausing for ${pauseRate / 1000} second(s) -- ${logMessage}`, { color: 'grey', emoji: '⏸️', fontStyle: 'italic' });
    }

    await pause(pauseRate); // eslint-disable-line no-await-in-loop

  }

}

/**
 * Get a random element from a collection
   * @param {selector|HTMLElement|Array} selector
   * - a string containing a selector expression
   * <br> - an HTMLElement
   * <br> - an Array of HTMLElements
 * @returns {HTMLElement} a single HTMLElement
 * @instance
 * @example
 * getRandomElement($myElements);
*/
function getRandomElement(selector) {
  const e = resolveSelector(selector);
  return e[Math.floor(Math.random() * e.length)];
}

/**
 * Enum for properties of DOM elements
 * @readonly
 * @enum {number}
 * @private
 * @instance
 */
const elementPropertyTypeEnum = Object.freeze({
  TEXT: 0,
  VALUE: 1
});

/**
 * Get property of a DOM element
 * @private
 * @instance
*/
function getProp(selector, prop) {

  const [e] = resolveSelector(selector);

  if (!e) {
    throw new Error(`'${selector}' did not exist on page ${currentPage()}`);
  }

  switch (prop) {
    case elementPropertyTypeEnum.TEXT:
      return e.textContent;
    case elementPropertyTypeEnum.VALUE:
      return e.value;
    default:
      throw new Error(`'${prop}' is not a supported property`);
  }

}

/**
 * Get the text of a DOM element
 * @param {selector|HTMLElement|Array} selector
 * - a string containing a selector expression
 * <br> - an HTMLElement
 * <br> - an Array of HTMLElements
 * @returns {string} text of the element
 * @instance
 * @example
 * getText('.someSelector');
*/
function getText(selector) {
  return getProp(selector, elementPropertyTypeEnum.TEXT);
}

/**
 * Get the value of a DOM element
 * @param {selector|HTMLElement|Array} selector
 * - a string containing a selector expression
 * <br> - an HTMLElement
 * <br> - an Array of HTMLElements
 * @returns {string} value of the element
 * @instance
 * @example
 * getValue('.someSelector');
*/
function getValue(selector) {
  return getProp(selector, elementPropertyTypeEnum.VALUE);
}

/**
 * Determine if an element is visible
 * @param {selector|HTMLElement|Array} selector
 * - a string containing a selector expression
 * <br> - an HTMLElement
 * <br> - an Array of HTMLElements
 * @returns {boolean}
 * @instance
 * @example
 * elementIsVisible(someElement);
*/
function elementIsVisible(selector) {

  const [e] = resolveSelector(selector);

  return e && Boolean(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

}

/**
 * Determine if an element is visible in the viewport
 * @param {selector|HTMLElement|Array} selector
 * - a string containing a selector expression
 * <br> - an HTMLElement
 * <br> - an Array of HTMLElements
 * @returns {boolean}
 * @private
 * @instance
*/
function elementIsInViewport(selector) {
  const [e] = resolveSelector(selector);
  // consider element in view as long as we can still see the bottom of it
  return e.getBoundingClientRect().bottom > 0;
}

function getCurrentPageSearchParams() {
  return new URL(frameWindow().location).searchParams;
}

/**
 * Executes a shell command
 * @param {string} command command to run
 * @param {object} [options]
 * @param {string} [options.cwd] current working directory
 * @param {number} [options.timeout=60] seconds - custom timeout for rejecting
 * @returns {object} { exitCode, stdout, stderr }
 * @instance
 * @example
*/
async function executeCommand(command, { cwd, timeout } = { cwd: '', timeout: '' }) {
// TODO: examples
  const response = await getJSON(`http://localhost:3000/afterburner/shelly?cmd=${command}&cwd=${cwd}&timeout=${timeout}`);
  const data = await response.json();

  if (data.exitCode !== 0) {
    log(`command failed:\n${JSON.stringify(data)}`, { color: 'red', dataAttributes: 'data-errors', emoji: '❌' });
  }

  return {
    exitCode: data.exitCode,
    stdout: data.stdout,
    stderr: data.stderr
  };

}

/**
 * Gets a JSON response via GET XMLHttpRequest
 * @param {string} url
 * @returns {Response/promise}
 * @instance
 * @example
 * await getJSON('someURL');
*/
function getJSON(url) {
  return ajax({ url, method: 'GET' });
}

/**
 * Sends data via POST XMLHttpRequest application/x-www-form-urlencoded
 * @param {string} url
 * @param {object|string} data data to be sent to the server. it is converted to a query string, if not already a string. object must be key/value pairs. if value is an Array, serializes multiple values with same key
 * @returns {Response/promise}
 * @instance
 * @example
 * await post('someURL', 'some value');
 * await post('someURL', { someKey: 'someValue' });
*/
function post(url, data) {
  // the Fetch Standard states that if the body is a URLSearchParams object then it should be serialised as application/x-www-form-urlencoded
  return ajax({ url, data: new URLSearchParams(data), method: 'POST' });
}

/**
 * Sends data via POST XMLHttpRequest application/json
 * @param {string} url
 * @param {object} data data to be sent to the server
 * @returns {Response/promise}
 * @instance
 * @example
 * await postJSON('someURL', someObject);
*/
function postJSON(url, data) {
  return ajax({ url, data: JSON.stringify(data), method: 'POST', contentType: 'application/json' });
}

/**
 * Low-level wrapper for AJAX requests.  Consistent error handling and stack traces.  All AJAX request methods should call this method.
 * @returns {Response/promise}
 * @private
 * @instance
*/
function ajax({ method, url, data, contentType, timeout }) {
// TODO: log the request... maybe the response status/code
  const options = {
    cache: 'no-cache',
    method,
    redirect: 'error',
  };

  if (data) { options.body = data; }

  if (contentType) { options.headers = { 'Content-Type': contentType }; }

  const controller = new AbortController();

  const p1 = new Promise((resolve, reject) => {

    const { signal } = controller;

    options.signal = signal;

    setPromiseTimeout(reject, timeout, () => {
      controller.abort();
    });

    const p2 = fetch(url, options);

    p2.then(r => {
      resolve(r);
    }, r => {
      reject(r);
    });

  });

  p1.then(() => {
    // here be dragons
  }, () => {
    // this is called if the promise rejects due to timeout
    controller.abort();
  });

  return p1;

}

module.exports = testHelpers;

// todo: move ajax methods to helpers/fetch.js / @afterburner/fetch
// todo: move everything else that is "framework" into `src` directory and browsersify via gulpfile, import @ aliases
// todo: fix vscode intellisense for aliased modules
