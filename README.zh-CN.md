# test-sub-api

[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![English](https://img.shields.io/badge/docs-English-blue)](./README.md)

交互式 API 中转站测试工具。支持 OpenAI 与 Anthropic 两种协议格式，输出结构化 JSON 结果，包含状态、模式、模型、首字耗时（ms）、总用时（ms）及响应内容，失败时附带错误信息。

## 功能

- **拉取模型列表** — 同时支持 OpenAI 和 Anthropic 格式的中转站。
- **流式对话测试** — 对中转站发起一次真实的 streaming chat 请求。
- **首字耗时统计** — 基于 OpenAI 的 `delta.content` 或 Anthropic 的 `content_block_delta.text` 计算首个可见 token 的到达时间。
- **可配置超时** — 默认 60 秒，可通过 `--timeout-ms` 覆盖。
- **stdout 仅输出 JSON** — 便于上游程序直接解析。
- **失败时退出码非 0** — 方便在脚本中做条件判断。

## 目录结构

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

## 安装

仓库已发布到 GitHub，可直接通过 `npx skills add` 安装：

```bash
npx skills add xinzine/test-sub-api-skill
```

也可以使用完整 GitHub 地址：

```bash
npx skills add https://github.com/xinzine/test-sub-api-skill
```

查看仓库中可安装的技能：

```bash
npx skills add xinzine/test-sub-api-skill --list
```

显式指定技能名：

```bash
npx skills add xinzine/test-sub-api-skill --skill test-sub-api
```

在自动化环境中加 `--yes` 跳过确认：

```bash
npx skills add xinzine/test-sub-api-skill --skill test-sub-api --yes
```

## 本地验证

在仓库根目录执行：

```bash
npx skills add . --list
```

如果输出中能看到 `test-sub-api`，说明仓库结构可被 CLI 识别。

也可用远程仓库验证：

```bash
npx skills add xinzine/test-sub-api-skill --list
```

如果远程验证失败并提示无法连接 GitHub，请先检查本机网络或代理；该错误不代表仓库结构无效。

## 脚本独立调用

以下命令均通过 `node` 直接调用，无需安装依赖。请将 `<baseUrl>`、`<apiKey>`、`<model>` 替换为中转站实际值。

### OpenAI

**拉取模型列表：**

```bash
node scripts/openai-list-models.js --base-url "<baseUrl>" --api-key "<apiKey>"
```

**流式对话测试：**

```bash
node scripts/openai-stream-chat.js --base-url "<baseUrl>" --api-key "<apiKey>" --model "<model>"
```

### Anthropic

**拉取模型列表：**

```bash
node scripts/anthropic-list-models.js --base-url "<baseUrl>" --api-key "<apiKey>"
```

**流式对话测试：**

```bash
node scripts/anthropic-stream-chat.js --base-url "<baseUrl>" --api-key "<apiKey>" --model "<model>"
```

### cc-switch

**生成 provider 导入链接：**

```bash
node scripts/cc-switch-import-url.js --app codex --name "test-sub-api-skill" --endpoint "<endpoint>" --api-key "<apiKey>" --model "<model>" --open
```

### 可选参数

| 参数 | 适用脚本 | 默认值 | 说明 |
|------|---------|--------|------|
| `--message` | 流式脚本 | `你好` | 自定义测试消息 |
| `--timeout-ms` | 流式脚本 | `60000` | 请求超时（毫秒） |
| `--max-tokens` | Anthropic 流式 | `64` | 最大生成 token 数 |
| `--anthropic-version` | Anthropic 流式 | `2023-06-01` | API 版本日期 |
| `--homepage` | cc-switch | — | 服务主页地址 |
| `--enabled` | cc-switch | `true` | 导入后是否启用 |
| `--open` | cc-switch | — | 直接打开 `ccswitch://` 深链接 |

## 输出格式

成功时 stdout 为一个 JSON 对象，包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | `string` | 执行状态 |
| `mode` | `string` | 调用模式（如 `list-models`、`stream-chat`） |
| `format` | `string` | 协议格式（`openai` 或 `anthropic`） |
| `model` | `string` | 本次请求使用的模型 ID |
| `firstTokenMs` | `number` | 从发起请求到首个可见 token 的耗时（毫秒） |
| `durationMs` | `number` | 整次请求的总耗时（毫秒） |
| `responseText` | `string` | 拼接得到的完整响应文本 |
| `importUrl` | `string` | 脱敏后的 cc-switch 深链接，仅用于展示 |
| `opened` | `boolean` | 是否已尝试打开 cc-switch 深链接 |

失败时，JSON 中额外包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `error` | `string` | 错误信息字符串，描述失败原因 |

## 运行要求

- Node.js ≥ 18
- 零依赖 — 仅使用 Node.js 内置模块（`fetch`、`AbortController`）

## 安全事项

- 不要将 `apiKey` 写入仓库或提交到任何公开位置。
- 脚本不会持久化 `apiKey`，每次调用都需要通过命令行参数显式传入。
- cc-switch 导入脚本不会输出包含真实 `apiKey` 的完整深链接。

## License

MIT
