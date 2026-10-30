# Remaining Express API and Backup/Restore security review — 2026-10-30

**DRAFT / DO NOT MERGE / DO NOT DEPLOY.** Audit from GitHub repository source. No production Firebase, external service, citizen data, API tokens, or paid AI API accessed.

## Confirmed bypasses in base main

- `/api/admin/**` lacked route-wide Firebase ID token verification. Reading private certificates, API keys, webhooks and exports, triggering backups/restore/project clone, making approvals, and modifying config were publicly reachable by HTTP.
- `/api/v1/certificates` and `/api/v1/certificates/apply` trusted a hardcoded default API key, including query-string input. Old `checkApiKey` returned true when no active keys existed; revoking all keys **opened** access.
- `/api/citizen/search` returned private citizen demographics without any token.
- `/api/certificate/generate`, `/api/certificate/scan-nid`, and `/api/certificate/verify-batch` had no staff guard. Batch verification returned full private `CertificateRecord`. Generate/scan operations can call AI services.
- `/api/ai/assistant` allowed anonymous calls to a potentially cost-bearing upstream model.
- `GET /api/users` verified login but not a staff/admin role.
- Public web app loaded its public-facing union configuration by fetching `/api/admin/config`, which returned the entire private configuration.

## Proposed fail-closed route policy

| Routes | Authentication and authorization |
|---|---|
| `GET /api/health`, `GET /api/certificate/types` | Public, no private records |
| `GET /api/certificate/verify/:certNo`, `GET /api/v1/certificates/verify/:memoNo` | Public **single-certificate, minimal metadata projection** from prior security PR |
| `GET /api/public/config` | Public allowlist: union name, address, upazila/district and public office metadata only; no secret fields |
| `POST /api/applications/submit` | Existing anonymous workflow preserved, **abuse prevention remains separate blocker** |
| `/api/applications`, status, issue | Previous Firebase token/role + UID ownership policy unchanged |
| `/api/admin/**` | Require Firebase Admin verified, revocation-checked ID token and trusted staff role |
| `/api/admin/backup*`, `/api/admin/backups`, `/api/admin/restore`, `/api/admin/project-clone/**`, `/api/admin/maintenance/**`, `/api/admin/api-keys/**`, `/api/admin/webhooks/**`, `/api/admin/export`, `/api/admin/apps-script-sync`, `/api/admin/sheets-export` | **Admin/super_admin only** |
| `GET/POST /api/admin/config` | Admin/super_admin only; public client reads only `/api/public/config` allowlist |
| `/api/admin/approve-cert`, `/api/admin/cancel-cert`, `/api/admin/batch-approve` | Secretary, approver, chairman, admin, super_admin only; approval integrity review still needed |
| `GET /api/users` | Admin/super_admin only |
| `/api/citizen/search`, `/api/certificate/scan-nid`, `/api/certificate/verify-batch` | Verified staff roles |
| `POST /api/certificate/generate` | Verified approver roles (conservative to prevent unrestricted certificate issuance) |
| `POST /api/ai/assistant` | Require verified Firebase token, including citizen token; **per-user quotas not yet implemented** |
| `/api/v1/certificates`, `/api/v1/certificates/apply` | Verified Firebase staff role; **legacy API-key-only clients will be rejected** |
| `POST /api/users/sync` | Existing verified self-UID login still allowed |

Browser localStorage roles, email strings, direct HTTP `role` fields and the retired default `x-api-key` are **never** accepted to bypass these rules.

## Test approach

- `tests/remaining-private-api-smoke.test.mjs`: local production build server only, require HTTP 401 for forty unauthenticated sensitive routes, including `x-api-key` bearing the old exposed key. Public type, QR lookup, and narrow public config remain usable.
- PR-triggered `remaining-api-security-ci.yml` executes `npm ci`, `npm run lint`, `npm run build` and local HTTP regression tests without Firebase credentials, production databases, external networking or deployment steps. Existing Firestore Emulator, API authorization and build workflows should also pass.

## Remaining **merge/deploy blockers**

1. Public code still contains **legacy API-key management**; new keys issued from `/api/admin/api-keys` are currently inert for v1 auth. Refactor integration clients onto verified Firebase Bearer tokens or a separate revocable machine-identity scheme. Never restore hardcoded/query-string keys or an 'open access if no keys' fallback.
2. No positive staging tests with actual signed operator/admin Firebase tokens and revocation; tests prove anonymous denial but cannot prove permitted staff operations behave correctly. Run Firebase Auth Emulator or staging with authorized fake users before merge.
3. Backup export and restore still use in-memory stores/partially unvalidated JSON, and admin-controlled outbound webhook, Apps Script, R2 and Sheets URLs may permit SSRF or unintended export. Add strict schema limits, vetted HTTPS host allowlists, idempotent restore, immutable audit and secure storage with recovery.
4. The approval/cancellation/batch routes now derive the actor from verified Firebase UID. `approve-cert` no longer accepts fake client-side biometric proof and records `biometricVerified: false`. However, verified WebAuthn evidence, separation of duties, audit integrity and human approval policy require separate implementation before authoritative issuance.
5. Anonymous application submit remains open and requires size/schema validation, abuse/rate limits, replay/idempotency protection and verified citizen UID migration.
6. `/api/ai/assistant` is authenticated, but **cost/rate quota protection is still necessary** for any key-enabled production deployment.
7. App components that fetch admin, export, backup, or external v1 APIs without bearer tokens will get 401 until they adopt `authenticatedApiFetch`, backed by provisioned Firebase staff claims. The new /api/public/config is adopted by App for public-facing base configuration.
8. Current production Firebase rules, services, backup restore readiness and complete staging Citizen -> Approval -> Certificate -> QR flow have NOT been validated. Maintain fail-closed behavior and deploy only with explicit human approval after resolving blockers.

**Never merge or production deploy solely on green CI.** Separate security PRs may have been merged into main; review actual deployed state before any release.
