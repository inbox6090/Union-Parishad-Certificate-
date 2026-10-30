import React, { useState } from 'react';
import { AdminAuthModal } from './AdminAuthModal';
import { useAuth } from '../hooks/useAuth';

export interface AdminGuardProps {
  children:React.ReactNode;
  allowedRoles?:Array<'super_admin'|'chairman'|'secretary'|'member'|'developer'>;
  title?:string; description?:string; fallback?:React.ReactNode;
}
// This controls navigation visibility only. Every privileged HTTP/Firestore
// operation must independently check verified Firebase token claims server-side.
export const AdminGuard:React.FC<AdminGuardProps>=({
  children,allowedRoles,title='সুরক্ষিত কর্মকর্তা প্যানেল',
  description='অনুমোদিত Firebase Staff সেশন দিয়ে লগইন প্রয়োজন।',fallback
})=>{
  const {session}=useAuth();
  const [open,setOpen]=useState(false);
  const isStaff=session.isAuthenticated && session.role!=='citizen';
  const allowed=isStaff && (!allowedRoles?.length || allowedRoles.includes(session.role as NonNullable<AdminGuardProps['allowedRoles']>[number]));
  if(allowed)return <>{children}</>;
  if(fallback)return <>{fallback}</>;
  return (
    <section className="max-w-2xl mx-auto my-12 rounded-xl border border-amber-200 bg-white p-6 text-center space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600">{description}</p>
      <p className="text-xs text-amber-800">PIN, Quick Login বা LocalStorage-এ সংরক্ষিত ভূমিকা দিয়ে এই অংশ খোলা যাবে না।</p>
      <button type="button" onClick={()=>setOpen(true)}
        className="rounded-lg bg-emerald-900 px-5 py-3 font-semibold text-white">
        Firebase Staff Login
      </button>
      <AdminAuthModal isOpen={open} onClose={()=>setOpen(false)} />
    </section>
  );
};
export function withAdminGuard<P extends object>(
  Component:React.ComponentType<P>,
  allowedRoles?:AdminGuardProps['allowedRoles'],
  guardOptions?:{title?:string;description?:string}
) {
  const Wrapped:React.FC<P>=(props)=>(
    <AdminGuard allowedRoles={allowedRoles} title={guardOptions?.title} description={guardOptions?.description}>
      <Component {...props}/>
    </AdminGuard>
  );
  Wrapped.displayName=`withAdminGuard(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}
