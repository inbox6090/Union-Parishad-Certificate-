import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {readFileSync} from 'node:fs';
import {describe,it,beforeAll,afterAll,beforeEach} from 'vitest';
import {doc,getDoc,setDoc,updateDoc,deleteDoc,collection,getDocs} from 'firebase/firestore';
let env:any;
const admin={role:'admin'},operator={role:'operator'},citizen={role:'citizen'};
const sample={id:'a1',ownerUid:'operator1',citizenId:'c1',serviceId:'service_01',status:'draft',schemaVersion:'2026-10-28',fieldValues:{reason:'test'},createdAt:'2026-10-28',updatedAt:'2026-10-28'};
beforeAll(async()=>{env=await initializeTestEnvironment({projectId:'demo-union-security',firestore:{rules:readFileSync('firestore.rules','utf8')}})});
afterAll(async()=>{await env.cleanup()});
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async({firestore}:any)=>{
 await setDoc(doc(firestore,'approvedApplicationServices/service_01'),{enabled:true,formVerified:true});
 await setDoc(doc(firestore,'citizenProfilesV2/c1'),{id:'c1',name:'Test',createdBy:'operator1'});
 await setDoc(doc(firestore,'citizenApplicationsV1/a1'),sample);
 await setDoc(doc(firestore,'certificates/private1'),{citizen:{nid:'0000000000'},status:'approved'});
 await setDoc(doc(firestore,'publicCertificateVerifications/token1'),{status:'valid',typeLabel:'নাগরিকত্ব সনদ',issuedAt:'2026-10-28'});
 await setDoc(doc(firestore,'apiKeys/secret'),{key:'sensitive'});
 })});
const db=(uid?:string,claims?:Record<string,unknown>)=>uid?env.authenticatedContext(uid,claims).firestore():env.unauthenticatedContext().firestore();
describe('deny by default and QR projection',()=>{
 it('anonymous cannot read private certificates or secrets',async()=>{await assertFails(getDoc(doc(db(),'certificates/private1')));await assertFails(getDoc(doc(db(),'apiKeys/secret')))});
 it('public may fetch a single QR projection but cannot enumerate or write',async()=>{await assertSucceeds(getDoc(doc(db(),'publicCertificateVerifications/token1')));await assertFails(getDocs(collection(db(),'publicCertificateVerifications')));await assertFails(setDoc(doc(db(),'publicCertificateVerifications/fake'),{status:'valid'}))});
 it('ordinary signed-in user cannot read staff records',async()=>{await assertFails(getDoc(doc(db('user1',citizen),'citizens/c1')));await assertFails(getDoc(doc(db('user1',citizen),'certificates/private1')))});
 it('operator can read certificates but cannot approve or delete',async()=>{await assertSucceeds(getDoc(doc(db('operator1',operator),'certificates/private1')));await assertFails(updateDoc(doc(db('operator1',operator),'certificates/private1'),{status:'approved'}));await assertFails(deleteDoc(doc(db('operator1',operator),'certificates/private1')))});
 it('admin can read protected administrative records',async()=>{await assertSucceeds(getDoc(doc(db('admin1',admin),'apiKeys/secret')))});
 it('owner can read draft but other staff cannot',async()=>{await assertSucceeds(getDoc(doc(db('operator1',operator),'citizenApplicationsV1/a1')));await assertFails(getDoc(doc(db('operator2',operator),'citizenApplicationsV1/a1')))});
 it('owner may submit once but cannot edit submitted application',async()=>{await assertSucceeds(updateDoc(doc(db('operator1',operator),'citizenApplicationsV1/a1'),{status:'submitted',submittedAt:'2026-10-28',updatedAt:'2026-10-28'}));await assertFails(updateDoc(doc(db('operator1',operator),'citizenApplicationsV1/a1'),{status:'draft'}))});
 it('non-admin cannot create service approvals',async()=>{await assertFails(setDoc(doc(db('operator1',operator),'approvedApplicationServices/service_02'),{enabled:true,formVerified:true}))});
});
