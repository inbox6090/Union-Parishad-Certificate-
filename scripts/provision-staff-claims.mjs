#!/usr/bin/env node
// Controlled Firebase Admin custom-claim provisioning. NEVER run in browser or CI.
// Default is dry-run: no Google/Firebase network access, even if env vars exist.
const approvedRoles=new Set(['operator','secretary','approver','chairman','admin','super_admin']);
const args=new Set(process.argv.slice(2));
const apply=args.has('--apply');
const project=process.env.APPROVED_FIREBASE_PROJECT_ID || '';
const uid=process.env.APPROVED_FIREBASE_UID || '';
const role=process.env.APPROVED_FIREBASE_ROLE || '';
if (!project || !uid || !approvedRoles.has(role)) {
  console.error('Required env: APPROVED_FIREBASE_PROJECT_ID, APPROVED_FIREBASE_UID, APPROVED_FIREBASE_ROLE (approved staff role).');
  process.exitCode=2;
} else if (!apply) {
  console.log('[DRY RUN] Project: '+project+'; approved UID suffix: '+uid.slice(-4)+'; role: '+role);
  console.log('No Firebase connection or role changes occurred. Requires separate authorized human approval.');
} else if (process.env.ROLE_CHANGE_APPROVED!=='YES') {
  console.error('Refusing changes: set ROLE_CHANGE_APPROVED=YES only after written authorization and target verification.');
  process.exitCode=2;
} else {
  const { initializeApp, applicationDefault }=await import('firebase-admin/app');
  const { getAuth }=await import('firebase-admin/auth');
  const app=initializeApp({credential:applicationDefault(),projectId:project});
  const adminAuth=getAuth(app);
  // Verify target exists. Never grant role by email-only or client request.
  const user=await adminAuth.getUser(uid);
  const existing=user.customClaims || {};
  if (existing.roles && Object.keys(existing.roles).length>0) {
    throw new Error('Existing roles map needs explicit migration review; refusing to leave elevated parallel grants.');
  }
  if (existing.role && existing.role!==role && process.env.APPROVED_ROLE_REPLACEMENT!=='YES') {
    throw new Error('Changing an existing role requires separate APPROVED_ROLE_REPLACEMENT=YES authorization.');
  }
  await adminAuth.setCustomUserClaims(uid,{...existing,role});
  // Does not revoke other sessions automatically; enforce verifyIdToken(token,true)
  // and revokeRefreshTokens(uid) in an approved revocation/change procedure.
  console.log('Role claim set for verified UID suffix '+uid.slice(-4)+' in project '+project);
}
