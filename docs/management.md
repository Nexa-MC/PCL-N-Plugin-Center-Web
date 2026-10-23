# 网站管理后台

后台部署为独立 Worker `nexa-manage`，域名 `manage.pcln.top`。它复用本站构建产物，
通过 `API`、`AUTH` service bindings 连接 `nexa-api` 与 `nexa-auth`，不持有数据库或独立密码。
域名根路径跳转到 `/manage`，前端路由刷新由 SPA fallback 处理。

## 已实现

- 工作概览：用户、资源、工单、待审资格的实际 D1 数据。
- 用户管理：分页搜索名称/用户 ID/邮箱、查看角色、停用和恢复非管理员账户。
  停用立即撤销该账户全部会话；恢复不复活旧会话；不能更改自己或其他管理员的状态。
- 资源目录：分页搜索、新建和编辑简介/介绍/发布者/分类/版本，以及上架与下架。
  更新使用 `If-Match`，避免覆盖其他管理员的修改。此功能不包含制品文件上传和交付。
- 支持工单：按待处理/已解决在服务端筛选和分页，确认解决并检查版本冲突。
- 资格审批：读取最早 100 条待审开发者/受信任开发者/管理员申请、通过或拒绝；禁止审批自己。
- 操作审计：分别分页读取身份库与平台库的真实事件。
- 启动器遥测：复用既有的趋势、运行分析、灰度策略与资源模型管理界面。

## 身份与域名

浏览器继续直连 `auth.pcln.top`，使用该域 HttpOnly Cookie 静默换取仅在内存保存的 Bearer token。
进入后台与窗口重新聚焦时重新验证真实会话；前端 `test_login()` 演示账户不能进入后台。
每个管理接口都在服务端重新检查 Auth 当前 staff 状态，因此撤销权限会立即生效。

Auth 与 API 显式配置 `MANAGE_ORIGIN=https://manage.pcln.top`，保留 `WEB_ORIGIN=https://pcln.top`。
Auth 按精确来源返回 CORS 头和 `Vary: Origin`；写请求仍要求受信来源与 `X-Nexa-Request: 1`。
OAuth 继续使用现有 auth 域回调，只允许返回配置中的网站/后台来源；无需新增第三方 OAuth 回调地址。
Passkey 的 RP ID 保持 `pcln.top`，验证器 origin 白名单包含管理域。
后台页面设置 `noindex, nofollow`、`X-Frame-Options: DENY` 和 `Cache-Control: no-store`。

## 本地验证

三个仓库应并列放置，名称与集成测试一致。先运行 Auth `pnpm dev`（5733）、
Server/nexa `pnpm dev`（5732），再运行本项目 `pnpm dev`（5730），后台路径为 `/manage`。
API 本地数据库需应用 `0023_catalog_revision.sql`：

```bash
cd /workspace/PCL-N-Plugin-Center-Server/nexa
pnpm exec wrangler d1 migrations apply nexa-platform --local --env local
```

检查：Auth `pnpm check`；Server/nexa `pnpm check`（真实 Worker 与 D1 集成）；
Web `pnpm check && pnpm worker:check && pnpm manage:check`。
没有真实登录会话时后台显示登录入口，匿名管理接口必须返回 401；普通账户返回 403。
不要在生产数据库创建测试管理员。

## 发布顺序

先将三仓库的关联变更一起审阅和保存，备份生产数据库，再由拥有既有 Cloudflare 部署权限的环境执行：

```bash
cd /workspace/PCL-N-Plugin-Center-Auth
pnpm check
pnpm exec wrangler deploy --env=""

cd /workspace/PCL-N-Plugin-Center-Server/nexa
pnpm check
pnpm exec wrangler d1 migrations apply nexa-platform --remote --env=""
pnpm exec wrangler deploy --env=""

cd /workspace/PCL-N-Plugin-Center-Web
pnpm check
pnpm manage:check
pnpm exec wrangler deploy --config wrangler.manage.jsonc
```

`wrangler.manage.jsonc` 声明 Cloudflare Custom Domain，Wrangler 会为 `manage.pcln.top`
管理 DNS 与证书；账号需有该 zone 的权限。如果该域已经绑定其他服务，先检查冲突，不删除未知 DNS 记录。
公网 `pcln.top` 不需要被替换，`nexa-web` 仍使用原配置。需要更新主站后台入口文案时单独发布 Web。

Web 仓库的 `Deploy NexaCL Web Worker` 工作流也支持 `target=manage`，仍须填完整已审阅 master SHA；
它仅发布选定的前端 Worker，不替代前面的 Auth/API 发布和 D1 迁移。
后台页面、共享语言和管理配置的 `master` 推送会自动选择 `target=manage`，运行检查后发布管理 Worker；
手动运行仍可选择 `web` 或 `manage`，并验证填写的完整提交 SHA。
工作流使用已有 `cloudflare-pages` 环境中的 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`。
GitHub PAT 不能替代 Cloudflare 部署凭据；不要把任何令牌写入仓库、前端构建或聊天。

Server 仓库的 `Deploy NexaCL management stack` 工作流可以一次发布关联的三个项目，复用 Server
既有网关发布所使用的仓库级 Cloudflare 凭据。Auth/Web 使用显式的完整提交 SHA，API 使用本次运行的提交；
所有测试通过后先保存 D1 Time Travel 恢复点，再依次发布 Auth、迁移并发布 API、发布管理 Worker。
Server 的 `codex/manage-console` 分支推送会触发首次上线；手动运行必须填写三项目的完整已审阅 SHA。
该流程不会发布主站 Worker，结束前自动验证管理域名、构建文件、服务绑定、匿名权限边界和登录 CORS。

发布后检查根路径回跳、深层路径刷新、真实管理员登录与退出、普通账户拒绝访问，
并使用可恢复的业务对象验证一次编辑与审计。真实 OAuth 登录、线上 Cookie、DNS、证书均需在部署后验证。
