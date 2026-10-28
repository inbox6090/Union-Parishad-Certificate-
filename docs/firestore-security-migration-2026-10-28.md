# Firestore hardening migration — deployment blocker

## Audit findings
- The previous firestore.rules was syntactically corrupted: a truncated match statement, duplicated collection blocks and an unmatched suffix. It could not be safely deployed.
- Legacy /certificates, /citizens, /configs, /apiKeys, /webhooks, /backups previously used unconditional allow true. These are now denied to anonymous users.
- Role checks previously trusted /users/{uid}.role, which could be spoofed if writable. Replaced with Firebase Auth custom claim only.
- Public QR verification must not fetch private certificate documents. Added read-by-token-only /publicCertificateVerifications/{token}; no public list and no client writes.

## Known regressions / rollout
This change deliberately breaks unauthenticated legacy Firebase certificate search, citizen directory, dashboard count and any client-side configuration writes. The public verification UI now uses a separate projection and **does not** accept old memo numbers. Existing QR links must be migrated. Existing server /api/certificate/verify and /api/certificate/verify-batch endpoints may still return private fields and must be audited independently; do not advertise complete privacy until that server work is finished.

Staff client-side approval may fail for operator roles; move approvals/issuance to a trusted server with audit logging. Public projections are **not populated** automatically by this change; a trusted backend must generate cryptographically unpredictable tokens, publish minimal fields after final authorization, revoke projections on cancellation, and migrate old QR codes. Do not publish NID, mobile, full address, full citizen records or raw certificate documents.

## Required pre-deployment checks
1. `npm install` (lockfile must be updated in a controlled environment).
2. `npx firebase emulators:exec --only firestore "npm run test:rules"` with Java installed.
3. `npm run lint && npm test && npm run build`.
4. Confirm Firebase Auth custom claims for each staff role; test token refresh.
5. Inventory every Firestore collection and client query in production, compare permission matrix, and migrate clients/server routes.
6. Confirm old verification links and public APIs cannot expose PII; build trusted token issuance/revocation backend.
7. Stage with nonproduction data, back up data, confirm rollback and then request explicit production deployment approval.

**Status:** Code committed for review. Tests have not been executed. Do not deploy rules to production until blockers are resolved.
