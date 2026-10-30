import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canReadApplication, canChangeStatus, canIssueCertificate, toPublicVerification, hasTrustedRole } from '../src/middleware/api-access.ts';
import { createRequireAuth, requireRole } from '../src/middleware/auth.ts';

const own = { id:'APP-001', applicantUid:'citizen-1', status:'draft' };
const submitted = { ...own, status:'submitted' };
const approved = { ...own, status:'approved' };
const citizen = { uid:'citizen-1', role:'citizen' };
const other = { uid:'citizen-2', role:'citizen' };
const operator = { uid:'operator-1', role:'operator' };
const secretary = { uid:'secretary-1', role:'secretary' };
const approver = { uid:'approver-1', roles:{ approver:true } };
const admin = { uid:'admin-1', role:'admin' };
const spoofed = { uid:'citizen-3', role:'citizen', localStorageRole:'admin', email:'admin@fake.example', body:{role:'admin'} };

test('verified ID token required; missing or malformed bearer token is 401', async () => {
  const middleware = createRequireAuth(async () => ({uid:'citizen-1',role:'citizen'} as any));
  for (const authorization of [undefined,'', 'Bearer', 'Basic abc', 'Bearer  ']) {
    const res=mockResponse(); let next=false;
    await middleware({headers:{authorization}} as any, res as any,()=>{next=true});
    assert.equal(res.statusCode,401); assert.equal(next,false);
  }
});
test('tampered or revoked Firebase tokens are rejected (401)', async () => {
  const middleware = createRequireAuth(async () => { throw new Error('revoked/invalid'); });
  const res=mockResponse();
  await middleware({headers:{authorization:'Bearer forged'}} as any,res as any,()=>{throw new Error('next not expected')});
  assert.equal(res.statusCode,401);
});
test('a verified Firebase identity reaches the route, without trusting a body role', async () => {
  const middleware = createRequireAuth(async () => ({uid:'citizen-1',role:'citizen'} as any));
  const req:any={headers:{authorization:'Bearer valid-token'},body:{role:'admin'}};
  const res=mockResponse(); let called=false;
  await middleware(req,res as any,()=>{called=true});
  assert.equal(called,true); assert.equal(req.user.uid,'citizen-1');
});
test('role guard returns 403 to citizens and grants only signed claims', () => {
  const guard=requireRole('operator','secretary','approver','admin');
  const res=mockResponse(); let called=false;
  guard({user:spoofed} as any,res as any,()=>{called=true});
  assert.equal(res.statusCode,403); assert.equal(called,false);
  const success=mockResponse();
  guard({user:secretary} as any,success as any,()=>{called=true});
  assert.equal(called,true);
});
test('authenticated non-staff can access only own UID-linked application', () => {
  assert.equal(canReadApplication(citizen,own),true);
  assert.equal(canReadApplication(other,own),false);
  assert.equal(canReadApplication(citizen,{...own,applicantUid:undefined}),false);
  assert.equal(canReadApplication(operator,own),true);
  assert.equal(canReadApplication(null,own),false);
});
test('operator may mark under_review but cannot approve, reject, or issue', () => {
  assert.equal(canChangeStatus(operator,'submitted','under_review'),true);
  assert.equal(canChangeStatus(operator,'submitted','approved'),false);
  assert.equal(canChangeStatus(operator,'submitted','rejected'),false);
  assert.equal(canIssueCertificate(operator,approved),false);
});
test('secretary, approver and admin can approve; issuance needs approved state', () => {
  for(const user of [secretary,approver,admin]){
    assert.equal(canChangeStatus(user,'submitted','approved'),true);
    assert.equal(canIssueCertificate(user,approved),true);
    assert.equal(canIssueCertificate(user,submitted),false);
  }
  assert.equal(canIssueCertificate(citizen,approved),false);
});
test('client-provided roles, email strings and localStorage do not grant admin', () => {
  assert.equal(hasTrustedRole(spoofed,'admin'),false);
  assert.equal(canChangeStatus(spoofed,'submitted','approved'),false);
  assert.equal(canIssueCertificate(spoofed,approved),false);
});
test('a public certificate projection never includes name, NID, birth, phone, address, body, attachments', () => {
  const cert={
    memoNo:'BUP-DEMO-1001',typeLabel:'Resident certificate',issueDate:'2026-10-30',
    status:'issued',issuedBy:'Demo signer',citizen:{name:'Private Name',nid:'TEST-NID',mobile:'TEST-PHONE',village:'Test Village'},
    bodyText:'PRIVATE DOCUMENT BODY',extra:{foo:'secret'},attachments:['PRIVATE']
  };
  const publicData=toPublicVerification(cert);
  assert.deepEqual(Object.keys(publicData).sort(),['isValid','issueDate','issuedBy','memoNo','status','typeLabel'].sort());
  assert.equal(JSON.stringify(publicData).includes('TEST-NID'),false);
  assert.equal(JSON.stringify(publicData).includes('Private Name'),false);
  assert.equal(toPublicVerification({...cert,status:'draft'}).isValid,false);
  assert.equal(toPublicVerification({...cert,status:'revoked'}).isValid,false);
});
function mockResponse() {
  return {statusCode:200,body:null,
    status(n){this.statusCode=n;return this},
    json(b){this.body=b;return this}
  };
}
