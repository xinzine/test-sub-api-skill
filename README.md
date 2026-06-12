# test-sub-api

[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![中文文档](https://img.shields.io/badge/docs-中文文档-blue)](./README.zh-CN.md)

An interactive CLI tool for testing the availability of API relays (OpenAI or Anthropic format). Produces structured JSON output including status, mode, model, first-token latency (ms), total duration (ms), and response text. On failure, an error message is included.

## Features

- **List models** — Supports both OpenAI and Anthropic API relay formats.
- **Streaming chat test** — Sends a single streaming chat request to the relay.
- **First-token latency** — Measures time to the first visible token via OpenAI's `delta.content` or Anthropic's `content_block_delta.text`.
- **Configurable timeout** — Default 60 seconds, overridable via `--timeout-ms`.
- **JSON-only stdout** — Designed for programmatic consumption by upstream tools.
- **Non-zero exit on failure** — Easy to check in shell scripts.

## Directory Structure

```text
SKILL.md
README.md
README.zh-CN.md
scripts/
  openai-list-models.js
  openai-stream-chat.js
  anthropic-list-models.js
  anthropic-stream-chat.js
  cc-switch-import-url.js
  lib/
    cli.js
    http.js
    sse.js
    result.js
references/
  cc-switch-import.md
```

## Installation

The repository is published on GitHub and can be installed via `npx skills add`:

```bash
npx skills add xinzine/test-sub-api-skill
```

Or use the full GitHub URL:

```bash
npx skills add https://github.com/xinzine/test-sub-api-skill
```

To list installable skills in the repository:

```bash
npx skills add xinzine/test-sub-api-skill --list
```

To explicitly specify the skill name:

```bash
npx skills add xinzine/test-sub-api-skill --skill test-sub-api
```

In automated environments, add `--yes` to skip confirmation:

```bash
npx skills add xinzine/test-sub-api-skill --skill test-sub-api --yes
```

## Local Verification

Run from the repository root:

```bash
npx skills add . --list
```

If `test-sub-api` appears in the output, the repository structure is recognized by the CLI.

You can also verify against the remote repository:

```bash
npx skills add xinzine/test-sub-api-skill --list
```

If remote verification fails with a GitHub connection error, check your network
or proxy first; the error does not mean the repository structure is invalid.

## Standalone Script Usage

All commands are invoked directly with `node` — no dependency installation required.
Replace `<baseUrl>`, `<apiKey>`, and `<model>` with your actual relay values.

### OpenAI

**List models:**

```bash
node scripts/openai-list-models.js --base-url "<baseUrl>" --api-key "<apiKey>"
```

**Streaming chat test:**

```bash
node scripts/openai-stream-chat.js --base-url "<baseUrl>" --api-key "<apiKey>" --model "<model>"
```

### Anthropic

**List models:**

```bash
node scripts/anthropic-list-models.js --base-url "<baseUrl>" --api-key "<apiKey>"
```

**Streaming chat test:**

```bash
node scripts/anthropic-stream-chat.js --base-url "<baseUrl>" --api-key "<apiKey>" --model "<model>"
```

### cc-switch

**Generate provider import link:**

```bash
node scripts/cc-switch-import-url.js --app codex --name "test-sub-api-skill" --endpoint "<endpoint>" --api-key "<apiKey>" --model "<model>" --open
```

### Optional Parameters

| Parameter | Applies to | Default | Description |
|-----------|-----------|---------|-------------|
| `--message` | stream scripts | `你好` | Custom test message |
| `--timeout-ms` | stream scripts | `60000` | Request timeout in ms |
| `--max-tokens` | Anthropic stream | `64` | Max tokens to generate |
| `--anthropic-version` | Anthropic stream | `2023-06-01` | API version date |
| `--homepage` | cc-switch | — | Provider homepage URL |
| `--enabled` | cc-switch | `true` | Enable provider after import |
| `--open` | cc-switch | — | Open the `ccswitch://` deep link |

## Output Format

On success, stdout is a JSON object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Execution status |
| `mode` | `string` | Call mode (e.g. `list-models`, `stream-chat`) |
| `format` | `string` | Protocol format (`openai` or `anthropic`) |
| `model` | `string` | The model ID used in the request |
| `firstTokenMs` | `number` | Time to first visible token (ms) |
| `durationMs` | `number` | Total request duration (ms) |
| `responseText` | `string` | Complete concatenated response text |
| `importUrl` | `string` | Sanitized cc-switch deep link (display only) |
| `opened` | `boolean` | Whether the cc-switch deep link was opened |

On failure, the JSON additionally includes:

| Field | Type | Description |
|-------|------|-------------|
| `error` | `string` | Error message describing the cause |

## Requirements

- Node.js ≥ 18
- Zero dependencies — uses only Node.js built-in modules (`fetch`, `AbortController`)

## Security

- Never commit `apiKey` to the repository or any public location.
- Scripts never persist `apiKey`; it must be passed explicitly via CLI argument on every invocation.
- The cc-switch import script never outputs a full deep link containing the real `apiKey`.

## License

MIT
