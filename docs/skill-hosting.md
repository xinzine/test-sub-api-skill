# Agent Skill 托管与发布方案

## 结论

当前项目如果只发布一个 Agent Skill，推荐使用**单技能仓库结构**：

```text
test-sub-api/
├── SKILL.md
├── README.md
├── .gitignore
├── scripts/        # 可选
├── references/     # 可选
└── assets/         # 可选
```

不需要再创建 `public-skills-repo/`，也不需要创建 `skills/example-skill/`。

## `npx skills add` 是什么

`npx skills add <source>` 会临时运行 npm 上的 `skills` CLI，从指定来源读取 Agent Skill 并安装。

它不是把技能当作 npm 包发布，也不是读取 `package.json`。

常见安装方式：

```bash
npx skills add <owner>/<repo>
npx skills add https://github.com/<owner>/<repo>
npx skills add .
```

如果仓库里有多个技能，可以指定技能名：

```bash
npx skills add <owner>/<repo> --skill <skill-name>
```

只查看可安装技能：

```bash
npx skills add <owner>/<repo> --list
```

## CLI 的技能发现规则

`skills` CLI 会查找 `SKILL.md`。常见可识别位置包括：

- 仓库根目录的 `SKILL.md`
- `skills/<skill-name>/SKILL.md`
- `skills/.curated/<skill-name>/SKILL.md`
- `skills/.experimental/<skill-name>/SKILL.md`
- `.agents/skills/<skill-name>/SKILL.md`
- `.claude/skills/<skill-name>/SKILL.md`

根目录存在 `SKILL.md` 时，默认会把根目录识别为一个单技能仓库，不会继续深搜更深层技能。只有使用 `--full-depth` 时才会继续深搜。

## 两种常见仓库结构

### 单技能仓库

适合一个仓库只发布一个技能。

```text
repo/
├── SKILL.md
├── README.md
├── scripts/
├── references/
└── assets/
```

安装方式：

```bash
npx skills add <owner>/<repo>
```

当前项目应采用这种结构。

### 多技能集合仓库

适合一个仓库发布多个技能，例如官方或团队技能合集。

```text
repo/
├── README.md
└── skills/
    ├── skill-a/
    │   └── SKILL.md
    └── skill-b/
        └── SKILL.md
```

安装全部技能：

```bash
npx skills add <owner>/<repo>
```

只安装某个技能：

```bash
npx skills add <owner>/<repo> --skill skill-a
```

## 当前项目建议

当前项目是一个单技能仓库，推荐保留：

```text
SKILL.md
README.md
.gitignore
scripts/
references/
assets/
docs/
```

不建议公开提交：

```text
.agents/
.claude/
.codex/
.idea/
.trellis/
package.json
```

原因：

- `.agents/`、`.claude/`、`.codex/`、`.trellis/` 是本地工具和项目管理配置，不是公开 skill 的必需内容。
- `.idea/` 是 IDE 配置。
- `package.json` 当前只是默认 npm 初始化产物，对 `npx skills add` 没有作用，还会让别人误以为这是 npm 项目。

## `package.json` 是否需要

当前不需要。

Agent Skill 的核心入口是 `SKILL.md`。只有在以下情况才建议保留 `package.json`：

- 技能包含 Node.js 脚本，并需要固定 npm 依赖。
- 仓库需要 npm 脚本做校验、测试或构建。
- 你明确要把它同时作为 npm 包发布。

如果只是公开一个可安装 Skill，删除 `package.json` 更清晰。

## 发布步骤

1. 修改根目录 `SKILL.md`，写入真实技能名、描述和流程。
2. 删除或忽略不需要公开的本地目录。
3. 本地验证：

```bash
npx skills add . --list
```

4. 校验 `SKILL.md`：

```bash
python C:\Users\27260\.codex\skills\.system\skill-creator\scripts\quick_validate.py .
```

5. 初始化 Git 仓库并推送到 GitHub：

```bash
git init
git add .
git commit -m "init skill"
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

6. 安装验证：

```bash
npx skills add <owner>/<repo> --list
```

## 已确认来源

- Vercel `skills` CLI：`https://github.com/vercel-labs/skills`
- Vercel Agent Skills 示例：`https://github.com/vercel-labs/agent-skills`
- Anthropic Skills 示例：`https://github.com/anthropics/skills`
- OpenAI Skills 示例：`https://github.com/openai/skills`
