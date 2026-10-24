# Cloud+ Paddle 正式目录与地区价格

完成日期：2026-10-23。环境：production。本次已按确认清单创建并验证 4 个 SaaS 产品、8 个订阅价格；所有实体均为 active，正式 ID 已填写到目录和映射表。

## 正式 ID

| 产品 | 产品 ID | 月付价格 ID | 年付价格 ID |
| --- | --- | --- | --- |
| Cloud+ Lite | pro_01m5nh7c55ym98b44frhts15x5 | pri_01m5nh7cbd1r1khpvm0mp345e5 | pri_01m5nha4dx3pxv59wtsg31edm8 |
| Cloud+ Standard | pro_01m5nha7fbd0n69j862eqyvee0 | pri_01m5nha7ng5fmkanptfj0e6rr0 | pri_01m5nha7zdh4abfmabq61v4cnn |
| Cloud+ Advanced | pro_01m5nhb3afhntzayvawsem00mg | pri_01m5nhb3gak4qafrssj64mn7k7 | pri_01m5nhb3sfk4at9kj3rx9s3768 |
| Cloud+ Ultimate | pro_01m5nhb6qhc8gnf713y2em4dcc | pri_01m5nhb6xg79ffbsdepk04z5dn | pri_01m5nhb76c2are695yct25ffvj |

## 定价与验证结果

| 套餐 | 美元月付基价 | 美元年付基价 | 试用 |
| --- | ---: | ---: | --- |
| Cloud+ Lite | 0.99 | 9.90 | 月付、年付均为 7 天免费试用，需要支付方式 |
| Cloud+ Standard | 2.99 | 29.99 | 无 |
| Cloud+ Advanced | 7.99 | 79.99 | 无 |
| Cloud+ Ultimate | 17.99 | 179.99 | 无 |

- 每个价格包含 36 组地区覆盖，显式覆盖美国以外的 228 个国家/地区；美国使用美元基价。覆盖当前 API 允许销售的全部 229 个国家/地区，使用 32 种币种。
- 创建前刷新币种和国家规则；296 处金额全部符合精度和最低扣款金额。源文件与逐国家 CSV 的 1,832 项金额对照一致。
- 逐个 GET 回读全部 4 个产品和 8 个价格，核对产品税类、状态、周期、试用、基价、全部地区覆盖金额、数量限制及元数据。
- 对美国以及每组地区覆盖的一个代表国家执行真实 Price Preview，共 37 个国家、296 个套餐/周期金额比较，全部通过。各组测试覆盖两种计费周期；这些预览不代表逐一测试了全部 229 个国家。
- 美国预览使用纽约邮编 10001；其他代表国家只提供国家码。预览按该国家的含税/未税模式核对原稿金额。美国等税外地区结账总额可能高于基价，精确税额仍取决于实际客户地址。
- 请求采用 account_setting；Paddle 保存后返回 location，与创建前、创建中和创建后读取的账户默认税务模式一致。已记录请求值与返回值，没有更新账户全局设置；后续变更账户税务设置时需重新核对价格的 tax_mode。
- 数量限制为 1；Lite 免费试用 7 天且需要支付方式，其他档位没有试用。每账户一次的应用层试用资格限制未在本次任务中验证。
- 未重估汇率或购买力；ARS、TRY 等原稿金额原样保留。

## 正式收款准备情况

本次授权范围为创建目录。网站和服务端继续使用既有沙箱环境及其价格映射，正式 ID 另行保存，尚未部署到网站。

| 项目 | 当前状态 | 后续要求 |
| --- | --- | --- |
| 正式 API 连接 | 已确认 production，产品和价格写入权限已生效 | 当前目录创建已完成 |
| 正式目录 | 4 个产品、8 个价格均 active | 已完成回读和地区预览验证 |
| 正式前端令牌 | 仍无活跃令牌 | 创建并配置 live 前端令牌 |
| 默认付款链接 | default_url 仍为 null | 获批域名准备好后配置实际加载 Paddle.js 的结账页面 |
| 通知目的地 | 仍为空 | 配置正式事件投递，并安全保存正式签名密钥到服务端 |
| 获批网站 | checkout-domains 仍为空 | 在后台提交网站审核 |
| 账户审核 | onboarding 仍为 pending | account_setup、domain_review、identity_verification、final_review 均待完成 |
| 税务模式 | location | 沿用当前设置 |
| 出款资料、Retain 设置 | 本次 API 无法完整确认 | 在 Paddle 后台核对 |
| 真实付款和 webhook 履约 | 尚未测试 | 上线设置完备后验证付款、试用和订阅权益同步 |

## 文件与证据

- [catalog.json](catalog.json)：完整地区价格目录，已填写全部正式 ID；create_body 保留实际发送的字段。
- [id-mapping.json](id-mapping.json)：现有沙箱代码价格 ID 与正式产品、价格 ID 的独立映射。
- [regional-prices.csv](regional-prices.csv)：229 个国家/地区的价格，含主单位与最低计价单位金额。
- [validation.json](validation.json)：验证统计与验证边界。
- [creation-results.json](creation-results.json)：创建记录与逐价格回读结果，包括税务返回值差异的记录。
- [regional-preview-results.json](regional-preview-results.json)：37 个代表国家的实际价格预览及 296 项金额对照。
- [post-create-audit.json](post-create-audit.json)：创建后的目录清单与剩余上线缺项。
- [pre-create-audit.json](pre-create-audit.json)：写入权限生效后的创建前快照。
- [account-audit.json](account-audit.json)：上一阶段的只读账户审计，以及当时的币种与国家规则快照。
- [source-prices.md](source-prices.md)：用户原始 Markdown 的原样副本，保留其创建前状态说明。原稿引用但原路径缺失的 CSV、JSON 数据已在本目录重建。

规则依据：[创建价格](https://developer.paddle.com/api-reference/prices/create-price)、[地区价格优先级](https://developer.paddle.com/build/products/offer-localized-pricing)、[Paddle 上线清单](https://developer.paddle.com/build/go-live-checklist)，以及本次正式 API 返回的数据。
