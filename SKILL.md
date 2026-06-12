---
name: test-sub-api
description: "Interactively test the availability of an API relay (中转站) that speaks the OpenAI or Anthropic format. Use when the user wants to verify a baseUrl + apiKey, pick a model from the relay's model list, and measure first-token latency and full response time of a streaming chat. Produces a structured result with status, mode, model, firstTokenMs, durationMs, responseText, and error (only on failure)."
---

# Test Sub-API Skill

This skill drives a deterministic, interactive flow that verifies whether an API
relay station is usable. It does NOT call any LLM API on its own; it shells out
to four small Node.js scripts under `scripts/`. The host agent (Claude / Codex /
OpenClaw / etc.) must run the scripts and read their JSON output.

## Inputs to collect from the user

Ask one question at a time. Do not skip steps.

1. `baseUrl` — the relay's base URL (e.g. `https://api.example.com/v1` for
   OpenAI-style, or `https://api.example.com` for Anthropic-style).
2. `apiKey` — the API key the user wants to test.
3. `format` — either `openai` or `anthropic`. Apply the following default
   detection BEFORE asking:
   - If `baseUrl` ends with `/v1` (case-sensitive, ignoring a trailing slash),
     propose `openai` as the default.
   - Otherwise propose `anthropic` as the default.
   - Always show the proposed default and let the user confirm or override.

## Step 1: List models

Run the matching script and parse its stdout as JSON. **Do not** print the
scripts' raw JSON to the user verbatim; render a clean numbered list of model
IDs and ask the user to choose one.

- OpenAI format:
  ```bash
  node scripts/openai-list-models.js \
    --base-url "<baseUrl>" --api-key "<apiKey>"
  ```
- Anthropic format:
  ```bash
  node scripts/anthropic-list-models.js \
    --base-url "<baseUrl>" --api-key "<apiKey>"
  ```

If the script exits non-zero or its JSON has `"status": "failure"`, stop and
report the `error` field to the user verbatim. Do not silently retry.

The scripts return the relay's full model list as-is; do not filter or sort.

## Step 2: Stream-chat test

Ask the user to choose one model from the list. Then send `你好` as a streaming
chat request and measure timing.

- OpenAI format:
  ```bash
  node scripts/openai-stream-chat.js \
    --base-url "<baseUrl>" --api-key "<apiKey>" --model "<model>"
  ```
- Anthropic format:
  ```bash
  node scripts/anthropic-stream-chat.js \
    --base-url "<baseUrl>" --api-key "<apiKey>" --model "<model>"
  ```

Optional overrides accepted by both stream scripts:

- `--message "<text>"` — override the test message (default `你好`).
- `--timeout-ms <int>` — request timeout in milliseconds (default `60000`).

The Anthropic stream script also accepts `--max-tokens <int>` (default `64`) and
`--anthropic-version <date>` (default `2023-06-01`).

## Step 3: Report a structured result

Render the final result as a structured summary in 中文 using exactly these
fields (mapping shown):

| Display | JSON field      |
|---------|-----------------|
| 状态    | `status`        |
| 模式    | `mode`          |
| 模型    | `model`         |
| 首字    | `firstTokenMs`  |
| 用时    | `durationMs`    |
| 错误信息 | `error` (only when `status === "failure"`) |

Format milliseconds as seconds with one decimal (e.g. `3800` → `3.8s`).
Always include 状态, 模式, 模型. Include 首字 and 用时 only on success.
Include 错误信息 only on failure.

## Error handling rules

- Treat any non-zero exit code OR `"status": "failure"` JSON as a hard failure.
- Never invent results, never silently fall back to non-streaming, never strip
  the relay's error message.
- If the user's `baseUrl`/`apiKey`/`model` are missing or empty, ask again
  instead of running the script with empty arguments.

## Out of scope

- Batch testing multiple models.
- Non-streaming testing or stream-vs-non-stream comparison.
- Token / cost / quality evaluation.
- Persisting the user's `apiKey` to any file in the repo.
