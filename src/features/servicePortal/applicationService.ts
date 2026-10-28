import {collection,doc,getDoc,getDocs,query,where,runTransaction,serverTimestamp} from 'firebase/firestore';
import {auth,db} from '../../firebase';
import {ApplicationDraft,validateApplication} from './applicationModel';
const APPLICATIONS='citizenApplicationsV1';
async function currentUser(){const user=auth.currentUser;if(!user)throw Error('Firebase লগইন প্রয়োজন');const token=await user.getIdTokenResult();const role=token.claims.role;if(!['admin','developer','chairman','secretary','operator','udc'].includes(String(role)))throw Error('অনুমোদিত কর্মীর ভূমিকা প্রয়োজন');return user;}
export async function isServiceApproved(serviceId:string):Promise<boolean>{
 await currentUser();
 const s=await getDoc(doc(db,'approvedApplicationServices',serviceId));
 return s.exists()&&s.data().enabled===true&&s.data().formVerified===true;
}
export async function listMyApplications():Promise<ApplicationDraft[]>{
 const user=await currentUser();
 const rows=await getDocs(query(collection(db,APPLICATIONS),where('ownerUid','==',user.uid)));
 return rows.docs.map(d=>d.data() as ApplicationDraft).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
export async function saveApplicationDraft(input:Pick<ApplicationDraft,'id'|'serviceId'|'citizenId'|'fieldValues'>):Promise<void>{
 const user=await currentUser();
 if(!await isServiceApproved(input.serviceId))throw Error('সেবাটি এখনো অনুমোদিত ও যাচাইকৃত নয়');
 const now=new Date().toISOString();
 const ref=doc(db,APPLICATIONS,input.id);
 await runTransaction(db,async tx=>{
  const prior=await tx.get(ref);
  if(prior.exists()&&(prior.data().ownerUid!==user.uid||prior.data().status!=='draft'))throw Error('শুধু নিজের খসড়া সম্পাদনা করা যায়');
  const createdAt=prior.exists()?prior.data().createdAt:now;
  const record:ApplicationDraft={...input,ownerUid:user.uid,status:'draft',schemaVersion:'2026-10-28',createdAt,updatedAt:now};
  const errors=validateApplication(record);if(errors.length)throw Error(errors.join('; '));
  tx.set(ref,record);
 });
}
export async function submitApplication(id:string):Promise<void>{
 const user=await currentUser();const ref=doc(db,APPLICATIONS,id);
 await runTransaction(db,async tx=>{
  const snapshot=await tx.get(ref);
  if(!snapshot.exists())throw Error('খসড়া পাওয়া যায়নি');
  const data=snapshot.data() as ApplicationDraft;
  if(data.ownerUid!==user.uid||data.status!=='draft')throw Error('আবেদন ইতিমধ্যে জমা হয়েছে বা অনুমতি নেই');
  const approval=await tx.get(doc(db,'approvedApplicationServices',data.serviceId));
  if(!approval.exists()||approval.data().enabled!==true||approval.data().formVerified!==true)throw Error('সেবা অনুমোদিত নয়');
  const citizen=await tx.get(doc(db,'citizenProfilesV2',data.citizenId));
  if(!citizen.exists())throw Error('নাগরিক প্রোফাইল পাওয়া যায়নি');
  tx.update(ref,{status:'submitted',updatedAt:new Date().toISOString(),submittedAt:new Date().toISOString()});
 });
}
