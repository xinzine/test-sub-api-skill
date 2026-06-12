#!/usr/bin/env node
'use strict';

const { parseArgs, requireString, optionalInt, trimTrailingSlash } = require('./lib/cli');
const { fetchJson } = require('./lib/http');
const { emitSuccess, emitFailure } = require('./lib/result');

(async () => {
  try {
    const args = parseArgs(process.argv.slice(2));
    const baseUrl = trimTrailingSlash(requireString(args, 'baseUrl'));
    const apiKey = requireString(args, 'apiKey');
    const timeoutMs = optionalInt(args, 'timeoutMs', 60000);
    const apiVersion = args.anthropicVersion || '2023-06-01';
    const url = `${baseUrl}/v1/models`;
    const data = await fetchJson(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': apiVersion,
        'Accept': 'application/json',
      },
    }, timeoutMs);
    const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : null;
    if (!list) {
      throw new Error('Unexpected models response shape: missing data array');
    }
    const models = list
      .map((m) => (typeof m === 'string' ? m : m && m.id))
      .filter((id) => typeof id === 'string' && id.length > 0);
    emitSuccess({ mode: 'list', format: 'anthropic', count: models.length, models });
  } catch (err) {
    emitFailure(err, { mode: 'list', format: 'anthropic' });
  }
})();
