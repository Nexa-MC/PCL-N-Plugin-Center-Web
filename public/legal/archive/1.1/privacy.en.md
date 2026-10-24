# Nexa Cloud Privacy Policy

**Version: 1.1**  
**Effective: October 1, 2026**

English translation of the Chinese version supplied with your policy record. The original document remains available from the legal documents page.

This Policy explains personal information processing by Xie Jiangmao, operating as Nexa / PCL N, for Nexa Cloud, NexaStore and related online services. Version 1.1 adds account security, Microsoft game connections, community accounts, levels, experience, badges and interface themes, and distinguishes anonymous telemetry from account activity.

## 1. Personal information processor

The processor is **Xie Jiangmao (谢江懋), an individual operating as Nexa / PCL N**. Main domains are `pcln.top`, `www.pcln.top`, `auth.pcln.top` and `api.pcln.top`.

Privacy and data rights: `privacy@pcln.top`; general support: `support@pcln.top`; security incidents: `security@pcln.top`; legal and intellectual property: `legal@pcln.top`. Use dedicated email or account tickets for security, payments or personal information. Do not post credentials or private material in public GitHub Issues.

## 2. Scope and notice

This Policy covers actually available websites, Nexa accounts, NexaStore, Cloud+, relevant developer functions and APIs expressly referring to it. Disabled storage, AI, paid third-party Marketplace, advertising and roadmap features do not authorize advance data collection.

Terms acceptance and delivery or acknowledgment of this Policy are recorded separately, including document version, time and content digest. **Acknowledgment or delivery receipts are not blanket consent to all processing.** Separate consent is obtained where law requires. Old records are not rewritten as acceptance of new versions, and revisions do not retrospectively authorize processing.

## 3. Information we process

### 3.1 Sign-in identities and profiles

GitHub, Microsoft and Google may sign in and link identities. Depending on your choices, we process the provider, stable account ID, returned nickname or basic profile, email and linking time, and store Nexa's internal ID, public user ID, display name and roles. Matching emails alone do not merge accounts.

Standard sign-in scopes are GitHub `read:user user:email`, Microsoft `openid profile email User.Read`, and Google `openid profile email`. We do not receive third-party passwords. You may unlink identities, but must currently keep at least one third-party sign-in identity.

### 3.2 Passwords, two-step verification and recovery

If you set a Nexa password, we store a salted hash, not plaintext. Password sign-in requires a registered passkey, authenticator or unused recovery code.

For passkeys we store credential IDs, public keys, algorithms, signature counters, your chosen names and creation/use times. Private keys and device biometrics used to unlock credentials remain with your device or credential service and are not sent to Nexa.

For authenticators we store device names, TOTP secrets, confirmation times and replay-prevention state. Production configuration encrypts TOTP secrets with a server-side key. During enrollment the secret and QR payload are delivered to your browser for adding to the authenticator.

Recovery-code verification uses hashes. Production also keeps encrypted recoverable copies so unused codes can be viewed later. Viewing, generating or removing sensitive methods requires a valid session; accounts with passwords must also verify the current password. Without a password, the current session is the authorization basis. Viewing is audited. Codes work once; regeneration invalidates previous unused codes.

Sign-in challenges last about five minutes and unconfirmed authenticator enrollments about 15 minutes. They verify identity, prevent replay and limit brute force; they are not used for advertising or third-party profiling.

### 3.3 Sessions and security

We process credential hashes, session scopes, creation/expiry times, OAuth state/nonce, sign-in and linking outcomes, rate-limit state and necessary audits. Rate limiting may use hashed account IDs or IP addresses; the network edge still encounters IP and connection information.

| Cookie | Purpose | Lifetime |
| --- | --- | ---: |
| `nexa_console` | Ordinary account session | Up to about 24 hours |
| `nexa_staff` | Internal operations session | Up to about 1 hour |
| `nexa_oauth_state` | Prevent OAuth forgery/replay | About 10 minutes |
| `nexa_link_afdian` | Prevent Afdian linking forgery/replay; set only when linking starts | About 10 minutes |

Production Cookies use HttpOnly, Secure and SameSite attributes. Short-lived webpage API tokens stay in page memory, not theme preferences or persistent browser storage. Signing out revokes sessions in the current scope.

### 3.4 Optional Microsoft / Minecraft connection

Standard Microsoft sign-in does not request Xbox or offline game access. When you actively link Microsoft, authorization may additionally request `XboxLive.signin offline_access` to check Minecraft ownership, profile ID/name and the latest result.

Where a usable refresh token and production encryption key are available, we store the Microsoft refresh token with AES-GCM encryption to obtain short-lived Xbox/Minecraft tokens and refresh profiles when you later request authorization. Without that key, the refresh token is not saved. Short-lived query tokens are not persisted as profile records. Derived Minecraft access tokens are returned only to the requesting client and are not written to ordinary logs.

Microsoft, Xbox and Minecraft process authorization, ownership and tokens under their own rules. Unlinking Microsoft or completing account deletion removes saved game profiles and refresh tokens. You may also revoke access at Microsoft. Game ownership is independent of Nexa levels.

### 3.5 Community connections

**Afdian** uses official OAuth with `basic` scope, only when enabled on the page. If you authorize it, we process the returned user ID, optional private ID and nickname, and linking/latest-check times. Private identifiers are internal and not public profile fields. We do not request Afdian passwords or use the connection for Nexa sign-in or recovery.

Authorization codes complete one exchange. Linking state belongs to the current session, expires in about 10 minutes and works once. Platform access tokens are not persisted for this purpose. This authorization does not provide order, payment amount or donation-query access; linking alone does not award donation badges. Unlinking removes the mapping and unfinished authorization state.

**Bilibili** linking is unavailable. Current public-profile reads only test API availability; test UIDs have not been bound to Nexa accounts and no user signature challenges have been created.

The planned method reads a UID you actively supply and public nickname, avatar, signature, level and follower count to confirm identity and control. It confirms the profile, offers three signatures, asks you to update Bilibili and verify, and is planned to last 15 minutes with at most five attempts. Only the chosen candidate works; rebuilding or changing UID revokes the previous challenge. The signature is a verification code for the current Nexa account. **Publishing it temporarily may reveal that you are linking that Bilibili account.** Do not use someone else's binding signature; restore your original after success.

Verification will bypass Nexa's own cache but cannot guarantee immediate Bilibili refresh. Mismatches, rate limits, invalid responses or failed reads cannot count as success. Ownership proof and later public-profile synchronization are separate; synchronization cannot substitute for proof. Linking will open only after manual vocabulary review and production API validation, with actual data scope, retention and choices disclosed. We do not collect Cookies or SESSDATA, simulate QR sign-in or request private posts, messages or passwords.

### 3.6 Levels, activity and badges

The overview processes your level, cumulative experience, next requirements and selected badge. Account-linked launcher activity is distinct from anonymous technical telemetry in section 4.

Activity APIs are currently reserved and have no launcher-client integration. Once integrated they verify both trusted mTLS certificates and current Nexa credentials, and process account IDs, event UUIDs/types, server receipt times, certificate fingerprints, experience results, accumulated online time, daily activity and launch streaks. Clients cannot report another user's ID, experience amounts or times. Repeated events do not count again and devices do not accumulate overlapping online time. Certificate fingerprints support trust checks and activity coordination; they are not stable IDs in anonymous telemetry.

After integration: daily launcher sign-in earns 20 Exp, the first daily Minecraft launch 30 Exp, in-game time 1 Exp per minute, and launcher online time 1 Exp per five minutes. The combined daily cap is 500 Exp using Beijing time (`Asia/Shanghai`). Valid heartbeats estimate online time; disconnected intervals are not backfilled. Lv1 requires one confirmed launch while signed in. Lv2–Lv7 thresholds are 2k, 5k, 10k, 20k, 50k and 100k. Anonymous telemetry neither awards experience nor is retroactively merged into account activity.

Badge data comes from:

- **Lv-1**: Current website administrator status; replacement display stops when access is revoked.
- **LvMC**: A recorded achievement of 100 consecutive days with valid game launches.
- **Lv∞**: Lv7, at least 100 valid Minecraft hours and the infinity quiz. No question bank is available, so it is not awarded.
- **From Bilibili** and **Yellow badge**: Administrator verification of Bilibili Lv6 and at least one million followers using source accounts and evidence.
- **I like you**: Manual verification of donations strictly exceeding RMB 1,000 without payment in return. Subscriptions and purchases do not count; Afdian OAuth itself is not payment proof.

Verification records include badge type, verified values, source account/record ID, necessary evidence descriptions, reviewer and time. Administrators cannot review their own eligibility. Supply only relevant evidence, excluding passwords, Cookies, full payment-card details and unrelated third-party information. You may select an earned eligible badge without changing actual level or experience. Future public display will identify its scope; internal evidence is not automatically made public with a badge.

### 3.7 Resources, cloud functions, subscriptions and support

When resource functions are available and you submit content, we process names, descriptions, icons, categories, versions, licenses, compatibility, permissions, dependencies, uploads, hashes, signatures, scans/reviews and release/revocation state. Drafts and private review materials do not become public merely by upload.

When storage opens we may process files you upload, metadata, usage, quotas and sync/deletion state. Future plans do not authorize reading local files in advance.

Subscriptions include Paddle customer IDs linked to Nexa, necessary email, subscription/price IDs, status, cancellation arrangements, transaction IDs, amounts, currencies and times. Paddle is currently a sandbox; test records do not represent real payment. When purchases open, payment providers handle full card credentials; Nexa does not store full card details. Customer portal session URLs are short-lived and not persisted as business records.

Tickets, reports, appeals and support communications contain supplied contact details, subjects, descriptions, necessary attachments, orders or verification materials, status and correspondence. Public resource or publisher information may be shown according to your publishing choices.

## 4. Nexa Desktop telemetry

Technical telemetry uses a tiered protocol. Necessary events include `app.started`, `app.failure`, `update.checked` and `rollout.checked`, limited to low-cardinality technical fields such as version, OS, CPU architecture, results and event times.

Ordinary telemetry does not proactively attach Nexa IDs, stable device/installation IDs, Minecraft names, local paths or complete free-text logs. Cloudflare may still encounter IPs during connections and rate limiting, so all network-layer data cannot be promised anonymous.

Diagnostic telemetry follows the client version's settings and testing conditions. Stable versions may offer settings; prereleases may require limited diagnostics as a testing condition, as disclosed by that build.

Diagnostics may include game/task/feature categories, network timings, memory, CPU, JVM startup/working sets, Java major version, classpath counts, heap configuration, render/simulation distances, FPS/graphics settings, Minecraft/loader versions, limited Mod IDs/versions/dependencies, and symbolized exception types with limited stack frames. Random run IDs connect samples within a run, not stable device identities. Full free-text error logs are not ordinary telemetry uploads.

Data supports fault, performance, compatibility and update analysis, not proof that a Nexa account completed level tasks. Support logs you actively submit follow section 3.7.

## 5. Purposes and basis

We process directly necessary data for requested sign-in, security, connections, resource delivery, subscriptions, levels and badges; necessary security data to prevent replay, brute force, forged activity, takeover and malicious content; limited diagnostics; and necessary support, refund, complaint and dispute records.

The legal basis depends on the feature and applicable law, including necessity for your contract, legal obligations or valid consent. Public data is not unrestricted permission to process, share or repurpose it. Consent and separate-consent requirements are not replaced by Terms acceptance or Policy acknowledgment.

Declining optional game access, Afdian, future Bilibili or manual badge verification does not affect unrelated services, though dependent profiles, connections or badges may be unavailable. Identity-dependent features require valid verification.

## 6. Cookies and browser preferences

Core Cookies support sign-in, authorization security and sessions. Theme preference is stored locally as `nexa:theme`, holding system, light or dark until changed or browser storage is cleared. It contains no account tokens, is not synced to the account database and is not a tracking ID. System mode reads the browser's system color preference.

Continued browsing is not consent to future analytics, marketing, cross-site tracking or unnecessary Cookies. Appropriate notices, choices and withdrawal will precede such features.

## 7. Providers and recipients

### 7.1 Cloudflare

Web, API and Auth run separately on Workers. Auth's D1 stores accounts, identities, security, acceptance, connections and levels. API's D1 stores resources, tickets, subscription mirrors and telemetry. Cloudflare supplies the edge network, security, monitoring and enabled asset storage. Nexa manages program/database access configuration; Cloudflare supplies hosting infrastructure.

Global edges may process requests in different countries. Persistent D1 location depends on creation configuration and service rules. Location hints are not residency guarantees, and Worker execution location is not database location. **We do not currently promise processing or storage exclusively in mainland China.** See [Cloudflare D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/).

Monitoring is restricted and sampled; key acceptance, security and business facts are recorded separately. Ordinary logs should not contain passwords, plaintext recovery codes, TOTP secrets, authorization codes, platform tokens or portal URLs.

### 7.2 Identity, game and community providers

GitHub, Google and Microsoft participate according to your choices. Optional game access involves Microsoft/Xbox/Minecraft; Afdian participates in your requested OAuth connection. Bilibili is unavailable and planned to use chosen accounts' public data only. Providers process their authorization, profiles and access records under their own policies; Nexa's documents do not place them under Nexa's direct control.

### 7.3 Paddle

Paddle currently supports sandbox tests. For actual direct Nexa sales it acts as Merchant of Record / authorized reseller, handling orders, payments, tax, subscriptions and related data, and returns necessary status. It is not the default payment tool for third-party Marketplace settlements or advertising.

### 7.4 Email and support

When configured, notification code may use Resend with recipient email, subject and necessary content. Without configuration it does not send to Resend; account pages still show outcomes. Email delivery is not the sole proof of an action's success. Email providers and third-party channels you actively use handle their communications. Important new providers will be disclosed.

### 7.5 Legal disclosures

Necessary information may be disclosed under applicable law, valid law-enforcement requests, proceedings or major security incidents. Ordinary private requests do not authorize arbitrary disclosure of profiles, credentials or internal evidence.

## 8. International processing

Cloudflare and third-party identity, game and payment services may process outside mainland China, including transfers of mainland users' data. Terms acceptance, Policy acknowledgment or voluntary linking does not itself satisfy all cross-border requirements.

Where required, recipient, purpose and data notices, separate consent, protections and applicable assessments, contracts, certifications or other procedures should be completed. This Policy does not claim an unimplemented procedure is complete. Features or regions should be restricted where necessary conditions cannot be met. Ask the privacy address about processing paths for your features.

## 9. Retention and cleanup

Validity is the period a credential or challenge can be used, not a promise all copies disappear instantly at expiry. Daily cleanup may remove them on the next run. Necessary investigations or legal retention restrict use.

| Data | Current general rule |
| --- | --- |
| Profiles and sign-in identities | Account lifetime; unlinking deletes mappings; final deletion removes or anonymizes ordinary profiles |
| Console / Operations sessions | Up to about 24 hours / 1 hour; sign-out revokes; maintenance cleans expired hashes |
| Sign-in OAuth state/nonce | About 10 minutes; new authorizations and maintenance clear used/expired state |
| Afdian linking state | About 10 minutes; maintenance clears used/expired state; unlinking clears unfinished state |
| Password sign-in / passkey enrollment challenges | About five minutes; expired records older than one day enter daily cleanup |
| Unconfirmed TOTP enrollment | About 15 minutes; maintenance clears expiry |
| Confirmed TOTP, passkeys, recovery codes and password hashes | While used; processed on removal, replacement of unused codes or final deletion |
| Microsoft profiles and encrypted refresh tokens | While linked; removed on Microsoft unlinking or final deletion |
| Afdian mappings | While linked; removed on unlinking or final deletion |
| Launcher account event receipts | After integration, 30 days; daily cleanup afterward |
| Levels, online totals, daily activity/experience, badge verification and display choices | Account lifetime for accumulation, streaks, verification and deduplication; removed on final deletion |
| Unconfirmed registration accounts | Enter daily cleanup after about 24 hours |
| Resolved tickets | Enter cleanup when about 90 days old from creation; unresolved tickets stay while being handled |
| Raw diagnostic run samples and Mod lists | 30 days |
| Daily diagnostic error records | 180 days; active investigations retain groups; expired closed groups are cleaned |
| Daily telemetry aggregates | 396 days, about 13 months |
| Audits, Terms acceptance, privacy notices, transactions and disputes | Not automatically removed on session expiry; restricted retention as needed for service, security evidence and legal duties, reviewed for necessity |

Audit and transaction tables currently have no uniform fixed-day automatic cleanup. They are not for arbitrary tracking or marketing. Retention depends on purpose, law and case status; identifiable information should be deleted or anonymized after purpose ends. Necessary retention does not prevent ordinary account deletion.

Resource drafts, quarantine uploads, artifacts and releases follow disclosed retention only when enabled, not unlimited private-content retention under this Policy.

## 10. Backups and deletion

Recovery systems and restricted operational snapshots may temporarily retain historical copies after normal deletion. Cloudflare recovery windows depend on the actual plan/configuration. Manual snapshots and ordinary recovery are separately managed; no uniform automatic rolling 30-day task is currently claimed.

Backups have restricted access and do not restore deleted accounts for routine service. Operations should review recovery needs and clear unnecessary copies. Restores must reapply deletion markers to prevent historical profiles becoming active accounts. Data that cannot legally be deleted is restricted to necessary storage, security or legal duties.

## 11. Your rights and controls

Applicable rights may include notice, access/copying, correction, supplementation, deletion, withdrawal of consent-based processing, account deletion, restriction/objection, portability, and explanation or human review of important automated results. See the [Personal Information Protection Law of the PRC](https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html).

“Privacy and data” offers export, requests and deletion. Exports include profiles, identities/connections, acceptance/notices, available security summaries, game profiles, levels and verification; ordinary export excludes passwords, TOTP secrets, recovery codes and refresh tokens. Submit further access/correction requests there or to `privacy@pcln.top`.

Account controls revoke sessions, unlink eligible identities/connections, remove/replace verification and choose level display. Change theme or clear browser storage. Revocation does not undo prior lawful processing and may stop dependent features. Where transaction/security records cannot be deleted, we explain reasons and use restrictions.

Verification may require risk-proportionate account-control proof, not unnecessary sensitive identity documents. Submit new facts for review of verification, badges or restrictions. Competent-authority remedies remain available.

## 12. Account deletion

Request through “Privacy and data” or `/account/delete`. The seven-day cooling-off period permits explicit cancellation. Maintenance completes deletion afterward; cleanup is not promised within the same second.

Final deletion revokes sessions, removes identity/community mappings, game profiles and refresh tokens, MFA, levels, experience, activity, badge verification/display choices, and removes or anonymizes normal profiles and closes access. Deletion markers and necessary audits prevent restoration or reuse. Necessary transactions, refunds, complaints or legal records stay separately with restricted purposes; required evidence is not unlawfully destroyed.

Where enabled organization/resources require database integrity, applicable rules may transfer ownership to a custodian unable to sign in. This does not permit continued business or enable future functions prematurely.

## 13. Minors

Meet local and chosen provider/game age requirements. Follow guardian-consent procedures where required. Mainland children under 14 receive special protections. Without the legally required process, restrictions cannot be bypassed. No fixed global age substitutes for mandatory regional rules.

## 14. Security

We use HTTPS, restricted service bindings, necessary session isolation, OAuth state and one-time challenges, password hashing, production encryption of sensitive secrets, certificate checks, rate limits, access controls and audits. Hosting/encryption does not prevent necessary authorized operator processing or guarantee zero risk.

We do not ask you to send support third-party passwords, Cookies, full card details or verification secrets. Leaks, alteration or loss trigger applicable remediation, records, assessment, reporting and necessary notices.

## 15. AI

Private content is not by default sent to general-purpose third-party AI for review, support analysis or training. Planned Bilibili signatures use a versioned static vocabulary, not runtime LLM generation. Unreviewed draft vocabulary does not open linking.

Future AI processing will first disclose providers, data, purposes, regions, retention/training and choices. Future allowance descriptions do not authorize sending private content to models.

## 16. Advertising

This Policy does not authorize undisclosed tracking. Future contextual sponsorship must label paid content and limit necessary context such as language, page or category, excluding private files, chats and sensitive data. Long-term cross-site profiling requires separate notice and choices, not account sign-in or theme preference.

## 17. EEA and UK

Free services may be accessible from other regions. Applicable data protection rights are handled as required. Paid services are not actively offered to the EEA or UK; expansion requires appropriate assessments/arrangements. This Policy does not itself establish compliance with all local duties.

## 18. United States and other regions

Where other privacy laws apply, required access, correction, deletion, copies, opt-outs and appeals are provided. Free public access neither automatically invokes every framework nor removes duties that do apply.

## 19. Sale and advertising sharing

Nexa does not sell personal information as its business model or conduct cross-context behavioral advertising through sign-in, community links or levels. Future changes will update notices and implement necessary choice, opt-out or consent mechanisms first.

## 20. Updates

Important changes to purposes, data, providers, transfers, AI, advertising, retention or rights update this Policy with appropriate notice. Processing requiring new consent is not authorized merely by editing text. Old 1.0 acceptance and notice records remain tied to that version.

The legal page provides 1.1 content, original downloads and SHA-256 digests; 1.0 and earlier versions are archived. Digests trace supplied content and do not replace valid consent.

## 21. Contact

Privacy and rights: `privacy@pcln.top`  
Support: `support@pcln.top`  
Security: `security@pcln.top`  
Legal and intellectual property: `legal@pcln.top`

Processor: **Xie Jiangmao (谢江懋), an individual operating as Nexa / PCL N**.
