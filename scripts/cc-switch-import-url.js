/**
 * @Author: 橘子
 * @Project_description: xxxxx
 * @Description: 代码是我抄的，不会也是真的
 */
'use strict';

const { spawnSync } = require('node:child_process');
const { parseArgs, requireString, trimTrailingSlash } = require('./lib/cli');
const { emitSuccess, emitFailure } = require('./lib/result');

/**
 * 生成 cc-switch provider 导入链接。
 * @param {{app:string,name:string,endpoint:string,apiKey:string,model:string,homepage:string,enabled:string}} input 导入参数。
 * @returns {string} 可直接打开的 cc-switch 深链接。
 */
function buildImportUrl(input) {
  const params = new URLSearchParams({
    resource: 'provider',
    app: input.app,
    name: input.name,
    endpoint: input.endpoint,
    apiKey: input.apiKey,
    model: input.model,
    homepage: input.homepage,
    enabled: input.enabled,
  });
  return `ccswitch://v1/import?${params.toString()}`;
}

/**
 * 校验并标准化 app 参数。
 * @param {string} app 用户传入的 app。
 * @returns {string} 标准化后的 app。
 */
function normalizeApp(app) {
  const normalized = app.toLowerCase();
  if (normalized !== 'codex' && normalized !== 'claude') {
    throw new Error(`Invalid app: ${app}. Expected codex or claude`);
  }
  return normalized;
}

/**
 * 校验并标准化 enabled 参数。
 * @param {string|undefined} value 用户传入的 enabled。
 * @returns {string} 标准化后的 enabled。
 */
function normalizeEnabled(value) {
  if (value === undefined) return 'true';
  if (value !== 'true' && value !== 'false') {
    throw new Error(`Invalid enabled: ${value}. Expected true or false`);
  }
  return value;
}

/**
 * 校验 HTTP 地址并去掉末尾斜杠。
 * @param {string} value 用户传入的地址。
 * @param {string} name 参数名。
 * @returns {string} 标准化后的地址。
 */
function normalizeHttpUrl(value, name) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid URL for --${name}: ${value}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Invalid protocol for --${name}: ${parsed.protocol}`);
  }
  return trimTrailingSlash(value);
}

/**
 * 从 endpoint 推断 homepage。
 * @param {string} endpoint API 地址。
 * @returns {string} 推断出的 homepage。
 */
function inferHomepage(endpoint) {
  const parsed = new URL(endpoint);
  parsed.search = '';
  parsed.hash = '';
  parsed.pathname = '';
  return trimTrailingSlash(parsed.toString());
}

/**
 * 对导入链接中的密钥做脱敏。
 * @param {string} importUrl 原始导入链接。
 * @returns {string} 脱敏后的导入链接。
 */
function redactImportUrl(importUrl) {
  return importUrl.replace(/([?&]apiKey=)[^&]*/u, '$1<redacted>');
}

/**
 * 打开 cc-switch 导入链接。
 * @param {string} importUrl 原始导入链接。
 * @returns {void}
 */
function openImportUrl(importUrl) {
  let command;
  let args;
  if (process.platform === 'win32') {
    command = 'powershell.exe';
    // 修复：使用单引号包裹 URL，避免 & 符号被解析为命令操作符
    const escapedUrl = importUrl.replace(/'/g, "''");
    args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `Start-Process '${escapedUrl}'`];
  } else if (process.platform === 'darwin') {
    command = 'open';
    args = [importUrl];
  } else {
    command = 'xdg-open';
    args = [importUrl];
  }

  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || '').trim() || `exit code ${result.status}`;
    throw new Error(`Failed to open cc-switch import link: ${message}`);
  }
}

/**
 * 解析命令行参数并输出结构化结果。
 * @returns {void}
 */
function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const app = normalizeApp(requireString(args, 'app'));
    const name = requireString(args, 'name');
    const endpoint = normalizeHttpUrl(requireString(args, 'endpoint'), 'endpoint');
    const apiKey = requireString(args, 'apiKey');
    const model = requireString(args, 'model');
    const homepage = args.homepage === undefined
      ? inferHomepage(endpoint)
      : normalizeHttpUrl(requireString(args, 'homepage'), 'homepage');
    const enabled = normalizeEnabled(args.enabled);
    const shouldOpen = args.open === 'true';
    const importUrl = buildImportUrl({ app, name, endpoint, apiKey, model, homepage, enabled });

    if (shouldOpen) {
      openImportUrl(importUrl);
    }

    emitSuccess({
      mode: 'cc-switch-import',
      app,
      name,
      endpoint,
      model,
      homepage,
      enabled,
      opened: shouldOpen,
      importUrl: redactImportUrl(importUrl),
    });
  } catch (err) {
    emitFailure(err, { mode: 'cc-switch-import' });
  }
}

main();
