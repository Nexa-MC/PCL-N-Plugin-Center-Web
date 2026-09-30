# 启动器接口的 Cloudflare mTLS

mTLS 的证书信任、签名校验、有效期和吊销交给 Cloudflare。Web Worker 只读取 Cloudflare 注入的 `request.cf.tlsClientAuth` 验证结果，不维护证书指纹白名单，不信任客户端传来的证书标头。账户身份仍由当前 Nexa 登录令牌单独验证。

受保护入口仅为 `https://pcln.top/api/v1/launcher/` 下的预留接口。普通网页路径不要求客户端证书，`auth.pcln.top` 不新增 mTLS 关联。TLS 握手的证书请求按主机配置，不能按 HTTP 路径配置；强制拒绝无证书请求的范围由 Worker 的接口路径判断限定。参考 [Cloudflare mTLS 与 Workers](https://developers.cloudflare.com/learning-paths/mtls/mtls-workers/) 和 [启用 mTLS](https://developers.cloudflare.com/ssl/client-certificates/enable-mtls/)。

## 当前部署配置状态

2026-10-01 已确认 `pcln.top` 为 active zone，zone ID 为 `445dcc77acd395b2460d97c176fa3215`，账户 ID 为 `8a92293b5fa45f76d8f73ecabda7d613`。

当前 Wrangler OAuth 登录可读取 zone，包含 `ssl_certs:write` scope，但读取托管 CA 主机关联和客户端证书列表均被 Cloudflare 拒绝，返回 `success:false`、错误码 `10000 Authentication error`。没有可用的 `CLOUDFLARE_API_TOKEN` 环境变量。因此**未能确认或修改 Cloudflare 的主机 mTLS 开关，也没有签发、导入、删除或吊销证书**。不能把 Worker 拒绝无证书请求误报为已经完成 Cloudflare 证书部署。

尚无证书的启动器请求将被预留接口拒绝。将来接入真实启动器时，需要启用以下托管 CA 主机关联并由 Cloudflare 供应客户端证书；本次没有生成或保存客户端私钥。

## 在终端启用托管 CA 主机关联

配置脚本使用 [Hostname Associations API](https://developers.cloudflare.com/api/resources/certificate_authorities/subresources/hostname_associations/methods/update/)；省略 `mtls_certificate_id` 表示操作 Cloudflare 托管 CA。该接口替换整个托管 CA 主机列表，因此脚本先读取并合并现有列表、保存忽略目录中的备份，仅追加目标主机，最后再次读取确认；其他托管 CA 主机和 BYOCA 关联保留。

凭据需具有目标 zone 的 `Zone:SSL and Certificates:Edit` 和 `Zone:Zone:Read` 权限。凭据只从当前进程的 `CLOUDFLARE_API_TOKEN` 或 Wrangler OAuth 配置中读取，不作为命令参数传入，也不打印或写入备份。当前 Wrangler OAuth 的权限不足，脚本会直接失败，不尝试覆盖未知配置。

在 Web 项目目录运行只读检查：

```powershell
pwsh -File scripts/configure-mtls.ps1
```

已有可用 API Token 时，可以在当前终端安全输入并启用：

```powershell
$taskPreviousToken = $env:CLOUDFLARE_API_TOKEN
$taskSecureToken = Read-Host 'Cloudflare API Token' -AsSecureString
$env:CLOUDFLARE_API_TOKEN = [System.Net.NetworkCredential]::new('', $taskSecureToken).Password
try {
    pwsh -File scripts/configure-mtls.ps1 -Apply
} finally {
    $env:CLOUDFLARE_API_TOKEN = $taskPreviousToken
    $taskSecureToken.Dispose()
}
```

重复执行是幂等操作；已启用时不发送 PUT。备份位于 Web 项目 `.tmp/mtls-hostnames-before-*.json`，不包含 OAuth Token、API Token、客户端证书或私钥。

Cloudflare API 没有提供此列表更新的条件写入，因此在运行期间不要由另一个操作员同时修改相同托管 CA 列表。脚本会在写入前再次读取，但不能消除外部并发修改。

## 接口验证规则

Worker 要求证书已呈交、Cloudflare 校验成功且未被吊销：`certPresented === '1'`、`certVerified === 'SUCCESS'`、`certRevoked !== '1'`。证书 SHA-256 指纹只用于识别当前活动设备与幂等记录，经过格式校验，不参与额外信任白名单。

通过验证后 Web Worker 清除外部传入的内部认证标头，再通过私有 Service Binding 向 API 传递证书标识及服务认证。API 没有面向公网的直接路由；Auth 再验证当前登录账户和活动事件。证书不能代替用户登录令牌，也不允许请求正文指定其他账户或任意经验值。

若之后希望在 WAF 也拦截，可添加只命中启动器入口的规则，而不是对整个网站强制证书：

```text
(http.host eq "pcln.top" and starts_with(http.request.uri.path, "/api/v1/launcher/") and (not cf.tls_client_auth.cert_verified or cf.tls_client_auth.cert_revoked))
```

动作设为 `block`。该规则是可选的提前拦截，Worker 验证仍保留。当前没有修改 WAF 规则，也未确认现有 OAuth 凭据的 WAF 权限。字段含义参见 [证书吊销字段](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.tls_client_auth.cert_revoked/)。

上线真实证书后应验证：无证书请求被拒绝，有效且未吊销的 Cloudflare 客户端证书配合有效账户令牌可访问，吊销或过期证书被拒绝，伪造 HTTP 证书标头不能通过，普通网页和登录回调继续正常访问。当前仅预留接口，尚未开展真实客户端证书的端到端测试。
