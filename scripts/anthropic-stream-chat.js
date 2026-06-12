#!/usr/bin/env node
'use strict';

const { parseArgs, requireString, optionalInt, trimTrailingSlash } = require('./lib/cli');
const { fetchStream } = require('./lib/http');
const { iterSseEvents } = require('./lib/sse');
const { emitSuccess, emitFailure } = require('./lib/result');

(async () => {
  let model;
  try {
    const args = parseArgs(process.argv.slice(2));
    const baseUrl = trimTrailingSlash(requireString(args, 'baseUrl'));
    const apiKey = requireString(args, 'apiKey');
    model = requireString(args, 'model');
    const message = args.message || '你好';
    const timeoutMs = optionalInt(args, 'timeoutMs', 60000);
    const maxTokens = optionalInt(args, 'maxTokens', 64);
    const apiVersion = args.anthropicVersion || '2023-06-01';

    const url = `${baseUrl}/v1/messages`;
    const body = {
      model,
      stream: true,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: message }],
    };
    const start = process.hrtime.bigint();
    const stream = await fetchStream(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': apiVersion,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
    }, timeoutMs);

    let firstTokenMs = null;
    let responseText = '';
    for await (const evt of iterSseEvents(stream)) {
      let payload;
      try { payload = JSON.parse(evt.data); } catch { continue; }
      if (payload && payload.type === 'content_block_delta') {
        const piece = payload.delta && typeof payload.delta.text === 'string' ? payload.delta.text : '';
        if (piece) {
          if (firstTokenMs === null) {
            firstTokenMs = Number((process.hrtime.bigint() - start) / 1000000n);
          }
          responseText += piece;
        }
      } else if (payload && payload.type === 'error') {
        const msg = payload.error && payload.error.message ? payload.error.message : 'Anthropic stream error';
        throw new Error(msg);
      } else if (payload && payload.type === 'message_stop') {
        break;
      }
    }
    const durationMs = Number((process.hrtime.bigint() - start) / 1000000n);
    if (firstTokenMs === null) {
      throw new Error('Stream ended without any text content');
    }
    emitSuccess({ mode: 'stream', format: 'anthropic', model, firstTokenMs, durationMs, responseText });
  } catch (err) {
    emitFailure(err, { mode: 'stream', format: 'anthropic', model });
  }
})();
