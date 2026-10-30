import test from 'node:test';
import assert from 'node:assert/strict';
import { trustedStaffRoleFromClaims, trustedAdminRecord } from '../src/lib/trustedStaffRole.ts';

test('unverified guest / missing claims cannot become staff', () => {
  assert.equal(trustedStaffRoleFromClaims({}),null);
  assert.equal(trustedStaffRoleFromClaims({role:'citizen'}),null);
  assert.equal(trustedStaffRoleFromClaims({role:'developer'}),null);
  assert.equal(trustedStaffRoleFromClaims({role:'unknown'}),null);
});
test('signed staff claims map to the matching legacy UI role',()=>{
  assert.equal(trustedStaffRoleFromClaims({role:'operator'}),'member');
  assert.equal(trustedStaffRoleFromClaims({role:'udc'}),'member');
  assert.equal(trustedStaffRoleFromClaims({role:'secretary'}),'secretary');
  assert.equal(trustedStaffRoleFromClaims({role:'approver'}),'secretary');
  assert.equal(trustedStaffRoleFromClaims({role:'chairman'}),'chairman');
  assert.equal(trustedStaffRoleFromClaims({role:'admin'}),'super_admin');
  assert.equal(trustedStaffRoleFromClaims({role:'super_admin'}),'super_admin');
});
test('only explicitly true signed roles map grants privileges',()=>{
  assert.equal(trustedStaffRoleFromClaims({roles:{super_admin:true}}),'super_admin');
  assert.equal(trustedStaffRoleFromClaims({roles:{operator:'true'}}),null);
  assert.equal(trustedStaffRoleFromClaims({roles:{admin:1}}),null);
});
test('email / localStorage / supplied profile role cannot promote someone',()=>{
  assert.equal(trustedStaffRoleFromClaims({email:'admin@somewhere.example',localStorageRole:'admin'}),null);
  assert.equal(trustedStaffRoleFromClaims({customData:{role:'admin'}}),null);
});
test('provisional staff UI is unavailable when claims are absent',()=>{
  const rec=trustedAdminRecord({uid:'test-uid',email:'test@example.invalid',displayName:'Test',photoURL:null}, {email_verified:true});
  assert.equal(rec,null);
});
test('trusted display record has role from claims, not metadata',()=>{
  const rec=trustedAdminRecord({uid:'test-uid',email:'test@example.invalid',displayName:'Test',photoURL:null},{role:'secretary',admin:true});
  assert.equal(rec?.role,'secretary');
  assert.equal(rec?.uid,'test-uid');
  assert.equal(rec?.email,'test@example.invalid');
});
