---
name: test-sub-api
description: "Interactively test the availability of an API relay that speaks the OpenAI or Anthropic format, or generate/open a cc-switch provider import link. Use when the user wants to verify a baseUrl + apiKey, pick a model from the relay's model list, measure first-token latency and total response time of a streaming chat, or import the tested provider into cc-switch. Produces a structured result with status, mode, model, firstTokenMs, durationMs, responseText, and error (only on failure)."
---

# Test Sub-API Skill

This skill drives a deterministic, interactive flow that verifies whether an API
relay is usable. It does **not** call any LLM API on its own; it shells out to
Node.js scripts under `scripts/`. The host agent (Claude / Codex / OpenClaw / etc.)
must run the scripts and read their JSON output.

## cc-switch Import

When the user asks to import the relay into cc-switch, read
`references/cc-switch-import.md`. Prefer using
`scripts/cc-switch-import-url.js` to generate a `ccswitch://` deep link, and
pass `--open` to open it directly when the user requests import. Never display
the full deep link containing the real `apiKey` to the user.

## Inputs to Collect from the User

Ask one question at a time. Do not skip steps.

1. `baseUrl` — the relay's base URL (e.g. `https://api.example.com/v1` for
   OpenAI-style, or `https://api.example.com` for Anthropic-style).
2. `apiKey` — the API key the user wants to test.
3. `format` — either `openai` or `anthropic`. Apply the following default
   detection **before** asking:
   - If `baseUrl` ends with `/v1` (case-sensitive, ignoring a trailing slash),
     propose `openai` as the default.
   - Otherwise propose `anthropic` as the default.
   - Always show the proposed default and let the user confirm or override.
   - If the user chooses `openai` while `baseUrl` does not end with `/v1`,
     accept the choice and try the provided URL first. Do not add `/v1`
     automatically before the first request.
4. `model` — optional. If the user already provided a model ID, remember it
   and validate it after listing models instead of asking again immediately.

## Step 1: List Models

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

If the user already provided a model ID, compare it against the returned model
IDs after listing:

- If it exists, continue directly to the stream-chat test.
- If it does not exist, show the numbered model list and ask the user to choose.

If the script exits non-zero or its JSON contains `"status": "failure"`, pause
the flow and report a concise, readable error. Preserve the important parts of
the `error` field such as HTTP status, provider message, request ID, and
validation details, but do not paste long HTML or noisy bodies in full. For an
`Invalid JSON response` or an error body containing `<!doctype html>` / `<html`,
explain that the endpoint returned HTML or non-JSON. When this happens in
OpenAI mode and the original `baseUrl` does not end with `/v1`, explicitly
suggest that the API base URL may need `/v1` and ask whether to retry with that
adjusted URL. Do not retry automatically.

The scripts return the relay's full model list as-is; do not filter or sort.

## Step 2: Stream-Chat Test

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

- `--message "<text>"` — override the test message (default: `你好`).
- `--timeout-ms <int>` — request timeout in milliseconds (default: `60000`).

The Anthropic stream script also accepts `--max-tokens <int>` (default: `64`)
and `--anthropic-version <date>` (default: `2023-06-01`).

## Step 3: Report a Structured Result

Render the final result as a structured summary using exactly these fields:

| Display       | JSON field      | Condition                                        |
|---------------|-----------------|--------------------------------------------------|
| Status        | `status`        | Always                                           |
| Mode          | `mode`          | Always                                           |
| Model         | `model`         | Always                                           |
| First Token   | `firstTokenMs`  | Only on success                                  |
| Duration      | `durationMs`    | Only on success                                  |
| Response      | `responseText`  | Only when `status === "success"` and non-empty   |
| Error         | `error`         | Only when `status === "failure"`                 |

Format milliseconds as seconds with one decimal (e.g. `3800` → `3.8s`).

## Error Handling Rules

- Treat any non-zero exit code **or** `"status": "failure"` JSON as a hard failure.
- Never invent results, never silently fall back to non-streaming, never strip
  the relay's meaningful error details.
- Keep errors readable: summarize long or HTML responses, include a short
  excerpt when useful, and clearly state when the response was truncated.
- If the user's `baseUrl`/`apiKey`/`model` are missing or empty, ask again
  instead of running the script with empty arguments.

## Out of Scope

- Batch testing multiple models.
- Non-streaming testing or stream-vs-non-stream comparison.
- Token / cost / quality evaluation.
- Persisting the user's `apiKey` to any file in the repository.
