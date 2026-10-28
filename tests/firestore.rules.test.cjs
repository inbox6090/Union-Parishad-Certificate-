const {describe,it,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,collection,updateDoc,deleteDoc}=require('firebase/firestore');
let env;
const projectId='demo-firestore-security';
beforeEach(async()=>{
 env=await initializeTestEnvironment({projectId,firestore:{rules:fs.readFileSync('firestore.rules','utf8')}});
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();
  await setDoc(doc(db,'certificates','private1'),{name:'PRIVATE',nid:'1234567890'});
  await setDoc(doc(db,'publicCertificateVerifications','public1'),{status:'valid',certificateType:'নাগরিকত্ব',issuedOn:'2026-10-28',issuer:'Union Parishad'});
  await setDoc(doc(db,'citizenProfilesV2','cit1'),{id:'cit1',name:'Citizen',createdBy:'staff1'});
  await setDoc(doc(db,'approvedApplicationServices','service_01'),{enabled:true,formVerified:true});
  await setDoc(doc(db,'citizenApplicationsV1','draft1'),{id:'draft1',serviceId:'service_01',citizenId:'cit1',ownerUid:'staff1',status:'draft',schemaVersion:'2026-10-28',fieldValues:{reason:'test'},createdAt:'2026-10-28',updatedAt:'2026-10-28'});
 });
});
afterEach(async()=>{await env.cleanup()});
const anon=()=>env.unauthenticatedContext().firestore();
const staff=(uid='staff1',role='operator')=>env.authenticatedContext(uid,{role}).firestore();
describe('Firestore least privilege',()=>{
 it('denies anonymous private certificate and citizen reads/writes',async()=>{
  await assertFails(getDoc(doc(anon(),'certificates','private1')));
  await assertFails(getDoc(doc(anon(),'citizens','cit1')));
  await assertFails(setDoc(doc(anon(),'certificates','hacked'),{status:'approved'}));
  await assertFails(deleteDoc(doc(anon(),'certificates','private1')));
 });
 it('denies secret/config/backups to anonymous and non-admin',async()=>{
  for(const path of ['apiKeys/k','webhooks/w','backups/b','configs/master_config','configs/secrets/key']){
   await assertFails(getDoc(doc(anon(),path)));
   await assertFails(setDoc(doc(staff(),path),{secret:'x'}));
  }
 });
 it('allows only sanitized public verification projection',async()=>{
  await assertSucceeds(getDoc(doc(anon(),'publicCertificateVerifications','public1')));
  await assertFails(getDocs(collection(anon(),'publicCertificateVerifications')));
  await assertFails(setDoc(doc(anon(),'publicCertificateVerifications','new'),{status:'valid'}));
 });
 it('prevents staff modifying issued certificate or public verification',async()=>{
  await assertFails(updateDoc(doc(staff(),'certificates','private1'),{status:'approved'}));
  await assertFails(setDoc(doc(staff(),'publicCertificateVerifications','fake'),{status:'valid'}));
 });
 it('allows own draft and rejects other owner',async()=>{
  await assertSucceeds(getDoc(doc(staff(),'citizenApplicationsV1','draft1')));
  await assertFails(getDoc(doc(staff('staff2'),'citizenApplicationsV1','draft1')));
  await assertFails(updateDoc(doc(staff('staff2'),'citizenApplicationsV1','draft1'),{status:'submitted'}));
 });
 it('denies citizen profile to anonymous and allows staff',async()=>{
  await assertFails(getDoc(doc(anon(),'citizenProfilesV2','cit1')));
  await assertSucceeds(getDoc(doc(staff(),'citizenProfilesV2','cit1')));
 });
});
