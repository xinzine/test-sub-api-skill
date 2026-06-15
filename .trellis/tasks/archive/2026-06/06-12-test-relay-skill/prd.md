# 测试 API 中转站可用性技能

## Goal

创建一个skill，用于交互式测试 API 中转站是否可用，支持 OpenAI API 格式和 Anthropic API 格式。用户提供 `baseUrl` 和 `apiKey` 后，技能应识别或确认 API 格式，获取模型列表，让用户选择模型，并通过流式测试消息记录首字返回耗时与完整响应耗时，最终返回结构化测试结果。

## What I already know

* 用户希望创建的是一个“技能”，适合放在 `.claude/skills/<skill-name>/SKILL.md` 下。
* 当前项目已有多个 Trellis skill 示例，skill 文件使用 frontmatter：`name` + `description`，主体是 Markdown 指令。
* 当前项目 `package.json` 只有基础 npm 元数据，尚无专门测试脚本或依赖。
* 目标协议包括 OpenAI 格式和 Anthropic 格式。
* `baseUrl` 末尾包含 `/v1` 时默认判断为 OpenAI 格式，但用户仍可确认或修改。
* 测试流程需要先调用模型列表接口，再让用户选择模型，最后发送“你好”测试消息。
* 测试需要支持流式响应，并记录首字返回耗时和完整响应耗时。
* 失败时不能静默失败，需要明确错误信息。

## Assumptions (temporary)

* 该 skill 的主要产物是 `.claude/skills/test-sub-api/SKILL.md`，由 Claude 在执行技能时使用命令行工具（例如 `curl` 或脚本）完成实际 API 调用。
* 技能不会把用户的 `apiKey` 写入持久文件或日志。
* MVP 优先支持文本消息测试，不覆盖多模态、工具调用、图片、文件上传等能力。

## Open Questions

* 实际 API 调用应拆分为多个清晰脚本：OpenAI 拉模型、OpenAI 流对话、Anthropic 拉模型、Anthropic 流对话。
* 技能面向 Claude、Codex、OpenClaw 等可添加工具/技能的通用智能体，不应绑定某一个平台专属能力。
* 脚本采用命令行参数传入 `baseUrl`、`apiKey`、`model` 等参数，便于不同智能体作为工具调用。
* 所有调用脚本标准输出只输出 JSON，避免混入人类可读文本导致智能体工具解析失败。
* 调用失败时脚本仍输出结构化 JSON，并以非 0 退出码结束，符合 CLI 工具约定。
* 流式测试的“首字”按首个有效文本内容计算：OpenAI 使用 `delta.content`，Anthropic 使用 `content_block_delta.text`；不把纯 metadata SSE 事件计为首字。
* 模型列表不做筛选，返回接口提供的全部模型，避免按命名规则误判中转站能力。
* 流式测试成功时在 JSON 结果中包含 `responseText`，方便确认模型确实返回了正文。
* 所有请求默认 60 秒超时，并支持通过 `--timeout-ms` 命令行参数覆盖。

## Requirements (evolving)

* 用户提供 `baseUrl` 和 `apiKey`。
* 技能询问用户中转站使用 OpenAI API 格式还是 Anthropic API 格式。
* 如果 `baseUrl` 末尾包含 `/v1`，默认建议 OpenAI 格式，但允许用户确认或修改。
* 根据选择的格式调用模型列表接口获取可用模型。
* 将模型列表反馈给用户，并询问选择哪个模型进行测试。
* 使用选中模型发送简单测试消息：“你好”。
* 测试路径需要支持流式响应。
* 记录首字返回耗时和完整响应耗时。
* 最终输出结构化测试结果，包含：状态、模式、首字、用时、模型；失败时包含错误信息。
* 实现至少四个职责清晰的调用脚本：OpenAI 拉模型、OpenAI 流对话、Anthropic 拉模型、Anthropic 流对话。
* 四个脚本都通过命令行参数调用，方便 Claude、Codex、OpenClaw 等智能体作为外部工具集成。
* 四个脚本的 stdout 必须只输出 JSON；错误也用结构化 JSON 表达，必要的调试信息写入 `error` 字段而不是额外文本。
* 脚本 JSON 字段使用英文，例如 `status`, `mode`, `firstTokenMs`, `durationMs`, `model`, `responseText`, `error`，方便工具集成。

## Acceptance Criteria (evolving)

* [ ] Skill 可以引导用户输入或确认 `baseUrl`、`apiKey`、API 格式和测试模型。
* [ ] 对 OpenAI 格式可调用模型列表接口并解析模型 ID。
* [ ] 对 Anthropic 格式可调用模型列表接口并解析模型 ID。
* [ ] 可用用户选择的模型发送“你好”测试消息。
* [ ] 流式测试能记录首字耗时和完整耗时。
* [ ] 成功时输出结构化结果。
* [ ] 失败时输出结构化结果并包含明确错误信息。
* [ ] JSON 字段使用英文并保持稳定，至少包括 `status`, `mode`, `model`；流式测试成功时包括 `firstTokenMs`, `durationMs`, `responseText`；失败时包括 `error`。
* [ ] OpenAI 拉模型脚本可独立调用并输出可选模型列表。
* [ ] OpenAI 流对话脚本可独立调用并输出首字/完整耗时。
* [ ] Anthropic 拉模型脚本可独立调用并输出可选模型列表。
* [ ] Anthropic 流对话脚本可独立调用并输出首字/完整耗时。

## Definition of Done (team quality bar)

* Tests added/updated where practical, or at least provide manual verification steps for skill behavior.
* Lint / syntax checks pass for any added scripts.
* Docs/notes updated if behavior changes.
* Rollout/rollback considered if risky.

## Out of Scope (explicit)

* 不实现批量测速或多模型自动跑分。
* 不实现非流式测试脚本或流式/非流式对比。
* 不实现价格统计、token 统计或质量评测。
* 不实现非 OpenAI / Anthropic 协议。
* 不持久保存用户的 API key。
* 不做恶意压力测试或并发压测。

## Technical Approach

采用“交互式 skill + 四个独立入口脚本 + 一个轻量共享工具层”的设计。

* `SKILL.md` 负责用户交互：收集 `baseUrl` 和 `apiKey`，根据 `/v1` 规则给出默认格式判断，让用户确认格式，展示模型列表，让用户选择测试模型，并整理最终结构化结果。
* `scripts/openai-list-models.js` 负责调用 OpenAI 格式模型列表接口。
* `scripts/openai-stream-chat.js` 负责调用 OpenAI 格式流式对话接口，并测量首字耗时和完整耗时。
* `scripts/anthropic-list-models.js` 负责调用 Anthropic 格式模型列表接口。
* `scripts/anthropic-stream-chat.js` 负责调用 Anthropic 格式流式消息接口，并测量首字耗时和完整耗时。
* `scripts/lib/*` 只承载共享基础能力：参数校验、HTTP 错误格式化、SSE 解析、计时和结构化 JSON 输出。

## Decision (ADR-lite)

**Context**: API 中转站测试涉及两个协议和两个动作（拉模型、流式对话），如果放进单脚本会让分支逻辑混杂；如果完全复制四份实现，则 SSE 解析、计时和错误输出容易不一致。

**Decision**: 采用四个独立入口脚本表达业务动作，并允许共享轻量工具层处理通用基础能力。

**Consequences**: 目录文件数会增加，但每个入口职责清晰，可单独运行和调试；共享工具层需要保持克制，只放跨脚本一致性所需的底层逻辑。

* Inspected `D:\code\skill\test-sub-api\package.json`: current project has no dependencies and only a placeholder `test` script.
* Inspected `.claude/skills/trellis-brainstorm/SKILL.md`: skills are Markdown instruction files with YAML frontmatter.
* Existing Trellis specs under `.trellis/spec/frontend/` are placeholders and do not currently constrain this skill implementation.

## Research References

* Pending if we need to compare protocol details or CLI implementation patterns.

## Research Notes

### Feasible approaches here

**Approach A: Skill-only with `curl` snippets**

* How it works: `SKILL.md` instructs Claude to ask for inputs, run `curl` against list and stream endpoints, parse output inline, and report results.
* Pros: minimal files, no dependencies, portable in most shells.
* Cons: parsing SSE and timing first token is more fragile in shell; cross-platform quoting is harder.

**Approach B: Skill plus multiple local Node.js scripts (Recommended)**

* How it works: `SKILL.md` owns the user interaction; Node.js scripts are split by protocol and action: OpenAI 拉模型、OpenAI 流对话、Anthropic 拉模型、Anthropic 流对话. Shared parsing or HTTP utilities can be factored only if duplication becomes harmful.
* Pros: responsibilities are explicit, each script can be run and debugged independently, SSE timing/error handling stays clearer than shell.
* Cons: adds multiple script files and package scripts; slightly more project surface area.

**Approach C: Skill plus Python runner**

* How it works: similar to Node runner but implemented in Python using standard library or optional HTTP libs.
* Pros: Python is already used by Trellis scripts; good stream parsing.
* Cons: Windows Python availability varies; adding Python app logic to an npm repo may feel less consistent.
