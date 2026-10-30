# Express API Firebase authorization remediation — 2026-10-30 (DRAFT)

## Read-only audit: critical findings
1. GET /api/applications listed private citizen applications without any authentication.
2. GET /api/applications/:id returned private details by guessable application ID.
3. POST /api/applications/:id/status and /issue allowed unauthenticated approval and issuance; status and actor were client-supplied.
4. GET /api/certificate/verify/:certNo returned a spread of the FULL private certificate; query admin=true disabled PII masking.
5. GET /api/v1/certificates/verify/:memoNo returned NID, parents' names and address directly to the public.
6. AdminAuthModal/useAuth use client localStorage, quick-role login and hardcoded PIN. Those are **not** trusted Firebase Auth ID token claims.
7. ApplicationStatusLookup and ApplicationQueue did not attach Firebase ID tokens. VerificationPortal fell back to reading whole private certificates from Firestore.
8. Additional routes (other admin, batch verification, backups, API keys, certificate creation and external API) remain outside this focused PR. **They are not certified safe.**

## Proposed changes in this Draft PR
- Middleware uses Firebase Admin SDK verifyIdToken(token, true) to reject invalid/revoked tokens; signed role claims `role` or `roles` decide access, never localStorage/email/body.
- Application list is staff-only; detail is staff or matching `applicantUid === verified uid`. Legacy records without UID are staff-only until migration.
- Operator may review/return applications, not approve/reject/issue. Secretary/approver/chairman/admin may approve; only approved applications can be issued.
- Public QR APIs keep unauthenticated single-certificate lookup for citizen/bank checking, but return **only** memo number, type, issue date, issuing officer, status and validity. `admin=true` cannot elevate public access. No full certificate/PDF or private identifiers.
- Public VerificationPortal renders only this projection and no longer falls back to reading full certificates from Firestore.
- Staff queue sends Firebase ID token and avoids optimistic state updates on failed server authorization.
- Existing local draft/status lookup remains accessible offline for records already on that device.

## Important compatibility and security limitations
- **Public anonymous application submission is preserved** for existing citizen wizard compatibility, but must receive rate limiting, validation, anti-automation, explicit consent and verified UID-binding before live rollout. Existing submit response/idempotency behavior should be reviewed for privacy.
- Citizen application detail on the server now requires Firebase UID ownership. Legacy stored submissions lack `applicantUid` and cannot be read remotely by citizen until a trusted migration occurs. The same-device localStorage fallback is retained for existing users, but clearing browser storage removes that copy.
- Staff must sign in with real Firebase Auth and have server-issued role claims; client-only quick login will **not** pass authorization. Role issuance, revocation and test accounts must be built via a trusted backend before release.
- Public full-certificate printing/download is intentionally removed from the public verification view. Authenticated applicant full-document delivery needs a separate protected endpoint and end-to-end tests.
- Existing seed/sample records and permissive **other** API endpoints are outside this PR; do not assume app-wide security.
- Node/Express in-memory stores are not durable; this PR is not a database migration.
- No live Firebase project, credentials, real citizen data, paid API or production deploy used.

## Verification
- Unit tests `node --import tsx --test tests/api-authz.test.ts` with stubbed token verifier: token failures, signed claims, role enforcement, ownership, legal status changes, public projection privacy.
- Integration smoke tests `node --test tests/api-routes-smoke.test.mjs`: start build server on localhost, ensure anonymous requests to sensitive routes return 401; verify public endpoints with admin=true do not leak sensitive fields.
- New CI workflow is pull-request-only and manual; read-only token, pinned checkout and setup-node, localhost tests, no deploy.
- Existing npm lint/build CI should independently pass.

## Gate before any merge / deploy
1. Green unit, smoke, lint, build on the PR exact head SHA, plus human code review.
2. Implement trusted staff custom-claim provisioning and Firebase Auth citizen login; remove hardcoded PIN and quick admin role authority.
3. Migrate legacy application ownership after appropriate identity verification; test applicant-only access and staff workflows in staging.
4. Review ALL additional unauthenticated Express routes, API key fallbacks, backups, issuance and demo data.
5. Coordinate Firestore PR #5 compatibility, public QR projection publication, public certificate retrieval permissions, and print requirements.
6. Verify deployed Firestore rules, production database IDs, risk of disruption, secure backups and rollback; require separate authorization.
7. Protect main branch with required checks/reviews.

**DRAFT ONLY — do not merge, deploy or claim production-ready.**
