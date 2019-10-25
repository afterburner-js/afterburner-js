const afterburner = require('@afterburner/test');
const {
  executeCommand
} = require(`@afterburner/test-helpers`);

afterburner.module('Acceptance | Shelly', () => {

  afterburner.test('shell command', async assert => {

    const { stdout } = await executeCommand('date -u');
    assert.ok(stdout.includes('UTC'), 'date command succeeds');

    const { exitCode, stderr } = await executeCommand('thisCommandDoesNotExist');
    assert.equal(exitCode, 127, 'exit code is correct for bad command');
    assert.ok(stderr.includes('command not found'), 'stderr message is correct for bad command');

  });

});

