'use strict';

async function* iterSseEvents(body) {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = findEventBoundary(buffer)) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + boundaryLength(buffer, idx));
      const event = parseEvent(raw);
      if (event) yield event;
    }
  }
  if (buffer.trim().length > 0) {
    const event = parseEvent(buffer);
    if (event) yield event;
  }
}

function findEventBoundary(buf) {
  const a = buf.indexOf('\n\n');
  const b = buf.indexOf('\r\n\r\n');
  if (a === -1) return b;
  if (b === -1) return a;
  return Math.min(a, b);
}

function boundaryLength(buf, idx) {
  return buf.startsWith('\r\n\r\n', idx) ? 4 : 2;
}

function parseEvent(raw) {
  const lines = raw.split(/\r?\n/);
  let event = null;
  const dataLines = [];
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'data') dataLines.push(value);
    else if (field === 'event') event = value;
  }
  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}

module.exports = { iterSseEvents };
