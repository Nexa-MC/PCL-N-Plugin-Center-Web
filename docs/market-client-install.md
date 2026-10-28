# Market installation through NexaCL

The website never downloads market package files. Themes expose an **Install in
NexaCL** link: `nexacl://extension/NexaMcMarketPage?argument=<item-id>`.
Only an ASCII item ID is transmitted; no credentials, URLs, file paths or commands.
A normal browser protocol confirmation may appear. Users without the client can
follow `/download`. Alpha 15 and earlier do not implement this extension handoff;
a compatible Host and Cloud Market Sidecar build are required.

The Sidecar opens theme details, checks ownership with the API, downloads and
verifies the SHA-256, then offers an explicit Apply theme action. Host performs
NTP validation and activation. Plugin package upload, release submission and
download are temporarily disabled on the API as well as in the interface.
Existing ownership records are retained.

Client account sign-in uses device codes. `/device?user_code=XXXX-XXXX` preserves
the code through website sign-in, displays the current account and asks for
explicit approval or rejection. Browser passwords and MFA remain website-only.
The device secret is never passed through this page.

Deploy Auth migration 0025 and its Worker, then the API with private
STORE_ARTIFACTS R2 storage, then Web. Web uses the actual store routes; paid
checkout remains closed independently of this installation change.
