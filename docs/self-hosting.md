# 三项目部署

| 项目 | Worker | 职责 |
| --- | --- | --- |
| PCL-N-Plugin-Center-Web | nexa-web | 界面、静态资源、同源转发 |
| PCL-N-Plugin-Center-Server/nexa | nexa-api | 商店、工单、计费、遥测，D1 nexa-platform |
| PCL-N-Plugin-Center-Auth | nexa-auth | OAuth、账户、MFA、身份令牌、等级与角色资格，D1 pcln-production |

Auth 在 auth.pcln.top 签发 HttpOnly Cookie，Web 换取仅存内存的 API Bearer 令牌。API 每次通过 AUTH binding 验证当前身份；管理员的统一账户会话可访问管理功能。浏览器修改请求携带 Origin 与 X-Nexa-Request，错误返回 problem+json。

在各项目执行 pnpm install --frozen-lockfile 和 pnpm check。生产迁移在所属项目使用 wrangler d1 migrations apply DATABASE --remote --env=""；先部署 Auth，再部署 API，最后 Web。各自独立构建，不复制 Web 到 Auth。迁移前导出数据库备份到受保护且被 Git 忽略的目录。

Auth 密钥由 Wrangler secrets 配置：MFA_ENC_KEY、TOKEN_ENC_KEY、OAuth providers 的 CLIENT_ID/CLIENT_SECRET；SERVICE_TOKEN 仅供可信服务提交等级事件和资格证据。公开匿名遥测不会授予经验或角色，调用方应先验证事件归属再通过 Auth 内部通道提交。商店下载量证据由 API 负责产生；Auth 负责角色授权，避免浏览器自报经验改变权限。

遥测四个原页面保留在管理页。规划文档中的未实现业务不能视为已交付功能；实际入口以路由和服务测试为准。
