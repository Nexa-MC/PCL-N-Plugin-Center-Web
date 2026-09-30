# NexaCL Web

Vue 网站，独立部署为 nexa-web Worker（https://pcln.top）。Auth 项目提供 `/auth/v1`，Server 项目 `nexa/` 提供 `/api/v1`；Web 通过 service bindings 转发，业务与身份数据分别存储到两个 D1 数据库。

需要 Node.js 24.14+ 与 pnpm。

```powershell
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm worker:check
pnpm deploy
```

本地开发先在 Auth 执行 `pnpm dev`（5733），在 Server/nexa 执行 `pnpm dev`（5732），再访问 Web 的 http://127.0.0.1:5730。生产先迁移并部署 Auth/API，再部署 Web。

[部署和职责说明](docs/self-hosting.md)。账户注册、密码与 MFA 实现由 Auth 管理；Web 不保存密码、身份密钥或服务令牌。第三方账户及实体 passkey 需由账户持有人完成实际授权。

主题支持跟随系统及手选浅色/暗色，在当前浏览器保存偏好。账户概览展示等级、Exp 和铭牌，钱包与订阅页展示当前会员；爱发电绑定使用 Auth 的独立社区绑定 API，不能用于登录。B站绑定保持暂未开放。

[政策 v1.1 修订说明](docs/policy-revision-1.1.md) 与 [Cloudflare mTLS 启动器接口配置](docs/launcher-mtls.md)。mTLS 证书验证交给 Cloudflare，当前只预留启动器 REST 接口；不能用请求头伪造客户端证书。
