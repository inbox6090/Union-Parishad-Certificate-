import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { before, beforeEach, after, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

const host = process.env.FIRESTORE_EMULATOR_HOST || '';
if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host)) {
  throw new Error('FIRESTORE_EMULATOR_HOST must point to a local emulator; refusing non-emulator tests.');
}

const ruleFile = fileURLToPath(new URL('../firestore.rules', import.meta.url));
let env;
const auth = (role, uid = role + '-uid') => env.authenticatedContext(uid, { role }).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const ref = (db, path) => doc(db, path);
const application = (uid = 'citizen-a', status = 'draft') => ({
  applicantUid: uid, applicantName: 'Test Applicant', serviceId: 'residence', status,
  updatedAt: '2026-10-30', fieldValues: {},
});
const verification = (id = 'BUP-2026-1001') => ({
  memoNo: id, typeLabel: 'Residence', issueDate: '2026-10-30',
  issuedBy: 'Authorized Officer', status: 'issued',
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-baheratail-rules',
    firestore: { rules: readFileSync(ruleFile, 'utf8') },
  });
});
after(async () => { if (env) await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await Promise.all([
      setDoc(ref(db, 'certificates/private-1'), {
        memoNo: 'private-1', status: 'issued', citizen: { nid: 'TEST-DO-NOT-PUBLISH' }
      }),
      setDoc(ref(db, 'citizens/citizen-1'), { name: 'Private Citizen', nid: 'TEST-NID' }),
      setDoc(ref(db, 'applications/app-a'), application('citizen-a', 'draft')),
      setDoc(ref(db, 'applications/app-submitted'), application('citizen-a', 'submitted')),
      setDoc(ref(db, 'public_verifications/BUP-2026-1001'), verification()),
      setDoc(ref(db, 'configs/master_config'), { unionName: 'Test Union', internalSetting: 'secret' }),
      setDoc(ref(db, 'admins/admin-1'), { email: 'not-real@example.invalid', role: 'admin' }),
      setDoc(ref(db, 'backups/backup-1'), { encryptedBlob: 'TEST' }),
      setDoc(ref(db, 'audit_logs/log-1'), { actorUid: 'operator-uid', action: 'create' }),
      setDoc(ref(db, 'users/citizen-a'), { role: 'admin', displayName: 'Spoofed role doc' }),
      setDoc(ref(db, 'public_configs/union'), { unionName: 'Test Union' }),
    ]);
  });
});

test('anonymous can get a narrow published QR verification record', async () => {
  const snap = await assertSucceeds(getDoc(ref(anon(), 'public_verifications/BUP-2026-1001')));
  if (!snap.exists() || snap.data().status !== 'issued') throw new Error('Missing public verification record');
});
test('anonymous cannot enumerate public verification records', async () => {
  await assertFails(getDocs(collection(anon(), 'public_verifications')));
});
test('anonymous cannot read private certificate, citizen or application', async () => {
  const db = anon();
  for (const path of ['certificates/private-1', 'citizens/citizen-1', 'applications/app-a']) {
    await assertFails(getDoc(ref(db, path)));
  }
});
test('anonymous cannot write certificates, citizens, applications, configs or backups', async () => {
  const db = anon();
  await assertFails(setDoc(ref(db, 'certificates/forged'), { memoNo: 'forged', status: 'issued' }));
  await assertFails(setDoc(ref(db, 'citizens/forged'), { nid: 'FAKE' }));
  await assertFails(setDoc(ref(db, 'applications/forged'), application('guest')));
  await assertFails(setDoc(ref(db, 'configs/master_config'), { hacked: true }));
  await assertFails(setDoc(ref(db, 'backups/forged'), { test: true }));
});
test('anonymous cannot create public QR verification or modify issued record', async () => {
  const db = anon();
  await assertFails(setDoc(ref(db, 'public_verifications/BUP-2026-2002'), verification('BUP-2026-2002')));
  await assertFails(updateDoc(ref(db, 'public_verifications/BUP-2026-1001'), { status: 'revoked' }));
});
test('citizen reads own application and not another applicant application', async () => {
  const db = auth('citizen', 'citizen-a');
  await assertSucceeds(getDoc(ref(db, 'applications/app-a')));
  await assertFails(getDoc(ref(db, 'applications/other-person')));
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(ref(ctx.firestore(), 'applications/other-person'), application('citizen-b'));
  });
  await assertFails(getDoc(ref(db, 'applications/other-person')));
});
test('citizen can query only their own applications', async () => {
  const db = auth('citizen','citizen-a');
  await assertSucceeds(getDocs(query(collection(db, 'applications'), where('applicantUid', '==', 'citizen-a'))));
  await assertFails(getDocs(collection(db, 'applications')));
});
test('citizen may create own draft, not impersonate others or self approve', async () => {
  const db = auth('citizen','citizen-a');
  await assertSucceeds(setDoc(ref(db, 'applications/new-draft'), application('citizen-a')));
  await assertFails(setDoc(ref(db, 'applications/impersonated'), application('citizen-b')));
  await assertFails(setDoc(ref(db, 'applications/self-approved'), application('citizen-a','approved')));
});
test('citizen can edit own draft contact fields but cannot change protected fields', async () => {
  const db = auth('citizen', 'citizen-a');
  await assertSucceeds(updateDoc(ref(db, 'applications/app-a'), { applicantName: 'Corrected Name' }));
  await assertFails(updateDoc(ref(db, 'applications/app-a'), { status: 'approved' }));
  await assertFails(updateDoc(ref(db, 'applications/app-a'), { applicantUid: 'citizen-b' }));
  await assertFails(updateDoc(ref(db, 'applications/app-submitted'), { applicantName: 'After submission' }));
});
test('citizen cannot read master register or write issued certificate', async () => {
  const db = auth('citizen','citizen-a');
  await assertFails(getDoc(ref(db, 'citizens/citizen-1')));
  await assertFails(getDoc(ref(db, 'certificates/private-1')));
  await assertFails(updateDoc(ref(db, 'certificates/private-1'), { status: 'revoked' }));
});
test('user profile role field does not grant administrator privileges', async () => {
  const db = auth('citizen','citizen-a');
  await assertFails(getDoc(ref(db, 'backups/backup-1')));
  await assertFails(getDoc(ref(db, 'admins/admin-1')));
});
test('operator reads and updates citizen register but cannot approve submitted application', async () => {
  const db = auth('operator');
  await assertSucceeds(getDoc(ref(db,'citizens/citizen-1')));
  await assertSucceeds(updateDoc(ref(db,'citizens/citizen-1'), { name:'Corrected staff entry' }));
  await assertSucceeds(updateDoc(ref(db,'applications/app-submitted'), { status:'under_review' }));
  await assertFails(updateDoc(ref(db,'applications/app-submitted'), { status:'approved' }));
});
test('operator may save draft certificates but not forge issued or overwrite issued ones', async () => {
  const db = auth('operator');
  await assertSucceeds(setDoc(ref(db,'certificates/draft-1'), {memoNo:'draft-1',status:'draft'}));
  await assertFails(setDoc(ref(db,'certificates/issued-forged'), {memoNo:'issued-forged',status:'issued'}));
  await assertFails(updateDoc(ref(db,'certificates/private-1'), {status:'draft'}));
});
test('secretary and approver can process approvals and issue certificates', async () => {
  for (const role of ['secretary','approver']) {
    const db = auth(role);
    await assertSucceeds(updateDoc(ref(db,'applications/app-submitted'), {status:'approved'}));
    await assertSucceeds(setDoc(ref(db,'certificates/issued-'+role), {memoNo:'issued-'+role,status:'issued'}));
  }
});
test('approver can publish only approved narrow verification fields, not citizen identifiers', async () => {
  const db = auth('approver');
  await assertSucceeds(setDoc(ref(db,'public_verifications/BUP-2026-2002'), verification('BUP-2026-2002')));
  await assertFails(setDoc(ref(db,'public_verifications/BUP-2026-2003'), {
    ...verification('BUP-2026-2003'), nid:'TEST-NID'
  }));
  await assertFails(setDoc(ref(db,'public_verifications/BUP-2026-2004'), {
    ...verification('BUP-2026-2004'), citizen:{name:'Private'}
  }));
  await assertFails(setDoc(ref(db,'public_verifications/BUP-2026-2005'), {
    ...verification('BUP-2026-2005'), status:'draft'
  }));
});
test('public verification memo number is immutable on update', async () => {
  await assertFails(updateDoc(ref(auth('approver'),'public_verifications/BUP-2026-1001'), {memoNo:'OTHER'}));
});
test('admin can manage backups and admins; operator cannot', async () => {
  const admin = auth('admin'), operator = auth('operator');
  await assertSucceeds(getDoc(ref(admin,'backups/backup-1')));
  await assertSucceeds(setDoc(ref(admin,'backups/backup-2'), {createdAt:'2026-10-30'}));
  await assertSucceeds(getDoc(ref(admin,'admins/admin-1')));
  await assertSucceeds(deleteDoc(ref(admin,'citizens/citizen-1')));
  await assertFails(getDoc(ref(operator,'backups/backup-1')));
  await assertFails(getDoc(ref(operator,'admins/admin-1')));
});
test('admin and staff can write authentic audit entries only, and cannot rewrite them', async () => {
  const operator = auth('operator');
  await assertSucceeds(setDoc(ref(operator,'audit_logs/new-log'), {actorUid:'operator-uid',action:'review'}));
  await assertFails(setDoc(ref(operator,'audit_logs/forged-log'), {actorUid:'admin-uid',action:'review'}));
  await assertFails(updateDoc(ref(operator,'audit_logs/log-1'), {action:'erase'}));
  await assertFails(deleteDoc(ref(auth('admin'),'audit_logs/log-1')));
});
test('all clients denied direct secrets, keys and webhook access', async () => {
  for(const db of [anon(),auth('citizen'),auth('operator'),auth('secretary'),auth('approver'),auth('admin')]){
    await assertFails(getDoc(ref(db,'apiKeys/key-1')));
    await assertFails(setDoc(ref(db,'webhooks/hook-1'),{secret:'test'}));
    await assertFails(getDoc(ref(db,'configs/secrets')));
  }
});
test('public config get only, not list or unauthorized write', async () => {
  await assertSucceeds(getDoc(ref(anon(),'public_configs/union')));
  await assertFails(getDocs(collection(anon(),'public_configs')));
  await assertFails(setDoc(ref(anon(),'public_configs/union'),{unionName:'Forged'}));
});
test('unrecognized role and mere login have no staff authority', async () => {
  for(const db of [auth('developer'),auth('unknown'),env.authenticatedContext('no-role').firestore()]){
    await assertFails(getDoc(ref(db,'citizens/citizen-1')));
    await assertFails(getDoc(ref(db,'backups/backup-1')));
  }
});
