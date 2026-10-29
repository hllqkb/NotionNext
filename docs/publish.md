# 发布流程：Notion 写完到上线

更新于 2026-10-28。适用于 hllqkb-blog（Cloudflare Pages 免费版，生产分支 `setup/knowledge-base`）。

文章在 Notion 里，站点是静态导出。改完文章后要重新构建一次，新内容才会上线。平时单次构建 4–7 分钟。免费版同一时间只跑一个构建，后面的排队。

## 一、一次性配置（Cloudflare 后台）

### 1. 建 Deploy Hook

1. Cloudflare Dashboard → Workers & Pages → 选 hllqkb-blog 项目。
2. Settings → Builds → Deploy hooks → Add deploy hook。
3. 名字填 `notion-publish`，Branch 选 `setup/knowledge-base`。
4. 保存后页面会显示 Hook URL，形如 `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/<id>`。

Hook URL 不需要任何其他认证，拿到 URL 的人都能触发构建。所以：

- 不要提交到仓库，不要放进公开的 Notion 页面、前端代码或聊天记录。
- 只存在手机快捷指令、浏览器书签这类自己设备上的地方。
- 怀疑泄露了，就在同一页面删掉旧 Hook，再建一个新的。

参考：[Deploy Hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/)

### 2. 收窄 Preview branches，减少排队

默认所有非生产分支的每次 push 都会构建一次预览。合并 PR 时生产构建又要排在这些预览后面，从合并到上线会拖到 20–40 分钟。

Settings → Builds → Branch control → Preview branches 改成 Custom branches：

- Include：`*`
- Exclude：`main`、`dependabot/*`

`main` 只用来同步上游 NotionNext，不需要预览。这样只有提 PR 的功能分支会出预览。

想再省队列，可以改成 Include 只填 `preview/*`（或直接选 None）。代价是 PR 不再自动出预览，需要预览时另推一个 `preview/<名字>` 分支。

Production 分支的自动部署不受这个设置影响，合并到 `setup/knowledge-base` 照常上线。

参考：[Branch deployment controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/)

## 二、手机上把 Hook 存成快捷方式

任选一种：

**iPhone 快捷指令**

1. 快捷指令 App → 新建 → 添加操作「获取 URL 内容」。
2. URL 填 Hook URL；展开选项，方法选 `POST`。
3. 再加一个「显示通知」，内容写「已触发构建」。
4. 命名「发布博客」，可以加到主屏幕。

**电脑或安卓**

命令行触发：

```bash
curl -X POST "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/<id>"
```

返回里 `"success": true` 就是已经排进队列。安卓可以用 HTTP Shortcuts 之类的 App 存一个 POST 请求。浏览器书签只能发 GET，触发不了 Hook，书签请存 Cloudflare 项目的 Deployments 页面，用来看进度和手动 Retry。

## 三、每次发布

1. 在 Notion App 里写完文章，检查 title、slug、summary、date、分类、标签、封面图。
2. 状态改成 `Published`。
3. 点一次「发布博客」快捷指令。同一轮改动只点一次，连点会多排几个构建。
4. 打开 Cloudflare 的 Deployments 页面，看最新一条：Source 显示是 Deploy Hook，分支是 `setup/knowledge-base`。
5. 状态变成 Success 后，打开文章 URL 确认内容是这次改的版本。成功之前不要当它已经上线。

构建失败时，在那条部署记录里点进去看日志，修好后在页面上 Retry deployment，或再点一次快捷指令。

## 四、用脚本或 API 改 Notion 正文

构建会把每篇文章的正文缓存在 `.next/cache`，缓存 key 里带着页面的 `last_edited_time`，Cloudflare 每次构建都会沿用这个缓存。在 Notion App 里正常编辑时，这个时间会自动更新；用脚本或 API 直接写块（`saveTransactionsFanout` 之类）则不会更新它，下次构建就会继续用旧正文。

所以凡是用脚本改了正文，改完后在同一次操作里给所在页面补一条 `update {last_edited_time: 当前时间}`，再触发构建。具体写法见 `~/personal/notion-import/README.md`。
