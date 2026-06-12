'use strict';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected positional argument: ${token}`);
    }
    const eq = token.indexOf('=');
    let key;
    let value;
    if (eq !== -1) {
      key = token.slice(2, eq);
      value = token.slice(eq + 1);
    } else {
      key = token.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        value = 'true';
      } else {
        value = next;
        i++;
      }
    }
    args[camelize(key)] = value;
  }
  return args;
}

function camelize(key) {
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function requireString(args, name) {
  const value = args[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required argument: --${dasherize(name)}`);
  }
  return value;
}

function optionalInt(args, name, defaultValue) {
  const raw = args[name];
  if (raw === undefined) return defaultValue;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid integer for --${dasherize(name)}: ${raw}`);
  }
  return n;
}

function dasherize(key) {
  return key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
}

function trimTrailingSlash(s) {
  return s.replace(/\/+$/, '');
}

module.exports = { parseArgs, requireString, optionalInt, trimTrailingSlash };
