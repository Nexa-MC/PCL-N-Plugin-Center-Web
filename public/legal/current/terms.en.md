# Nexa Cloud Terms of Service

**Version: 1.1**  
**Effective: October 1, 2026**

English translation of the Chinese version supplied with your acceptance record. The original document remains available from the legal documents page.

These Terms apply to Nexa, PCL N, Nexa Cloud, NexaStore and related websites, online services and APIs that expressly refer to them.

## 1. Operator and services

Nexa Cloud is operated by **Xie Jiangmao (谢江懋)**, an individual operating under the **Nexa / PCL N** brands. Main domains are `pcln.top`, `www.pcln.top`, `auth.pcln.top` and `api.pcln.top`.

Contact general support at `support@pcln.top`, privacy matters at `privacy@pcln.top`, security matters at `security@pcln.top`, and legal or intellectual property matters at `legal@pcln.top`. GitHub Issues is a supplementary public technical support channel. Use the dedicated addresses for personal information, account security, payments, intellectual property or other information unsuitable for publication.

These Terms cover services actually available, including accounts, NexaStore, Nexa Cloud, subscriptions and cloud storage. Roadmaps, development builds, previews, disabled APIs and future features are not promises that those services are available.

Nexa and PCL N are not official Microsoft, Xbox, Minecraft or Mojang products. Without express authorization, no endorsement, sponsorship or guarantee by those parties is implied.

## 2. Acceptance

We provide these Terms before account creation, joining an organization, submitting resources, buying paid services or other actions requiring acceptance. You accept through an explicit checkbox, confirmation or another clearly identified affirmative action.

Visiting public pages or browsing NexaStore without an account does not mean accepting automatic renewal, waiving statutory consumer rights, agreeing to unnecessary data processing or agreeing to unavailable services. The Privacy Policy describes personal information processing. Accepting these Terms does not replace separate consent where required.

Revision 1.1 adds account security, community connections, levels, experience and badges. Existing 1.0 acceptance records are retained. Account functions requiring current Terms require explicit confirmation of 1.1; old acceptance is not migrated into new acceptance. Delivery or acknowledgment of the Privacy Policy is recorded separately and is not blanket consent to all processing, cross-border transfers, marketing or future features.

## 3. Eligibility and minors

You must meet the age and legal capacity requirements where you live, and those of your chosen identity and game providers. Obtain parental or guardian consent where legally required. If Nexa has not provided a legally required guardian process, you may not bypass it to create or use the relevant account functions.

Personal information of children under 14 in mainland China is subject to applicable special protection requirements. Purchases, paid publishing and developer settlements may require greater age or legal capacity. Paid developers and settlement recipients should generally be at least 18, or have the capacity to independently undertake the relevant commercial obligations where they live.

## 4. Accounts and sign-in

GitHub, Microsoft and Google currently support sign-in and identity linking. We do not obtain their passwords. Stable provider identifiers, email and basic profiles may be connected to one Nexa account, but **accounts are not automatically merged solely because provider accounts share an email address**.

You may link multiple identities and must currently retain at least one third-party sign-in identity. After registration you may set a Nexa user ID and password. Password sign-in also requires a registered passkey, authenticator code or unused recovery code. Without an available verification method, use third-party sign-in to configure security first.

Passkey private keys stay with your device or credential provider. Protect authenticator keys and recovery codes. Unused recovery codes can currently be viewed again on the account page: accounts with a password must verify it; accounts using only third-party sign-in require a valid session. Regeneration invalidates previous unused codes. Each code works once. These settings cannot protect third-party credentials that have already leaked.

Standard Microsoft sign-in and optional Minecraft linking serve separate purposes. When you actively link Microsoft, authorization may request Xbox and offline access to check Minecraft ownership and profiles and later obtain game sign-in tokens. Availability depends on your authorization, Microsoft services and a valid game entitlement. Linking does not establish ownership or bypass licensing or security requirements.

### 4.1 Community connections

Afdian linking uses official OAuth and is available only when shown as enabled. It obtains the returned user identifier, optional private identifier and nickname. Community connections cannot sign in to or recover Nexa accounts, grant administrator access or automatically verify payments, donations or badges. You may unlink them. The same community account cannot belong to different Nexa accounts simultaneously.

Bilibili linking is currently unavailable. The planned method checks public information and profile signatures, without collecting Cookies or SESSDATA or simulating QR sign-in. The planned flow confirms the UID and public profile, offers three signatures, and asks you to update your Bilibili signature and verify it. A challenge belongs to the current Nexa account and UID, lasts 15 minutes and allows at most five checks. Only the chosen signature is valid; replaying old challenges cannot bind again. Ownership verification and later nickname, avatar, level and follower synchronization are separate. Stale upstream data, rate limits or failed reads cannot count as success. You may restore your original signature after success. Linking will stay closed until the vocabulary has been manually reviewed and the actual API verified. This description does not mean the service is available.

### 4.2 Levels, experience and badges

Levels, experience and badges record participation and display within Nexa. They are independent of paid Cloud+ membership and do not automatically grant game licenses, administrator access, payment benefits or an immutable ranking.

Levels range from Lv0 to Lv7. Reaching Lv1 requires launching Minecraft once in a launcher signed in to the current Nexa account, confirmed through a trusted API. Cumulative thresholds for Lv2–Lv7 are 2,000, 5,000, 10,000, 20,000, 50,000 and 100,000 Exp. The account overview shows your level, experience and next requirement.

Launcher activity APIs are currently reserved for future integration. They require a trusted mTLS client certificate and current account credentials. This does not mean local online activity is already being collected. Once integrated, days use Beijing time (`Asia/Shanghai`):

| Source | Experience |
| --- | ---: |
| Daily launcher sign-in | 20 Exp |
| First Minecraft launch each day | 30 Exp |
| Time in game | 1 Exp per minute |
| Launcher online | 1 Exp per 5 minutes |

The daily combined cap is 500 Exp. Online time is estimated from valid server-received activity and heartbeats. Disconnected periods are not backfilled, multiple devices do not accumulate overlapping time, repeated events do not earn repeated rewards, and anonymous telemetry does not earn experience. Network failures or missing reports may cause differences from local running time. Contact support for review.

Badges that can replace the level display:

- **Lv∞**: Lv7, at least 100 valid Minecraft hours and passing the infinity quiz. The question bank is unavailable, so this badge is not currently awarded.
- **Lv-1**: Current website administrator status. It stops replacing the level when access is revoked; the badge itself grants no access.
- **LvMC**: An achievement of launching Minecraft on 100 consecutive Beijing-time dates, based on valid activity. A later interruption does not erase the achievement.

Badges that cannot replace the level display: **From Bilibili** (Bilibili Lv6), **Yellow badge** (at least one million Bilibili followers), and **I like you** (cumulative donations to Nexa strictly exceeding RMB 1,000 without payment in return). Bilibili and donation eligibility is currently verified by administrators using source accounts and evidence; administrators cannot review their own eligibility. Subscriptions, purchases and OAuth linking are not proof of such donations.

You may select an earned eligible replacement badge or restore the normal level display. Replacement does not change your actual level or experience. The platform may correct mistaken, forged or abused records based on facts, explain its verification reasons and provide support and appeal channels. Important rule changes will be communicated separately and will not replace your rights with unexplained retrospective adjustments.

Protect accounts, identities, recovery methods and API credentials. Do not sell, rent or maliciously share accounts, impersonate people, organizations or officials. Revoke sessions and notify us promptly after unauthorized access. Account activity is not automatically and conclusively attributed to the account holder in every circumstance; responsibility depends on evidence, fault and applicable law.

## 5. Acceptable use

Do not use or help others use Nexa to violate law; distribute malware, backdoors, hidden miners or credential theft tools; access accounts, systems or data without authorization; bypass purchases, entitlements, quotas, DRM, scans, signatures or access controls; forge orders, licenses, signatures, reviews, identities or publisher details; infringe copyright, trademarks, privacy or other rights; upload third-party code, images, fonts, audio or resources without redistribution rights; commit fraud, fake traffic, abuse, harassment, spam or destructive attacks; or secretly replace approved resources with unreviewed artifacts.

Reasonable interoperability, security research, bug reporting and acts expressly allowed by law or licenses are not automatically prohibited by these Terms.

## 6. NexaStore

NexaStore provides resource discovery, listings, versions, licenses, review status and distribution. Pages should identify the publisher, version, license, compatibility, important dependencies, required permissions, free or paid status and important restrictions as clearly as possible.

Review, automated scans, signatures and other checks reduce risk but **do not guarantee the absence of vulnerabilities, malicious behavior, incompatibility or quality problems**.

### 6.1 Third-party Marketplace

NexaStore v1.0 may offer third-party free publishing. Paid third-party Marketplace services stay closed until transactions, developer settlements and an appropriate payment provider are supported. Paid resources, commercial DRM, Chargeback Protection and settlements require applicable developer commercial agreements and supplementary rules before opening.

### 6.2 Licenses

Publishers must choose a clear license. Supported choices may include common open-source licenses, All Rights Reserved and custom licenses. Custom licenses must supply their full text and may also provide a reference link. Third-party dependencies without redistribution permission must not be included directly in Nexa-hosted packages. Your rights depend on the applicable license and the conditions clearly shown when acquired.

## 7. Submitted content

You retain your existing legal rights in code, images, text, resources, trademarks and other content. Submission grants Nexa only the nonexclusive permission necessary to provide the services you request: receiving, storing, hashing, format and integrity checks, malicious-content and compatibility scanning, review, signing or distribution manifests, and displaying, caching and distributing when you choose public release.

This does not transfer ownership or permit arbitrary sales, independent commercialization or inclusion of private content in general-purpose AI training datasets. Published artifacts cannot be changed by replacing them in place.

## 8. Removal and security revocation

Publishers may stop distribution through the platform's process. Ordinary removal immediately stops public distribution and new acquisitions. Continued use of acquired local copies depends on their licenses.

For future resources with perpetual paid licenses, ordinary removal or publisher account deletion may lead to stopping new sales, notifying existing lawful buyers, providing a final DRM-free archive, allowing a private final download window of up to seven days, then ending cloud re-downloads. This arrangement does not apply to security revocation.

Reasonable evidence of malware, serious vulnerabilities, signature anomalies or other threats may cause immediate suspension of downloads, updates and new DRM authorizations, a security-revoked designation, and blocking protected resources on the client's next online security check. Reasons, evidence and an appeal channel will be retained where reasonably practicable.

## 9. Nexa paid services

Nexa may sell its own Cloud+ services, cloud storage, AI allowances, plugins, software or other clearly identified digital products. Actual availability is determined by the purchase page. Free services may be available globally; unless separately announced and appropriate arrangements completed, **Nexa does not actively offer paid services to the EEA or UK**.

The current Paddle integration is a sandbox. Test checkouts, subscriptions and previews are not real payments or commitments to actual delivery. Real sales become available only when explicitly described and enabled. Afdian linking verifies an account and does not imply order or payment-query access.

## 10. Prices, tax and payment

Purchase pages show clear currencies. Nexa generally displays tax-inclusive prices; legally required regional differences are explained before checkout. For products expressly sold through Paddle, Paddle acts as Merchant of Record / authorized reseller for sales, payments, taxes and orders.

You transact with Paddle; Nexa remains the product developer or licensor. Nexa's product-use and technical-service terms continue to apply, and Paddle's buyer terms may also govern orders, payments and refunds. Paddle is not used for unauthorized third-party Marketplace collection, developer revenue sharing or Nexa advertising.

## 11. Cloud+, subscriptions and trials

Cloud+ may offer automatically renewing monthly and yearly plans. Before confirmation, the purchase page should show the plan, price, currency, billing period, first charge date, renewal arrangements and cancellation method.

### 11.1 Lite trial

Lite may offer a seven-day free trial requiring a valid payment method, converting automatically to a paid subscription when it ends. Generally each eligible user gets one trial. Accounts, payment identity and limited anti-abuse signals may detect repeat trials; this does not permit arbitrary tracking or unnecessary fingerprinting. Cancel before the first charge to avoid it.

### 11.2 Failed payments

A three-day grace period may be offered after failed renewal, if explicitly provided by the actual product rules. Membership shown on the account uses verified subscription status; sandbox or `past_due` status alone does not guarantee paid benefits. Unpaid subscriptions may downgrade to a currently available lower plan after the grace period.

### 11.3 Storage downgrade

Only where the relevant cloud storage feature is actually available and applicable: if data exceeds the new limit, new uploads and storage-increasing changes are blocked, deletion remains possible, and an extra seven-day over-quota grace period is provided. During that period, only an objectively and deterministically selected set of files within the current capacity can be read. If no file fits, reading may be unavailable. After seven days the account becomes over-quota locked. Downgrades alone do not automatically delete excess data; deleting data or upgrading restores access.

## 12. Cancellation and refunds

Manage subscriptions through the account billing page. Paddle subscriptions may link to or call Paddle's management tools. Stopping renewal generally prevents future charges and does not automatically prorate the current period.

Request refunds through Nexa support. Nexa reviews order status, delivery, applicable rules and law, and uses the transaction provider where necessary. Duplicate charges, non-delivery, verification errors, serious discrepancies from purchase descriptions, statutory remedies and other express refund commitments may justify refunds or other remedies. Labels such as “digital goods”, “downloaded” or “third-party content” do not by themselves exclude statutory refunds or consumer remedies.

## 13. Advertising and sponsorship

If advertising opens, paid placements must clearly say “Sponsored” or an equivalent prominent label. Initial placements may include “Daily picks” and “Hidden gems” in the homepage's lower-right area. Payment cannot buy exemption from security reviews, relaxed content rules, private user data or disguised organic results. Initial targeting is limited to context such as language, page and resource category, excluding private cloud files, chats and sensitive personal information.

## 14. Automated review and AI

Deterministic rules and tools may assist malware scanning, permission and dependency changes, unusual sign-in detection, abuse detection and risk classification. Before AI-assisted review, support summaries or other AI processing is enabled, the Privacy Policy should identify its providers, data and purposes. These Terms alone do not authorize private content for general-purpose third-party AI training. Decisions significantly affecting accounts, money or publishing rights should not be final and unappealable solely on opaque AI output.

## 15. Review, reports and appeals

Applicable rules may lead to requested changes, refused publication, removal, distribution suspension, security revocation, temporary account restrictions or, in serious cases, termination of relevant services. Nexa is independently operated and **does not guarantee different staff for initial review and appeal**. Reconsideration should record the original decision, new facts or evidence, reasons and final outcome even when the same operator reviews it. Statutory remedies through consumer bodies, authorities or courts remain available.

## 16. Account deletion

Request deletion at `/account/delete` or through “Privacy and data”. A **seven-day cooling-off period** allows cancellation. Afterward the platform revokes sessions and credentials, unlinks identities, deletes or anonymizes ordinary profiles, deletes levels, activity, badge verification, community connections, MFA factors and saved Microsoft refresh tokens, and handles legally required or dispute-related retention under the Privacy Policy.

Sole organization ownership or published resources may transfer to a system custodian for database integrity. Transferred resources are immediately removed from the public catalog. The custodian cannot sign in, publish versions, change prices, sell, withdraw money or obtain normal user access. Refunds, chargebacks, settlements, complaints or security cases do not automatically prevent deletion; necessary records may be separated and retained with restricted access.

## 17. Availability and changes

Nexa takes reasonable measures to operate services. Maintenance, cloud or network failures, security incidents, upstream changes and force majeure can interrupt them. Without an express SLA, no round-the-clock staffing or uninterrupted operation is promised. If we voluntarily end an important paid service, legally permissible and reasonably practicable notice and appropriate export, migration, continued access or refunds for undelivered periods will be arranged.

## 18. Intellectual property complaints

Send notices to `legal@pcln.top`, preferably including the rights holder's identity and contact, rights involved, disputed resource, initial evidence and requested action. We may forward necessary notices and take interim measures under applicable law. Publishers may submit rebuttals, authorization or explanations. Malicious or false complaints may create legal liability.

## 19. Liability

Each party's responsibility follows applicable law, actual fault, causation and damage. Third-party resources come from their publishers under their licenses, without excluding Nexa's statutory responsibility as platform, provider or sales-related party. Risk statements, absence of absolute guarantees and third-party notices do not exclude non-excludable liability or consumer rights.

## 20. Changes to these Terms

Law, security, product, provider or business-model changes may require revisions. Non-urgent changes materially affecting ordinary users' important rights receive reasonable notice. If NexaStore becomes an e-commerce platform under applicable law, rule changes also follow applicable publication, consultation and advance-notice requirements. Changes requiring new agreement obtain confirmation before taking effect. Previous versions remain archived.

## 21. Governing law and disputes

These Terms generally apply **the laws of mainland China**. This choice does not exclude mandatory consumer, personal information or other non-waivable protections under the law of your habitual residence. Contact `support@pcln.top` to attempt resolution. Negotiation does not prevent either party from seeking lawful relief through consumer organizations, competent authorities or courts.

## 22. Contact

Support: `support@pcln.top`  
Privacy: `privacy@pcln.top`  
Security: `security@pcln.top`  
Legal and intellectual property: `legal@pcln.top`

Operator: **Xie Jiangmao (谢江懋), an individual operating as Nexa / PCL N**.
