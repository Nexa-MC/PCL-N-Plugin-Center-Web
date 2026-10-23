# Native launcher telemetry ingress

The website zone uses Bot Fight Mode and browser integrity checks. Native .NET
clients cannot execute browser challenges. The `nexa-telemetry` Worker therefore
exposes only `POST /v1/events` on its account-owned workers.dev hostname, outside
the website's browser challenge policy. Website protection stays enabled.

The gateway streams to the existing `nexa-api` service binding at
`/api/v1/telemetry/events`. That API still enforces its 64 KiB input limit, finite
event/tier/field schema and per-IP rate limit, and writes the same `nexa-platform`
aggregates read by management. It does not introduce a separate telemetry store.
No account token, cookie, gateway certificate proof or browser authority is
forwarded; no other route is available. Cloudflare's connecting IP is forwarded
only for the API's existing expiring rate-limit keys. It is not an event property.

Use `Deploy native telemetry ingress` with the exact verified `master` SHA after
running `node --test scripts/telemetry-ingress.test.mjs` and the Wrangler dry-run.
This creates/updates only `nexa-telemetry`; it does not deploy the web/management
Workers or change any zone security setting. The deployment reports its public
hostname. Do not change the global Workers subdomain or embed a Cloudflare token
in the launcher.

The launcher's cross-platform ingress probe sends invalid empty arrays: HTTP 400
proves API validation is reached without inserting synthetic events. Confirm the
same result on Windows, Linux and both macOS architectures. Valid event fixtures
must also pass the API's actual receiver, including diagnostic runs and inventory.
