'use strict';

async function fetchJson(url, options, timeoutMs) {
  const res = await fetchWithTimeout(url, options, timeoutMs);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${truncate(text, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON response: ${truncate(text, 500)}`);
  }
}

async function fetchStream(url, options, timeoutMs) {
  const res = await fetchWithTimeout(url, options, timeoutMs);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${truncate(text, 500)}`);
  }
  if (!res.body) {
    throw new Error('Response has no body to stream');
  }
  return res.body;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '...' : s;
}

module.exports = { fetchJson, fetchStream };
