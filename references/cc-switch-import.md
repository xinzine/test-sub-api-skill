t# cc-switch Import Reference

When the user asks to import a verified relay into cc-switch, generate a
`ccswitch://v1/import` deep link and open it directly. Do not create an HTML
page, and do not provide a page button.

## Parameters

- `resource`: Always `provider`.
- `app`: Must be either `codex` or `claude`.
- `name`: Provider name. Defaults to `test-sub-api-skill`.
- `endpoint`: The API base URL.
- `apiKey`: The user's API key. Do not commit to the repository and do not
  display the full value in replies.
- `model`: The default model.
- `homepage`: Service homepage. If not provided, infer from `endpoint`.
- `enabled`: Defaults to `true`.

## URL Rules

- When Codex uses an OpenAI-compatible API, `endpoint` typically includes `/v1`
  (e.g. `https://api.example.com/v1`).
- When Claude uses an Anthropic-compatible API, `endpoint` typically does not
  include `/v1` (e.g. `https://api.example.com`).
- All query parameters must be URL-encoded. Do not manually concatenate
  unencoded links.
- Never output a full `ccswitch://` link containing the real `apiKey`. When
  displaying the link, show only the sanitized version.

## Recommended Commands

Generate and open a Codex provider:

```bash
node scripts/cc-switch-import-url.js --app codex --name "test-sub-api-skill" --endpoint "<endpoint>" --api-key "<apiKey>" --model "<model>" --homepage "<homepage>" --open
```

Generate and open a Claude provider:

```bash
node scripts/cc-switch-import-url.js --app claude --name "test-sub-api-skill" --endpoint "<endpoint>" --api-key "<apiKey>" --model "<model>" --homepage "<homepage>" --open
```

Generate a sanitized result without opening:

```bash
node scripts/cc-switch-import-url.js --app codex --name "test-sub-api-skill" --endpoint "<endpoint>" --api-key "<apiKey>" --model "<model>"
```

## Output Requirements

- On success, read `opened`, `app`, `model`, and `importUrl` from the JSON
  output.
- `importUrl` is already sanitized; it is for display only and must not be used
  as an actual import link.
- If `--open` was passed, the final reply should state that an attempt was made
  to open the cc-switch import link.
- If opening fails, report the `error` returned by the script. Do not fabricate
  a successful import.
