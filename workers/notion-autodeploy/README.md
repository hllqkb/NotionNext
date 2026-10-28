# notion-autodeploy

更新于 2026-10-28。

Notion 里的文章改完，站点自动重新构建上线，不用再手动点 Deploy Hook。

一个 Cloudflare Worker（免费版），每 5 分钟跑一次 Cron：

1. 用 Notion 内部集成 token 查博客数据库里 `last_edited_time` 晚于上次构建的页面（按编辑时间倒序取 50 条）。
2. 跳过 `status` 是 `Draft` 的页面，草稿怎么改都不触发构建。
3. 剩下的页面里，最新一次编辑距今不到 10 分钟就先不动（防抖，边写边改不会连着发）。
4. 超过 10 分钟没有新编辑，就 POST 一次 Deploy Hook，把这次的编辑时间记进 KV，作为下次的起点。
5. 每天（按北京时间）最多触发 6 次，超出的改动留到第二天第一次检查时再发。

第一次运行只记下当前时间作起点，不会为部署前的旧改动触发构建。

## 时效和用量

**多久上线**：最后一次编辑后 10 分钟防抖，加最多 5 分钟等下一次 Cron，构建 4–7 分钟，合计约 15–22 分钟。如果队列里正好有一个 PR 预览在构建（免费版同时只跑 1 个），再多等最多 7 分钟，约 29 分钟。

**每月最多多少次构建**：每天上限 6 次，31 天最多 186 次。Pages 免费版每月 500 次，剩下 314 次给 PR 预览和合并后的生产构建。想更省就把 `MAX_BUILDS_PER_DAY` 调小。

**Worker 免费额度**：

| 项目 | 本 Worker 用量 | 免费版额度 |
| --- | --- | --- |
| Cron Triggers | 1 个 | 每账号 5 个 |
| 每次调用 | 1 次 KV 读，2 次 Notion 请求，最多 1 次 Hook | 50 个子请求 |
| 每天调用 | 288 次 | 100,000 次 |
| KV 写 | 每天最多 7 次 | 每天 1,000 次 |
| CPU | 解析一次 50 条以内的 JSON | 每次 10 ms（等待网络不算） |

## 配置项（`wrangler.toml` 的 `[vars]`）

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `NOTION_DATABASE_ID` | 博客数据库 id | Worker 每次用它查出 data source id |
| `NOTION_DATA_SOURCE_ID` | 不设 | 可选。填上能省掉每次 1 个查询请求 |
| `QUIET_MINUTES` | `10` | 防抖分钟数 |
| `MAX_BUILDS_PER_DAY` | `6` | 每天最多触发几次构建 |
| `IGNORE_STATUSES` | `Draft` | 这些状态的页面改动不触发，逗号分隔 |
| `STATUS_PROPERTY` | `status` | 状态列的属性名，select 或 status 类型都行 |

密钥只用 `wrangler secret put` 填，不写进任何文件：

- `NOTION_TOKEN`：Notion 内部集成的 Internal Integration Secret
- `DEPLOY_HOOK_URL`：Cloudflare Pages 的 Deploy Hook URL

## 一次性配置

### 1. 建 Deploy Hook

已经建过（见 `docs/publish.md`）就直接用那一个。

1. Cloudflare Dashboard → Workers & Pages → 点 `hllqkb-blog`。
2. 顶部 Settings → 左侧 Builds → 找到 Deploy hooks 区块 → Add deploy hook。
3. Hook name 填 `notion-autodeploy`，Branch to build 选 `setup/knowledge-base` → Save。
4. 页面上出现一行 Hook URL，点旁边的复制按钮。先放剪贴板，第 4 步要用，不要存进文件或发到聊天里。

### 2. 建 Notion 内部集成，拿 token

1. 打开 https://www.notion.so/profile/integrations → 右上 New integration。
2. Integration name 填 `blog-autodeploy`，Associated workspace 选博客所在的工作区，Type 选 Internal → Save。
3. 进入集成详情：Configuration 页的 Capabilities 只勾 Read content（不需要写权限、评论和用户信息）→ Save changes。
4. 同一页 Internal Integration Secret 点 Show → Copy。这就是 `NOTION_TOKEN`。

### 3. 把博客数据库分享给集成

1. 在 Notion 里打开博客数据库页面（id `aa8cdaa272b682a4904e81214563f827`）。
2. 右上角 `···` → 往下找 Connections（中文界面叫「连接」）→ 搜 `blog-autodeploy` → 点它 → Confirm。
3. 如果数据库是嵌在某个父页面里的，在父页面上做同样的操作也行，权限会继承下来。

手机 App 也能做：数据库页面右上 `···` → Connections → 添加。

### 4. 建 KV、填密钥、部署

在这个目录下执行（第一次会打开浏览器登录 Cloudflare）：

```bash
cd workers/notion-autodeploy
```

```bash
npx wrangler login
```

```bash
npx wrangler kv namespace create STATE
```

把输出里的 `id = "..."` 抄到 `wrangler.toml` 的 `[[kv_namespaces]]` 下替换 `REPLACE_WITH_KV_NAMESPACE_ID`。KV id 不是密钥，可以提交。

```bash
npx wrangler deploy
```

```bash
npx wrangler secret put NOTION_TOKEN
```

```bash
npx wrangler secret put DEPLOY_HOOK_URL
```

`secret put` 会提示粘贴值，输入不回显。也可以在后台填：Workers & Pages → `notion-autodeploy` → Settings → Variables and Secrets → Add → Type 选 Secret。

部署后到填完密钥之间，Cron 跑到的那几次会因为没有 token 报错，属于正常，填完就好。

## 验证

1. 看实时日志：

   ```bash
   npx wrangler tail notion-autodeploy
   ```

   每 5 分钟会打一行 JSON，`action` 是下面之一：

   - `init`：第一次运行，记下起点
   - `no-change`：没有新改动
   - `waiting`：有改动，但还没安静满 10 分钟
   - `capped`：今天已经发满 `MAX_BUILDS_PER_DAY` 次
   - `deployed`：已经 POST Deploy Hook

2. 查当前状态（只有时间和计数，没有密钥）：`https://notion-autodeploy.<你的子域>.workers.dev/status`

3. 验收：在 Notion 里改一篇已发布文章的一个字，放下手机。约 10–15 分钟后日志出现 `deployed`，Cloudflare Pages 的 Deployments 列表多一条 Source 为 Deploy Hook 的构建。构建 Success 后打开那篇文章，看到改动就算通过。从改完到上线应该在 30 分钟内。

## 本地模拟

不碰真实 Notion 和 Hook，用一个本地 mock 服务顶替：

```bash
npx wrangler dev --test-scheduled --var NOTION_API_BASE:http://127.0.0.1:8788 --var NOTION_TOKEN:fake --var DEPLOY_HOOK_URL:http://127.0.0.1:8788/hook
```

mock 服务需要响应 `GET /v1/databases/:id`、`POST /v1/data_sources/:id/query` 和 `POST /hook`。触发一次 Cron：

```bash
curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"
```

`__scheduled` 的 `time` 参数不会改变 `scheduledTime`，Worker 按真实当前时间判断。要模拟历史时间，直接改本地 KV 里的起点：

```bash
npx wrangler kv key put state '{"cutoff":"2026-10-28T12:00:00.000Z","day":"2026-10-28","count":0}' --binding STATE --local
```

## 已知限制

- 把文章从 `Published` 改回 `Draft`（下线）不会触发构建，因为草稿改动被忽略了。下线时手动点一次 Deploy Hook。
- 每次只看最新编辑的 50 条。一次改了 50 篇以上草稿、同时又改了发布文章，发布文章那条可能被挤出去，要等下一次发布文章的改动触发构建时才一起上线。遇到这种情况手动点一次 Deploy Hook。
- Notion 的 `last_edited_time` 精确到分钟。

## 为什么不用别的方案

- **GitHub Actions 定时任务**：`schedule` 事件在高负载时会被延迟，甚至被丢弃（[GitHub 文档](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule)），保证不了 30 分钟内。
- **Notion webhook**：`page.content_updated`、`page.properties_updated` 是聚合事件，Notion 说明一般 1 分钟内送达，最晚 5 分钟（[Event types & delivery](https://developers.notion.com/reference/webhooks-events-delivery)）。但这里本来就要等 10 分钟防抖，webhook 最多只能省下 Cron 的那 5 分钟间隔，代价是多一个公开入口、一次验证握手和一个签名密钥（`X-Notion-Signature`，HMAC-SHA256）。Notion 官方文档也没写免费版是否可用。所以先不加，以后要更快再补。
