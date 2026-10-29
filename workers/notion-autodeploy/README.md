# notion-autodeploy

更新于 2026-10-29。

Notion 里的文章改完、下线、删除，或者定时文章到了发布时间，站点都会自动重新构建上线，不用再手动点 Deploy Hook。

一个 Cloudflare Worker（免费版），每 5 分钟跑一次 Cron。KV 里存着上次成功构建时线上有哪些页面（`status` 是 `Published` 或 `Invisible` 的页面 id 和发布时间，和构建的规则一致）。每次检查以下三种情况，任一成立就 POST 一次 Deploy Hook：

1. **改动**：上次构建之后编辑过的页面里，有线上状态的页面，或者上次构建时还在线、现在改成了别的状态（`Published` 改 `Draft` 这种撤稿）。最后一次编辑距今不到 10 分钟就先等（防抖，边写边改不会连着发）。从没发布过的草稿怎么改都不触发。
2. **定时文章到点**：上次构建时 `date` 还在未来、所以被构建过滤掉的文章（见 `lib/db/SiteDataApi.js` 的 `isScheduledInFuture`），现在时间到了。不用等编辑，到点后的第一次检查就发。
3. **删除**：页面进了回收站，Notion 查询就查不到它了，也不会有编辑记录。所以每小时整点那次检查会全量列一遍线上页面，和上次构建对比，少了就发。

POST 之后不马上算数，而是等站点真的构建完：

- 每次检查读一次 `SITE_URL/rss/feed.xml` 的 `<lastBuildDate>`。这个时间是构建时写进去的，晚于 POST 时间就说明新构建已经上线，这时才把起点和线上页面快照推进。
- 60 分钟内没等到（构建失败、被取消、一直在排队），就再 POST 一次，同一批改动重试。
- 等待期间的新改动先不处理，确认之后再算。

每天（按北京时间）最多触发 6 次，重试也算在内。超出的部分留到第二天再发。

第一次运行只记下当前状态，不会为部署前的旧改动触发构建。从旧版本升级时，原来的起点保留。

### 为什么用 RSS 确认构建，不查 Cloudflare API

Pages 的部署列表接口需要一个带 `Pages Read` 权限的 API Token（[List deployments](https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/list/)），Deploy Hook URL 不能拿来查结果。为了确认构建再让用户多建、多保管一个账号级 token 不划算。RSS 是每次构建都会重新生成的公开文件，读它不需要任何凭证。

代价：确认的是「有一次生产构建在 POST 之后完成了」，不一定就是这次 Hook 触发的那一次。比如同时合并了一个 PR，它的构建先完成，也会被当成成功。那次构建读 Notion 的时间至多比 POST 早一次构建的时长（4–7 分钟），而触发前已经等了 10 分钟防抖，所以编辑类改动一定已经包含进去了。删除和到点这两种不等防抖，在这个窗口里有极小概率漏掉，漏掉的话下一次检查还会再发现。

## 时效和用量

**多久上线**：最后一次编辑后 10 分钟防抖，加最多 5 分钟等下一次 Cron，构建 4–7 分钟，合计约 15–22 分钟。如果队列里正好有一个 PR 预览在构建（免费版同时只跑 1 个），再多等最多 7 分钟，约 29 分钟。

**定时文章**：到点后最多 5 分钟开始构建，加构建时间，约 10–15 分钟上线。

**删除**：最多等到下一个整点，再加构建时间。

**每月最多多少次构建**：每天上限 6 次（含重试），31 天最多 186 次。Pages 免费版每月 500 次，剩下 314 次给 PR 预览和合并后的生产构建。想更省就把 `MAX_BUILDS_PER_DAY` 调小。

**Worker 免费额度**：

| 项目 | 本 Worker 用量 | 免费版额度 |
| --- | --- | --- |
| Cron Triggers | 1 个 | 每账号 5 个 |
| 每次调用 | 1 次 KV 读，1–2 次 Notion 请求，构建期间 1 次读 RSS；整点和触发构建时多一轮全量列表（每 100 页 1 次请求） | 50 个子请求 |
| 每天调用 | 288 次 | 100,000 次 |
| KV 写 | 每次触发、确认、重试各 1 次，每天最多约 13 次 | 每天 1,000 次 |
| CPU | 查询只取 `status`、`date` 两列，JSON 很小 | 每次 10 ms（等待网络不算） |

全量列表只在整点和要触发构建时跑，平时每 5 分钟只查上次构建之后编辑过的页面。

## 配置项（`wrangler.toml` 的 `[vars]`）

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `NOTION_DATABASE_ID` | 博客数据库 id | Worker 每次用它查出 data source id |
| `NOTION_DATA_SOURCE_ID` | 不设 | 可选。填上能省掉每次 1 个查询请求 |
| `QUIET_MINUTES` | `10` | 防抖分钟数 |
| `MAX_BUILDS_PER_DAY` | `6` | 每天最多触发几次构建 |
| `LIVE_STATUSES` | `Published,Invisible` | 这些状态的页面会上站，逗号分隔，和构建规则保持一致 |
| `STATUS_PROPERTY` | `status` | 状态列的属性名，select 或 status 类型都行 |
| `DATE_PROPERTY` | `date` | 发布日期列的属性名 |
| `SITE_URL` | 正式站地址 | 读它的 `/rss/feed.xml` 确认构建完成。不设就退回旧行为：Hook 返回成功就算数 |
| `CONFIRM_MINUTES` | `60` | POST 后等多久还没构建完就重试 |

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

把输出里的 `id = "..."` 抄到 `wrangler.toml` 的 `[[kv_namespaces]]` 下。KV id 不是密钥，可以提交。正式站的 KV 已经建好、id 已填，这一步只在重建 KV 时需要。

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

   - `init`：第一次运行（或从旧版本升级），记下起点和线上页面
   - `no-change`：没有需要上线的变化
   - `waiting`：有改动，但还没安静满 10 分钟
   - `capped`：今天已经发满 `MAX_BUILDS_PER_DAY` 次
   - `deployed`：已经 POST Deploy Hook，`reasons` 是触发原因：`edited`、`scheduled`、`removed`
   - `building`：等构建完成
   - `confirmed`：RSS 显示新构建已上线，`builtAt` 是构建时间
   - `retried`：超过 `CONFIRM_MINUTES` 没等到，已经重新 POST
   - `build-timeout`：超时了，但今天已经发满，放弃这一次

2. 查当前状态（只有时间、计数和线上页面数，没有密钥和页面 id）：`https://notion-autodeploy.<你的子域>.workers.dev/status`

3. 验收：在 Notion 里改一篇已发布文章的一个字，放下手机。约 10–15 分钟后日志出现 `deployed`，Cloudflare Pages 的 Deployments 列表多一条 Source 为 Deploy Hook 的构建。构建 Success 后打开那篇文章，看到改动就算通过。从改完到上线应该在 30 分钟内。

## 本地模拟

不碰真实 Notion、Hook 和站点，用一个本地 mock 服务顶替：

```bash
npx wrangler dev --test-scheduled --var NOTION_API_BASE:http://127.0.0.1:8788 --var SITE_URL:http://127.0.0.1:8788 --var NOTION_TOKEN:fake --var DEPLOY_HOOK_URL:http://127.0.0.1:8788/hook
```

mock 服务需要响应 `GET /v1/databases/:id`、`POST /v1/data_sources/:id/query`（支持 `start_cursor` 分页）、`POST /hook` 和 `GET /rss/feed.xml`。

`__scheduled?time=` 不会改变 `scheduledTime`。要指定时间，用 Local Explorer 的接口，`scheduled_time` 是毫秒时间戳：

```bash
curl -X POST "http://localhost:8787/cdn-cgi/local/explorer/api/local/scheduled?worker=notion-autodeploy" -H 'content-type: application/json' -d '{"cron":"*/5 * * * *","scheduled_time":1793246400000}'
```

## 已知限制

- 每次只看最新编辑的 100 条。一次改了 100 篇以上页面，更早的那些改动要等下一次构建时才一起上线。
- Notion 的 `last_edited_time` 精确到分钟。
- 定时文章的 `date` 带了非北京时间的时区时，Worker 仍按北京时间算到点时间，可能和构建差几个小时。
- 新建一篇未来日期的已发布文章，会先触发一次构建（这次构建不会显示它），到点再构建一次。第一次是为了把它的发布时间记进快照。

## 为什么不用别的方案

- **GitHub Actions 定时任务**：`schedule` 事件在高负载时会被延迟，甚至被丢弃（[GitHub 文档](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule)），保证不了 30 分钟内。
- **Notion webhook**：`page.content_updated`、`page.properties_updated` 是聚合事件，Notion 说明一般 1 分钟内送达，最晚 5 分钟（[Event types & delivery](https://developers.notion.com/reference/webhooks-events-delivery)）。但这里本来就要等 10 分钟防抖，webhook 最多只能省下 Cron 的那 5 分钟间隔，代价是多一个公开入口、一次验证握手和一个签名密钥（`X-Notion-Signature`，HMAC-SHA256）。Notion 官方文档也没写免费版是否可用。所以先不加，以后要更快再补。
