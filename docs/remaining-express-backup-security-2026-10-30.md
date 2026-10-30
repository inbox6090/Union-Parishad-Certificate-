# Remaining Express API, backup and external gateway security — Draft PR #11

## Current source audit (2026-10-30; no production access)

The repository's existing Express entrypoint `server.ts` contains read/write endpoints for admin configuration, user records, certificate generation, scanning NID images, private citizen search, batch certificate verification, audit dashboards, backup/restore, project cloning, API keys, webhooks, spreadsheet integrations and external certificate lists. Most lacked `requireAuth`, and some exposed full citizen/certificate data.

The legacy external v1 helper allowed a query-string API key and returned success if no keys were configured. A production-like shared API key was also embedded in the source code. **Any key already in source or git history must be treated as compromised and rotated/revoked by authorized administrators** if ever used in a real system; removing it from a new commit does not erase history.

## This branch's proposed change

- Install a central `/api` middleware before every application API route. An explicit method+path matrix is required for all requests. Unrecognized API paths/methods return 404 by default.
- For all nonpublic allowed methods: use Firebase Admin SDK `verifyIdToken(token, true)` and signed `role`/`roles` claims only. Never trust client-provided role, email, PIN, localStorage or API key alone.
- Authenticated access: citizen's own application detail and user self-sync (separate owner validation already exists). Staff: admin dashboard read-only endpoints, NID search, batch verification, AI assistant and external certificate list. Approver: issuance/generation, external certificate application and approval decisions. Admin: backup creation, export, restore, project clone, config modifications, API keys, webhooks and external integration operations.
- Public allowlist: health, certificate types, narrow `/api/public/config`, public single QR verification (`/api/certificate/verify/:certNo`, `/api/v1/certificates/verify/:memoNo`), and legacy citizen `POST /api/applications/submit`.
- Replace public full `/api/admin/config` read with a field-allowlisted `/api/public/config`. Update public application shell to merge the safe union branding with defaults.
- Empty the hard-coded API-key seed; remove key-in-query support; require a configured `x-api-key` as an EXTRA check on external list/apply requests after Firebase token/role checks. Missing configuration now fails closed.

## Test design

- `tests/remaining-api-policy.test.ts`: public list/role matrix, spoofing negatives, HTTP method/path confusion, static enumeration requiring every declared `/api` route be classified.
- `tests/remaining-api-http.test.mjs`: Node's local-only built server, no production credentials, assert 401 from 28 representative private/admin/backup/export/external routes, invalid tokens fail, and public health/service list/config/QR/basic citizen submission remain accessible.
- `.github/workflows/remaining-api-security.yml`: pinned actions, read-only permissions, Node 22, npm ci, unit tests, lint/build and local server negative tests.
- Existing `npm-build-ci` and `api-authz-ci` should remain successful.

## Explicit limitations / migration gates

**Do not merge or deploy before all of these are addressed and tested:**

1. Current admin UI components often call `/api/admin/**`, backups, trends and external integrations using ordinary `fetch`, without `Authorization: Bearer <Firebase ID token>`. Those requests will now fail closed. Migrate every authorized staff client to `authenticatedApiFetch` and show appropriate denial/re-authentication states.
2. Public AI chatbot now needs trusted staff authorization to avoid unrestricted third-party API expenditure. If public citizen AI assistance must be restored, build a separately budgeted, rate-limited, abuse-protected design with explicit approval, before enabling.
3. External API clients using only legacy x-api-key or query-string key will receive 401. Integrators must migrate to verified Firebase ID token + approved role and optionally x-api-key, or to a separately reviewed service-to-service access model (not implemented).
4. Role provisioning from a trusted Admin SDK system remains required; the Draft PR #9 UI change alone does NOT grant real roles or verify staging.
5. All backup/restore requests are now admin-only, but backup correctness, source/destination validation, restore dry-run, storage ACLs, object integrity and webhook SSRF still require independent tests. A valid admin token does not make arbitrary uploaded archives trustworthy.
6. The existing in-memory certificate/application stores, seeded demo records and lack of persistent durable transactions are not fixed.
7. Public anonymous submission remains a separate high-risk surface (abuse prevention, size/schema validation, idempotency response). Legacy unverified UID ownership migration must be performed only after separate identity verification.
8. Existing Git history may contain a live-looking API key. Authorized administrators must audit/rotate/revoke actual credentials in affected systems. Do not paste keys into PRs or logs.
9. Confirm which Firebase rules/database are actually deployed, stage backups/restore and role authorization tests, then obtain human review and explicit go-live approval. `main` branch currently has no enforced protection.

This branch makes **no production Firebase calls**, external AI/API calls, backup operations on real data, deploys or merges.
