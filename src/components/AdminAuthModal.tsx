import React, { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import {
  auth, signInWithGooglePopup, logoutUserFromFirebase, formatFirebaseAuthError,
} from '../firebase';
import type { AdminUserRecord } from '../types';
import { trustedAdminRecord } from '../lib/trustedStaffRole';

interface AdminAuthModalProps {
  isOpen:boolean;
  onClose:()=>void;
  onAdminAuthenticated?:(user:AdminUserRecord|null)=>void;
}
export const AdminAuthModal:React.FC<AdminAuthModalProps>=({
  isOpen,onClose,onAdminAuthenticated,
})=>{
  const [record,setRecord]=useState<AdminUserRecord|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    let serial=0;
    const unsub=onIdTokenChanged(auth,async user=>{
      const request=++serial;
      if (!user) {
        if(active){setRecord(null);setLoading(false);onAdminAuthenticated?.(null);}
        return;
      }
      setLoading(true);
      try {
        const token=await user.getIdTokenResult();
        if(!active || request!==serial)return;
        const verifiedRecord=trustedAdminRecord(user,token.claims);
        setRecord(verifiedRecord);
        onAdminAuthenticated?.(verifiedRecord);
      } catch {
        if(active && request===serial){setRecord(null);onAdminAuthenticated?.(null);}
      } finally {
        if(active && request===serial)setLoading(false);
      }
    });
    return ()=>{active=false;serial++;unsub();};
  },[onAdminAuthenticated]);

  const login=async ()=>{
    setError(null);setLoading(true);
    try {
      const user=await signInWithGooglePopup();
      // Force retrieval of newly issued claims after sign-in; only server grants roles.
      const result=await user.getIdTokenResult(true);
      const staff=trustedAdminRecord(user,result.claims);
      setRecord(staff);
      onAdminAuthenticated?.(staff);
      if(!staff) setError('আপনার Firebase পরিচয় যাচাই হয়েছে, কিন্তু Staff role অনুমোদন নেই। প্রশাসকের সঙ্গে যোগাযোগ করুন।');
      else onClose();
    }catch(e){setError(formatFirebaseAuthError(e));}
    finally{setLoading(false);}
  };
  const refresh=async()=>{
    setLoading(true);setError(null);
    try {
      const user=auth.currentUser;
      if(!user)throw Error('প্রথমে Firebase Login করুন।');
      const token=await user.getIdTokenResult(true);
      const staff=trustedAdminRecord(user,token.claims);
      setRecord(staff);onAdminAuthenticated?.(staff);
      if(!staff)setError('এই অ্যাকাউন্টে বিশ্বস্ত Staff role claim নেই।');
    }catch(e){setError(formatFirebaseAuthError(e));}
    finally{setLoading(false);}
  };
  const logout=async()=>{
    setError(null);setLoading(true);
    try {
      await logoutUserFromFirebase();
      setRecord(null);
      onAdminAuthenticated?.(null);
    }catch(e){setError(formatFirebaseAuthError(e));}
    finally{setLoading(false);}
  };
  if(!isOpen)return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Firebase staff authentication"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">নিরাপদ কর্মকর্তা লগইন</h2>
          <button type="button" className="text-slate-600 font-bold" onClick={onClose}>বন্ধ করুন</button>
        </div>
        <p className="text-sm text-slate-600">Google Firebase Auth দিয়ে লগইন করুন। শুধু সার্ভার কর্তৃক নির্ধারিত Custom Claims অনুযায়ী কর্মকর্তা প্রবেশাধিকার পাবেন।</p>
        {record ? (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm">
            <p className="font-semibold">{record.name}</p>
            <p>{record.email}</p>
            <p>যাচাইকৃত ভূমিকা: {record.role}</p>
          </div>
        ) : (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
            কোনো Staff role যাচাই হয়নি। পুরোনো PIN, Quick Login ও LocalStorage সেশন এখন আর প্রবেশাধিকার দেয় না।
          </p>
        )}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-col gap-2">
          <button type="button" disabled={loading} onClick={login}
            className="rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
            Google Firebase দিয়ে সাইন ইন
          </button>
          <button type="button" disabled={loading} onClick={refresh}
            className="rounded-xl border border-slate-300 px-4 py-2 font-medium">
            অনুমতি পুনরায় যাচাই
          </button>
          {auth.currentUser && <button type="button" disabled={loading} onClick={logout}
            className="rounded-xl border border-red-300 px-4 py-2 text-red-700">সাইন আউট</button>}
        </div>
        <p className="text-xs text-slate-500">প্রবেশাধিকার সেট করতে অনুমোদিত Administrator-এর নিরাপদ Firebase Admin SDK লাগবে। এই পৃষ্ঠায় নিজে Role নির্বাচন করা যায় না।</p>
      </div>
    </div>
  );
};
