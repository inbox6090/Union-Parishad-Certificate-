import {collection,doc,getDocs,query,orderBy,setDoc} from 'firebase/firestore';
import {auth,db} from '../../firebase';
import {CitizenInput,CitizenProfile,validateCitizen} from './model';
const COLLECTION='citizenProfilesV2';
export async function listCitizenProfiles():Promise<CitizenProfile[]> {
 if (!auth.currentUser) throw new Error('Firebase লগইন প্রয়োজন');
 const snapshot=await getDocs(query(collection(db,COLLECTION),orderBy('createdAt','desc')));
 return snapshot.docs.map(d=>d.data() as CitizenProfile);
}
export async function createCitizenProfile(input:CitizenInput):Promise<CitizenProfile> {
 const user=auth.currentUser;
 if (!user) throw new Error('Firebase লগইন প্রয়োজন');
 const errors=validateCitizen(input);
 if(errors.length) throw new Error(errors.join('; '));
 const id=crypto.randomUUID(), now=new Date().toISOString();
 const record:CitizenProfile={...input,id,createdBy:user.uid,createdAt:now,updatedAt:now};
 await setDoc(doc(db,COLLECTION,id),record);
 return record;
}
