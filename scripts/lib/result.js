'use strict';

function emitSuccess(payload) {
  process.stdout.write(JSON.stringify({ status: 'success', ...payload }) + '\n');
  process.exit(0);
}

function emitFailure(error, extra) {
  const payload = {
    status: 'failure',
    error: error instanceof Error ? error.message : String(error),
    ...(extra || {}),
  };
  process.stdout.write(JSON.stringify(payload) + '\n');
  process.exit(1);
}

module.exports = { emitSuccess, emitFailure };
