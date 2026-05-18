# Next.js 16 — Agent 工作守则

This project uses Next.js 16 + React 19 + Turbopack + Tailwind 4. Some APIs differ from training data (e.g. middleware is now `proxy.ts`, async params, etc.). Verify before assuming.

## 查文档的正确姿势（重要）

⚠️ **禁止整目录读取 `node_modules/next/dist/docs/`**。该目录包含数百个 markdown 文件，全量读取会直接撑爆上下文导致会话卡死。

需要查 Next 16 用法时，按以下顺序：

1. **优先用 context7 MCP**：`mcp__context7__resolve-library-id` → `mcp__context7__query-docs`，按需检索，不读全文
2. **次选 grep 局部检索**：`grep -r "keyword" node_modules/next/dist/docs/ -l` 拿到候选文件名，再用 Read 只读相关段落（指定 offset/limit）
3. **最后才用 Read**：且必须指定 `limit` 不超过 200 行

## 禁止读取的文件（会爆上下文）

- `node_modules/**`（除非用 grep + 限定 limit 的 Read）
- `.next/**`
- `package-lock.json`（297KB）
- `*.tsbuildinfo`（142KB+）
- `.DS_Store`

## 编辑大文件的规则

- `lib/i18n.ts` 这类翻译/字典文件超过 300 行时，**用 Edit 局部改**，禁止 Write 整文件覆盖
- 涉及多语言文案改动，一次只改一个语言块，不要三种语言一起 Edit

## dev server 行为异常时

任何 dev server 卡死、HMR 崩、白屏先做：
1. `ls .next` 看缓存大小，必要时 `rm -rf .next` 清重启
2. `ps aux | grep next` 确认没有僵尸进程
3. dev script 已设 `--max-old-space-size=2048`，如频繁 OOM 可调到 4096
