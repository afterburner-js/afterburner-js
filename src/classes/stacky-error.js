module.exports = class StackyError extends Error {
  constructor(outerStack, ...args) {
    super(...args);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StackyError);
    }

    this.name = 'StackyError';
    this.stack += `\nOuter Stack:\n${outerStack}`;
  }
};
