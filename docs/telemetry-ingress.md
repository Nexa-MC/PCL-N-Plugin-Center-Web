# Independent machine ingress

The owner selected the existing `nexa-telemetry` Worker with the custom domain `botonly.pcln.top`. The configured routes are:

- `POST https://botonly.pcln.top/v1/events` for anonymous launcher telemetry.
- `POST https://botonly.pcln.top/webhooks/wp_wh/live` for signed Waffo production webhooks.

`workers.dev` remains enabled for existing telemetry clients. The gateway does not expose account, administration, test-payment or checkout routes. Binding `API` still targets `nexa-api`; there is no second data store, merchant key or account session on this Worker. Browser credentials and internal launcher authority are stripped. Telemetry keeps the existing API schema, 64 KiB bound and per-IP rate limit. Production webhooks preserve the original body/signature, target only the isolated production handler, and remain subject to its RSA, store, environment, replay and entitlement checks.

Use `Deploy native telemetry ingress` with the exact verified `master` SHA after `node --test scripts/telemetry-ingress.test.mjs` and a Wrangler dry-run. `scripts/deploy-native-ingress.mjs` reads the existing binding/domain metadata before deploying only this Worker and its owner-approved custom domain. An unrelated binding/domain conflict stops deployment. Cloudflare manages the custom-domain DNS record and certificate. It does not alter the website's security settings, global Workers subdomain or payment credentials.

## Edge admission and cutover

A custom domain inside `pcln.top` is still subject to the zone's applicable security policy. It must not be described as automatically exempt from Bot Fight Mode. Read-only inspection on 2026-10-24 (`actions/runs/40072733426`) confirmed basic Bot Fight Mode is enabled (`fight_mode: true`). Cloudflare's basic mode does not support custom-rule path exceptions. This deployment does not disable that zone-wide mode or buy another plan.

The deployment separately reports Worker/domain publication and external admission. Invalid empty telemetry must reach API validation and return 400 JSON; an invalid webhook signature must reach the production handler and return 401 with `x-nexa-webhook: waffo-live`. HTML, redirects, challenges and 403 fail admission. No synthetic aggregates, payment, refund or payout is created by these probes. If the custom domain is challenged, keep financial readiness closed and report the actual response instead of treating a successful deploy as a working callback.

After those checks pass, update launcher clients to the new telemetry URL and configure the Waffo production destination to the new webhook URL. The launcher implementation is not in these three repositories, so this change does not claim to have changed a launcher endpoint. Preserve the previous `workers.dev` telemetry gateway until client rollout is verified.
