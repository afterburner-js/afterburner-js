const QUnit = require('qunit');
const { afterEach, beforeEach, frameWindow, log } = require('@afterburner/test-helpers');
const assertions = require('@afterburner/assertions');
const lifecycle = require('@afterburner/lifecycle');

function handleMessage(e) {

  const { error } = e.data;

  if (error) { log(`${error.message}\n${error.stack}`, { color: 'red', dataAttributes: 'data-errors', emoji: '❌' }); }

}

function getRandomAlphaNumeric(length) {

  let alphaNumeric = '';

  while (alphaNumeric.length < length) {
    alphaNumeric += Math.random().toString(36).slice(2);
  }

  return alphaNumeric.slice(0, length);

}

const loc = new URL(document.location);

if (!loc.searchParams.has('seed')) {
  // force a seed param
  // necessary because location changes will change 'seed' to 'seed=' which causes QUnit to not generate a seed, and thus seed would be undefined
  loc.searchParams.set('seed', getRandomAlphaNumeric(10));
  location.replace(loc);
}

window.addEventListener('message', handleMessage, false);

QUnit.log(({ result, message, actual, expected, source }) => {

  let txt = result ? 'SUCCESS: ' : 'FAILURE: ';

  if (message) {

    txt += message;

    if (!result) { txt += ', '; }

  }

  if (!result && (actual || expected)) {
    txt += `expected: '${expected}', actual: '${actual}'`;
  }

  if (source) {
    txt += `, ${source}`;
  }

  if (result) {
    log(txt, { color: 'green', emoji: '✅' });
  }
  else {

    log(txt, { color: 'red', dataAttributes: 'data-errors', emoji: '❌' });

    if (frameWindow()) {
      log(`BEGIN DOM OUTPUT FOR FAILURE: ${message}\n---\n${frameWindow().document.documentElement.outerHTML}\n---\n🖨️ END DOM OUTPUT FOR FAILURE: ${message}`, { color: 'grey', dataAttributes: 'data-errors data-dom-output', emoji: '🖨️', hidden: true });
    }

  }

});

QUnit.begin(() => {

  const host = loc.searchParams.get('host');
  const header = document.querySelector('#qunit-header a');
  const spanHost = document.createElement('span');

  spanHost.textContent = `Host: ${host}`;
  header.parentNode.appendChild(spanHost);

  assertions();
  log(`Seed value: ${QUnit.config.seed}`, { emoji: '🌱' });
  log(`Host: ${host}`, { emoji: '🌐', color: 'MediumPurple' });
  log(`User Agent: ${navigator.userAgent}`, { emoji: '🕵️', color: 'Lavender' });

  lifecycle.begin();

});

QUnit.moduleStart(({ name }) => {
  log(`--- Starting module '${name}' ---`, { color: 'grey', fontStyle: 'italic' });
});

QUnit.moduleDone(({ failed, name, passed, runtime, total }) => {
  log(`--- Finished module '${name}' - Total: ${total}, Failed: ${failed}, Passed: ${passed}, Runtime: ${(runtime / 1000).toFixed(1)}s ---`, { color: 'grey', fontStyle: 'italic' });
});

QUnit.testStart(({ name }) => {
  log(`--- Starting test '${name}' ---`, { color: 'grey', fontStyle: 'italic' });
});

QUnit.testDone(({ failed, name, passed, runtime, total }) => {
  log(`--- Finished test '${name}' - Total: ${total}, Failed: ${failed}, Passed: ${passed}, Runtime: ${(runtime / 1000).toFixed(1)}s ---`, { color: 'grey', fontStyle: 'italic' });
});

QUnit.done(({ total, failed, passed, runtime }) => {
  log(`Total: ${total}, Failed: ${failed}, Passed: ${passed}, Runtime: ${(runtime / 1000 / 60).toFixed(1)}m\n\n\n`, { emoji: '🏁', fontWeight: 'bold' });
});

const commonModuleHooks = {
  async before(assert) {
    if (typeof lifecycle.before === 'function') { await lifecycle.before(assert); }
  },
  async beforeEach(assert) {

    beforeEach();

    if (typeof lifecycle.beforeEach === 'function') { await lifecycle.beforeEach(assert); }

  },
  async afterEach(assert) {

    if (typeof lifecycle.afterEach === 'function') { await lifecycle.afterEach(assert); }

    afterEach();

  },
  async after(assert) {
    if (typeof lifecycle.after === 'function') { await lifecycle.after(assert); }
  }
};

const afterburner = {

  module(name, hooks) {
    QUnit.module(name, commonModuleHooks, hooks);
  },

  only(name, callback) {
    QUnit.only(name, callback);
  },

  skip(name, callback) {
    QUnit.skip(name, callback);
  },

  test(name, callback) {
    QUnit.test(name, callback);
  },

};

module.exports = afterburner;
