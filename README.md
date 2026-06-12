# test-sub-api

交互式测试 API 中转站（OpenAI 格式或 Anthropic 格式）是否可用，输出结构化结果（状态 / 模式 / 模型 / 首字 ms / 总用时 ms / 响应内容；失败时附错误信息）。

## 功能

- 拉模型列表：支持 OpenAI 与 Anthropic 两种格式的中转站。
- 流式对话测试：对中转站发起一次真实的 streaming chat 请求。
- 首字耗时统计：基于 OpenAI 的 `delta.content` 或 Anthropic 的 `content_block_delta.text` 计算首个可见 token 的到达时间。
- 默认 60 秒超时，可通过 `--timeout-ms` 覆盖。
- stdout 仅输出 JSON，便于上游程序直接解析。
- 失败时退出码非 0，便于在脚本中判定。

## 目录结构

```text
SKILL.md
README.md
scripts/
  openai-list-models.js
  openai-stream-chat.js
  anthropic-list-models.js
  anthropic-stream-chat.js
  lib/
    cli.js
    http.js
    sse.js
    result.js
```

## 安装

发布到 GitHub 后，将 `<owner>/<repo>` 替换为真实仓库名：

```bash
npx skills add <owner>/<repo>
```

也可以显式指定技能名：

```bash
npx skills add <owner>/<repo> --skill test-sub-api
```

## 本地验证

在仓库根目录执行：

```bash
npx skills add . --list
```

如果输出里能看到 `test-sub-api`，说明仓库结构可被 CLI 识别。

## 脚本独立调用

以下命令均直接通过 `node` 调用，无需安装依赖。请将 `<baseUrl>`、`<apiKey>`、`<model>` 替换成中转站实际值。

OpenAI 格式 - 拉模型列表：

```bash
node scripts/openai-list-models.js --base-url "<baseUrl>" --api-key "<apiKey>"
```

OpenAI 格式 - 流式对话测试：

```bash
node scripts/openai-stream-chat.js --base-url "<baseUrl>" --api-key "<apiKey>" --model "<model>"
```

Anthropic 格式 - 拉模型列表：

```bash
node scripts/anthropic-list-models.js --base-url "<baseUrl>" --api-key "<apiKey>"
```

Anthropic 格式 - 流式对话测试：

```bash
node scripts/anthropic-stream-chat.js --base-url "<baseUrl>" --api-key "<apiKey>" --model "<model>"
```

可选参数：

- `--message`：自定义测试用的用户输入文本。
- `--timeout-ms`：覆盖默认的 60000 ms 超时。
- Anthropic 流式对话脚本还额外支持 `--max-tokens` 与 `--anthropic-version`。

## 输出格式

成功时 stdout 是一个 JSON 对象，包含以下字段：

- `status`：执行状态。
- `mode`：调用模式（如 `list-models` 或 `stream-chat`）。
- `format`：协议格式（`openai` 或 `anthropic`）。
- `model`：本次请求使用的模型名。
- `firstTokenMs`：从发起请求到首个可见 token 到达的耗时（毫秒）。
- `durationMs`：整次请求的总耗时（毫秒）。
- `responseText`：拼接得到的完整响应文本。

失败时，JSON 中额外包含：

- `error`：错误信息字符串，描述失败原因。

## 运行要求

- Node.js ≥ 18。
- 脚本依赖全局 `fetch` 与 `AbortController`，仅使用 Node 内置模块，无第三方依赖。

## 注意

- 不要把 `apiKey` 写入仓库或提交到任何公开位置。
- 脚本不会持久化 `apiKey`，每次调用都需要通过命令行参数显式传入。
