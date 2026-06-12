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

    const url = `${baseUrl}/chat/completions`;
    const body = {
      model,
      stream: true,
      messages: [{ role: 'user', content: message }],
    };
    const start = process.hrtime.bigint();
    const stream = await fetchStream(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
    }, timeoutMs);

    let firstTokenMs = null;
    let responseText = '';
    for await (const evt of iterSseEvents(stream)) {
      if (evt.data === '[DONE]') break;
      let payload;
      try { payload = JSON.parse(evt.data); } catch { continue; }
      const choice = payload && payload.choices && payload.choices[0];
      const delta = choice && choice.delta;
      const piece = delta && typeof delta.content === 'string' ? delta.content : '';
      if (piece) {
        if (firstTokenMs === null) {
          firstTokenMs = Number((process.hrtime.bigint() - start) / 1000000n);
        }
        responseText += piece;
      }
    }
    const durationMs = Number((process.hrtime.bigint() - start) / 1000000n);
    if (firstTokenMs === null) {
      throw new Error('Stream ended without any text content');
    }
    emitSuccess({ mode: 'stream', format: 'openai', model, firstTokenMs, durationMs, responseText });
  } catch (err) {
    emitFailure(err, { mode: 'stream', format: 'openai', model });
  }
})();
