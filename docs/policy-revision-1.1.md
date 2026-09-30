# 法律文档 1.1 发布核对

生效日期为 2026-10-01。仅服务条款和隐私政策升至 1.1，发布者协议、退款政策保持 1.0。

| 文档 | SHA-256 |
| --- | --- |
| current/terms.zh-CN.md（1.1） | `9033b50cfb0e14f4f4758adf610bb063529ec2443d879420105479cf067729f5` |
| current/privacy.zh-CN.md（1.1） | `8e45f1f498b955232abc6e149acc5c7f71fb5e70f5e1b1e8b1c5eeb28911520b` |
| archive/1.0/terms.zh-CN.md | `13665d991a4ca5eba6f82c25a76d81a313c4b6e555ade65da9bea2a2d15f11a1` |
| archive/1.0/privacy.zh-CN.md | `a0acdf32c4f651783e93ad54bc86f7244b94fbb93dcdb4ad22e1cf983d0f8009` |

摘要针对文件的原始 UTF-8 字节，包含实际换行。归档由旧文件直接复制；不要在应用迁移后修改文档内容、换行或已登记的摘要。后续实质修订应建立新版本及新的归档、摘要、迁移。

Web 的 LegalDocs 展示摘要和下载入口；登录/注册从 `POLICY_VERSION` 读取条款版本。平台常量、账户当前版本提示、现行原文、LegalDocs 元数据和 Auth `0015_policy_revision.sql` 必须一致。

Auth 迁移新增 `terms-1.1`、`privacy-1.1`，原子切换 `current`。原来的 1.0 文档行、条款接受与隐私提供回执保持原版本；迁移绝不复制、补造 1.1 接受记录。已有账户再次明确接受后，条款记录写入新 policy ID；隐私提供回执独立写入，同一操作重试不重复产生审计。隐私回执只证明提供或知悉，不作为所有处理的概括同意。

发布后核对真实原文摘要、Auth 的当前版本、旧账户未确认时的提示，以及明确确认后的版本与回执。B站绑定保持暂未开放；本文档不要求部署尚未通过阶段验收的挑战接口。应验证账户注销与数据导出在尚未确认新条款时仍有合理操作路径。

本次修订根据实际账户安全、游戏可选授权、爱发电关联、等级活动和数据维护代码编写。法规依据核对 [人大个人信息保护法原文](https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html)，托管地域核对 [Cloudflare D1 数据位置说明](https://developers.cloudflare.com/d1/configuration/data-location/)。不把文档更新当作已经完成跨境、邮件投递或未来功能的技术和法律要求。
