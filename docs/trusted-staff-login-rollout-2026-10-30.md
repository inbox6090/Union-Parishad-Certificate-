# Trusted Staff Firebase Auth rollout — DRAFT / NO DEPLOY

This branch addresses the two Critical UI blockers from the Express Security Audit. It does **not** create live accounts, assign live claims, migrate citizen data or deploy new rules.

## Read-only audit
- `src/components/AdminAuthModal.tsx` allowed hard-coded client PINs and one-click role assignment. A localStorage item `bup_active_admin_session` was accepted as privileged session.
- `src/hooks/useAuth.ts` elevated any Firebase user to secretary by default, or developer based solely on email, and let `switchRole` persist arbitrary staff roles.
- `src/components/AdminGuard.tsx` accepted an unverified localStorage record. `src/components/RbacQuickActions.tsx` also let a user select staff roles by clicking a tab.
- `src/firebase.ts` auto-created default admins from the browser if the admins collection was empty, and the shared Google provider requested unrelated Chat/Drive/Sheets scopes for staff login.
- Server middleware already verifies ID tokens and trusted role claims, but client UI did not derive roles from those claims.

## Proposed change
- `AdminAuthModal`: Firebase Google login only. Extract trusted claims using `getIdTokenResult(true)` on login; explicit role refresh. No PIN, hardcoded account selection, localStorage or client-write privilege.
- `useAuth` and `AdminGuard`: Firebase `onIdTokenChanged` as the identity source; guest by default, fail closed on error or sign-out. `switchRole` is no longer an authority to grant roles.
- `RbacQuickActions`: display the verified role, remove manual role switching.
- `firebase.ts`: read-only empty admin list instead of client seeding; minimal Google sign-in scopes for staff; separate Workspace login retains its own permissions.
- `trustedStaffRoleFromClaims`: allowlisted role values only, with explicit boolean roles map. Unknown, developer, localStorage and email guesses do not grant staff.
- `scripts/provision-staff-claims.mjs`: offline DRY-RUN by default; an explicit --apply plus project, UID, role and ROLE_CHANGE_APPROVED=YES are all required for the network-changing operation. This script has **not** been run with --apply.

## Separately authorized real staff role provisioning (NOT PERFORMED)
1. Select the correct **staging Firebase project** and verified staff identity. Never supply secret keys in browser/chat/GitHub. Use approved service identity/ADC only on a protected admin workstation.
2. Review who can approve role grants, UID, project ID, and least-privilege role. Store a signed approval separately from the repository.
3. Inspect available claims and conflicting role maps. After confirmation, run dry-run and independently review its printed project/UID suffix; then explicitly approve an apply operation.
4. To revoke/change roles, review refresh-token invalidation and session expiration behavior, and test effective denials. Do not treat email or Firestore /admins records as authoritative.
5. Enable/configure Firebase Google provider and authorized domains in staging, with explicit approval. This repository change does not alter Firebase console settings.

## Remaining scope: High priority
- **Legacy UID migration:** only bind `application.applicantUid` after authoritative identity proof. Never infer ownership from an application number, NID, phone, name, caller-supplied UID or email alone. Use staged dry-run, backup, idempotent verified mapping, collision/replay detection, audit log and rollback.
- **Anonymous submission:** existing `/api/applications/submit` is still public for citizen compatibility. Implement schema/size/attachment validation; rate limiting on a trustworthy proxy/client-IP boundary; idempotency key scoped to verified applicant or anonymous submission proof; non-disclosing 429/400 responses; no new paid CAPTCHA/third-party API by default.
- **Remaining Express routes:** independent audit of `/api/admin/**`, `/api/certificate/generate`, batch verification, `/api/v1/certificates/apply`, backup/restore, sync, and API-key fallback. Ensure role check for each mutation and public projection for each intentionally public route.
- **Staging E2E:** citizen Google login -> consent & submit -> own private status only -> staff queue -> approver issuance -> public narrow QR verification -> other citizen denied. Include role revocation and browser reload/offline cases.

## Critical release gate
- No permissions from localStorage, PIN, editable Firestore profile, or email alone.
- Production Firebase custom claims **not assigned**; real Firebase login/role assignment integration not verified.
- Role change may break existing demo flows. Test stage account provisioning, affected views, full admin workflows and fallback errors before any merge.
- `main` still requires protected branch/ruleset and required security checks.
- Other legacy components, API routes, and anonymous submission remain under audit; this PR does not certify complete system security.

**No merge, deploy, production credential use, production API access, paid API or user data migration.**
