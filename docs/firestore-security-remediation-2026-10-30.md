# Firestore Security Remediation — DRAFT, DO NOT DEPLOY (2026-10-30)

Repository: `inbox6090/Union-Parishad-Certificate-`  
Branch: `security/firestore-rbac-emulator-2026-10-30`  
Scope: Proposed Firestore client security rules, isolated local Emulator tests, and integration audit. **This is not an authorized production security release.**

## Read-only audit: current data/access paths

| Code location | Existing behavior | Risk / migration needed |
|---|---|---|
| `src/firebase.ts`: `saveCertificateToFirebase`, `fetchCertificatesFromFirebase`, `searchCertificateInFirebase` | Client writes and reads **full** `certificates` docs, searches `citizen.nid`; may download whole collection | New rules restrict reads to trusted staff and issuing operations to approver roles. Anonymous QR search against private certificates will no longer work. |
| `src/components/VerificationPortal.tsx` | Public verification falls back to `searchCertificateInFirebase` (full certificate) | Must remove private Firestore fallback, fetch a narrow published record and render its minimal fields. |
| `src/components/CertificateView.tsx` | QR points to `/verify/{memoNo}` | Must migrate QR lookup to an unguessable verification token; legacy memo route can be mapped in a trusted backend after privacy review. |
| `src/components/CertificateApplicationWizard.tsx` | Posts to HTTP `/api/applications/submit` and saves `app_...` to localStorage; no Firebase UID `applicantUid` | Future direct Firestore applications must acquire authenticated UID; anonymous HTTP submission must have server-side validation, rate-limiting and appropriate privacy. |
| `server.ts` `/api/applications`, `/:id`, `/:id/status`, `/:id/issue` | Application list, full details, status update and issuance have no `requireAuth` shown on route | **Critical independent API blocker**; Firestore rules do not govern Express routes or server-side Admin SDK. Require verified ID token + role-specific authorization. |
| `server.ts` `/api/certificate/verify/:certNo` | Returns nearly full certificate; `?admin=true` changes masking without authentication | **Critical independent API blocker**; remove query-driven privilege and return public allowlisted projection only. |
| `src/hooks/useAuth.ts`, `src/components/AdminAuthModal.tsx`, `AdminGuard.tsx` | Roles and quick login are based on localStorage, client role switching, and client-side PIN literals | **Critical identity blocker**. These values MUST NOT authorize data access; remove quick/PIN authentication for real admin workflows, verify Firebase identity server-side and set role claims with trusted Admin SDK. |
| `src/firebase.ts` admin/bootstrap | Auto-seeds default administrators from the browser; admins are identified by email | New `admins` rule requires trusted admin claims. Move bootstrap/role grants to protected backend. |
| `src/firebase.ts` backup/config/audit clients | Direct Firestore `backups`, `configs`, `audit_logs`, `admins` access | New rules deliberately restrict these operations; update calls to authenticated role-aware services before rollout. |

Audit is based on repository source only, NOT on current Firebase Production deployed rules or database contents. The existing default `firestore.rules` (before this PR) had explicit `|| true` write/read conditions and public private data reads. Its catch-all deny did not override more specific allow rules.

## Proposed role model (Firebase signed custom claims ONLY)

Roles used in Emulator tests: `citizen`, `operator`, `secretary`, `approver`, `admin`, plus `anonymous`. Compatible aliases for trusted claims: `udc`, `chairman`, `super_admin`. The client-set `developer` role is NOT privileged automatically.

A trusted Admin SDK must set `role` (or boolean `roles` map) on verified accounts. **Do not** accept roles from email strings, client localStorage, HTTP request JSON, a self-writable Firestore profile, or an unauthenticated admin list.

The proposed `firestore.rules` uses:
- `certificates`: staff read, operator draft editing only, approver issuance and admin deletion; no public reads.
- `applications`: signed UID owner can read their own records and edit draft-only permitted fields. Staff can see queues. Operator transitions limited; approver/secretary can approve; admin has special permissions.
- `citizens`: staff read/write, admin delete.
- `public_verifications/{certId}`: public get, no list; narrow allowlisted fields `memoNo`, `typeLabel`, `issueDate`, `issuedBy`, `status`. Public cannot write; only trusted approver can publish.
- `public_configs/union`: public union identity only, no private config.
- `configs`: internal only. `apiKeys`, `webhooks`, `configs/secrets`: client denied; trusted server only. `backups`, `admins`: admin only.
- `audit_logs`: staff read; self-attributed append-only traces. Official audit entries should be signed server-side.

**Critical:** Rules validate client writes but do NOT constrain Admin SDK writes. Trusted issuance code MUST write only public allowlisted fields to `public_verifications`. Do not copy full `CertificateRecord` or put NID, birth number, phone, address, name, family data or document scans in public documents.

## Emulator testing: development ONLY

```sh
npm install --prefix security-tests --ignore-scripts --no-audit --no-fund --no-package-lock
./security-tests/node_modules/.bin/firebase emulators:exec --only firestore \
  --project demo-baheratail-rules --config security-tests/firebase.json \
  "node --test security-tests/firestore.rules.test.mjs"
```

The test code rejects non-local `FIRESTORE_EMULATOR_HOST`. Firebase CLI uses project name beginning with `demo-` and test-only data. **Never run `firebase deploy` as part of this security PR.** CI runs the same command under an unprivileged `contents: read` workflow token, on a standard hosted runner.

Test tooling has exact **direct** package versions in `security-tests/package.json`; a transitive lockfile has not yet been committed. Until a separately reviewed lockfile is generated, installation is not fully reproducible. Do not run `--force` or bypass peer-dependency conflicts.

## Required migration and release gates (ALL before production)

1. Confirm actual Firebase project/database IDs, current deployed rules, data paths, and deployment permissions using authorized read-only procedures. Audit live rules independently.
2. Fix unauthenticated Express HTTP endpoints and the public verification response; add API integration tests and prevent querystring `admin=true` from granting privilege.
3. Replace quick/PIN/localStorage admin decisions with Firebase Auth verified identity and trusted Admin SDK custom claims; test claim refresh and role removal.
4. Introduce `applicantUid` owner linkage for new application records. Build a tested migration for existing records and ensure citizen/staff workflows do not unexpectedly fail.
5. Create `public_verifications` by trusted issuance code with minimal published fields and high-entropy lookup IDs; update `VerificationPortal` and QR generation; support legacy certificates through vetted migration.
6. Validate staff/backups/configs/approval workflows, plus Firebase Emulator negative tests for each relevant role. Confirm the Firestore database ID matches the target ruleset.
7. Review current database backup, staged rollout plan, rollback capability, availability impact and production access controls; obtain explicit approval from an authorized human.
8. Configure protected `main` branch and required review/CI status; no direct production deployment.

A green npm build or Firestore Emulator suite is **necessary but not sufficient** for a production-safe release.

## Important limitation

The security change is intentionally **fail closed** and can block current frontend flows, because current applications and roles do not yet meet the strict auth/owner contract. Keep this PR Draft and do not merge it until the separate integration blockers are resolved or explicitly addressed via a staged migration. No production Firebase or paid AI API calls have been made.
