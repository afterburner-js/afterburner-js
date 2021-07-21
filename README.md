# Afterburner.js

Afterburner is a meta-framework for testing web applications, web services, systems, and for end-to-end testing.

## Benefits

- Zero-configuration needed: just install it and start writing tests immediately against any endpoint.
- Test helper methods out-of-the-box: you have everything you need to write your entire test suite.
- Built-in proxy: no CORS or cross-domain headaches to get in the way of your testing.
- Built-in command-line endpoint: execute system commands from your test.
- Familiar test experience using [QUnit](https://qunitjs.com).

## Getting Started

[Node.js](https://nodejs.org) is a prerequisite, as this is a Node application.

1. Install Afterburner.
`npm i -g @afterburner-js/afterburner-js`
1. Generate a new Afterburner test application.
`afterburner new <appName>`
1. Navigate into the newly created folder.
`cd <appName>`
1. Run Afterburner, specifying the hostname or IP address of your web application.
`afterburner test host=<host>`
1. Open `tests/acceptance/hello-world.js` and start writing your tests!

## Development Mode vs Continuous Integration Mode

In the section above, we ran Afterburner in development mode, where a local server is started along with file watching so that your tests are automatically reloaded and run again every time you save changes to your test files.

To run the test suite in a headless browser for CI, run `afterburner test host=<host> ci=true`.

## Configuration

See `afterburner-config.js`, `afterburner-helper-hooks.js`, and `afterburner-lifecycle.js`.

## Security Considerations

You should only ever run this application against a host you fully trust because of the proxy and the ability to execute system commands. However, this behavior can be disabled or modified. See `middleware/proxy.js` and `middleware/shelly.js`.

## Background / Inspiration

Afterburner was developed at [IBM Cloud Object Storage](https://www.ibm.com/cloud/object-storage) to fill a test gap between applications and to optimize the feedback loop during test writing. The first-class test harness included with [Ember.js](https://emberjs.com) is fantastic, and years ago when we first started using it, due to the complexities of our systems, we hit a wall with testing where we needed to have a test that spanned the Ember application and other applications, services, etc. That turned into a proof-of-concept to see if we could create something similar that would meet our needs and Afterburner was born. Because the Ember test harness was so well done, and to minimize the burden of context-switching, we use much of the same tooling and workflow under the hood, and our test helpers are closely aligned with Ember's.

## License

[MIT](LICENSE)
