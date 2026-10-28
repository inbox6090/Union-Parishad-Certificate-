# Firestore security audit and migration — 2026-10-28

## Critical findings
- Previous firestore.rules file was malformed (truncated regular expression, duplicated trailing blocks) and contained unconditional allow read/write for certificates, citizens, configs, apiKeys, webhooks, backups.
- Legacy role lookup used Firestore users/{uid}.role; client-editable roles are not a trustworthy authorization source. New rules use Firebase Auth custom claim role exclusively.
- Legacy public verification searched private certificates, exposing full record fields. Replaced the UI with a read-only projection collection.

## Implemented in this branch
- Replaced entire firestore.rules with deny-by-default, staff-only citizen profiles and application drafts, admin-only legacy certificate writes, staff-only citizen writes, admin-only config writes, no client access to apiKeys/webhooks/backups/configs/secrets.
- Added publicCertificateVerifications/{opaqueRandomId}: public GET only; no list or client writes. Backend must publish sanitized fields only: status, certificateType, issuedOn, issuer. Do NOT publish PII. Generate cryptographically unpredictable IDs server-side.
- Replaced public VerificationPortal with projection lookup; old memo lookup and bulk verification removed pending migration.
- Added firebase.json, node:test + @firebase/rules-unit-testing tests, npm run test:firestore.

## Regression and deployment blockers
- NOT executed: npm install, lint, build, Firestore Emulator test suite. No live Firebase deployment or production mutation.
- Old client saveCertificateToFirebase and batch restore are now admin-only; operator/UDC paths will be denied. Must move writes behind privileged server and re-test.
- Old public certificate search and memo-based verification no longer work in the new UI. Existing QR codes must be reissued or securely mapped server-side to opaque IDs before deployment.
- Public dashboard/pending count, citizen search, configuration reads, backups, integrations may fail unless migrated to server endpoints or staff-authenticated calls.
- Firestore custom claims must be provisioned securely for staff. Auth users without claims lose private access.
- Service approval documents remain server-managed and are not auto-created.
- Separate server-side issuance/revocation pipeline must publish/revoke sanitized public projections. This branch DOES NOT implement that pipeline.
- Firestore rules do not protect privileged Admin SDK / server endpoints; audit backend routes, service account permissions, storage.rules, API logs, and secrets separately.
- Existing app has legacy client-side localStorage admin sessions; they are not authorization. Some legacy screens may still show controls but Firestore will deny their calls.
- Test dependencies and lockfile need synchronization. firebase.json emulator requires Java and Firebase CLI.

## Required acceptance tests before merge
1. npm ci (after lockfile update), npm run lint, npm test, npm run build, npm run test:firestore.
2. Emulator allow/deny matrix: anonymous, unclaimed auth, operator, secretary, chairman, admin; owner and non-owner; create, get, list, update, delete.
3. Verify public projection never contains PII; audit server publication and revocation.
4. Exercise legacy citizen CRUD, certificate create/approval, pending dashboard, settings, backup, bulk verify and existing QR scans.
5. Reconcile breaking changes and introduce server-mediated migration with backup and rollback. No deployment until human approval.
