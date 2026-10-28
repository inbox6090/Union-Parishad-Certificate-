# Secure application workflow — rollout checklist (2026-10-28)

## Implemented
- Staff-only authenticated UI for citizen master profile selection and read-only autofill.
- Firestore collection citizenApplicationsV1; owner UID, citizenId, serviceId, schemaVersion, status, timestamps, reason.
- Draft save/resume and atomic submission; owner-scoped status listing.
- Service activation via approvedApplicationServices/{service_XX}, where enabled=true AND formVerified=true; client cannot write approval docs.
- Firestore rules enforce staff custom claim, owner access, limited field schema, immutable submitted status, and no delete.

## IMPORTANT: NOT production-safe yet
The legacy rules in this same file still have unrestricted public read/write on certificates, citizens, configs, apiKeys, webhooks, backups. The new rules DO NOT protect those older collections. A separate audited migration is required before deploying sensitive production data. Do not merge/deploy until this is fixed and existing flows are regression-tested.

No approved service documents are created by this change. Default is disabled. Create approvals only from a trusted Firebase Admin SDK/server with documented sign-off and verified form schemas. The current wizard stores only a short reason field, not a verified full official form; approve services only after adapting and validating their actual required fields.

## Deployment gates
1. Audit and replace all public legacy Firestore rules, including public certificate verification projection and privileged issuance workflow.
2. Provision Firebase Auth custom claim role on authorized staff accounts from a trusted server; never trust localStorage roles.
3. Deploy rules only after emulator allow/deny tests for anonymous, citizen, staff, other staff, and admin.
4. Test citizen read, draft save/resume, duplicate submission, unapproved service, status query, and approval revocation.
5. Run npm ci, npm run lint, npm test, npm run build; manually inspect 320px/375px/768px/1440px screens.
6. Add audited server-side approval/rejection/issuance transition service and append-only audit logs. The current status UI is read-only; those privileged transitions are not implemented.
7. Back up Firestore and define rollback; do not copy or migrate private citizen data from third-party sites.
