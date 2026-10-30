import { useState, useEffect } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth, logoutUserFromFirebase } from '../firebase';
import { trustedAdminRecord } from '../lib/trustedStaffRole';

export type UserRole = 'citizen' | 'udc' | 'secretary' | 'chairman' | 'super_admin' | 'developer' | 'member';
export interface UserSession {
  email:string; name:string; role:UserRole; designation?:string;
  phone?:string; nid?:string; photoUrl?:string; isAuthenticated:boolean;
}
const guest: UserSession = {
  email:'',name:'সম্মানিত নাগরিক (গেস্ট)',role:'citizen',
  designation:'সাধারণ নাগরিক',isAuthenticated:false
};

// Staff authorization is derived solely from Firebase Auth ID-token claims.
export function useAuth() {
  const [session,setSession]=useState<UserSession>(guest);
  useEffect(()=>{
    let active=true;
    let version=0;
    const unsubscribe=onIdTokenChanged(auth,async firebaseUser=>{
      const request=++version;
      if (!firebaseUser) { if(active) setSession(guest); return; }
      try {
        const {claims}=await firebaseUser.getIdTokenResult();
        if (!active || request!==version) return;
        const staff=trustedAdminRecord(firebaseUser,claims);
        setSession({
          email:firebaseUser.email || '',
          name:firebaseUser.displayName || 'সম্মানিত নাগরিক',
          role:staff?.role || 'citizen',
          designation:staff?.designation || 'সাধারণ নাগরিক',
          photoUrl:firebaseUser.photoURL || undefined,
          isAuthenticated:true,
        });
      } catch {
        // Never restore a privileged role from localStorage on token errors.
        if(active && request===version) setSession(guest);
      }
    });
    return ()=>{active=false;version++;unsubscribe();};
  },[]);

  // Retain this legacy API signature without permitting client privilege escalation.
  const switchRole=(newRole:UserRole)=>{
    if(newRole!==session.role) console.warn('Switching privileged roles requires Firebase reauthentication and trusted server-issued claims.');
  };
  const logout=()=>{void logoutUserFromFirebase().catch(()=>setSession(guest));};
  return {
    session,role:session.role,user:session,
    isAuthenticated:session.isAuthenticated,
    isCitizen:session.role==='citizen',
    isUdc:session.role==='udc' || session.role==='member',
    isSecretary:session.role==='secretary',
    isChairman:session.role==='chairman',
    isSuperAdmin:session.role==='super_admin',
    isDeveloper:false,
    switchRole,logout,
  };
}
