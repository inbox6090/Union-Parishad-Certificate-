import React,{useState} from 'react';
import {doc,getDoc} from 'firebase/firestore';
import {db} from '../firebase';
import {UnionParishadConfig} from '../types';
type PublicVerification={status:'valid'|'revoked';certificateType:string;issuedOn:string;issuer:string};
export const VerificationPortal:React.FC<{config:UnionParishadConfig}>=({config})=>{
 const [code,setCode]=useState(''),[result,setResult]=useState<PublicVerification|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function verify(e:React.FormEvent){e.preventDefault();setError('');setResult(null);
  const key=code.trim();
  if(!/^[A-Za-z0-9_-]{20,128}$/.test(key)){setError('সনদের QR যাচাই কোড সঠিক নয়');return;}
  setBusy(true);
  try{const snap=await getDoc(doc(db,'publicCertificateVerifications',key));
   if(!snap.exists()){setError('এই কোডে কোনো প্রকাশ্য যাচাই রেকর্ড পাওয়া যায়নি');return;}
   const data=snap.data();
   if(!['valid','revoked'].includes(data.status)||typeof data.certificateType!=='string'||typeof data.issuedOn!=='string'||typeof data.issuer!=='string'){setError('যাচাই তথ্য অসম্পূর্ণ');return;}
   setResult({status:data.status,certificateType:data.certificateType,issuedOn:data.issuedOn,issuer:data.issuer});
  }catch{setError('যাচাই সেবায় সংযোগ করা যাচ্ছে না')}finally{setBusy(false)}
 }
 return <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border bg-white p-5 sm:p-8 text-slate-900">
 <h1 className="text-xl font-bold">সনদের QR যাচাই</h1>
 <p className="text-sm text-slate-600">{config.upName} — শুধুমাত্র প্রকাশ্য যাচাই তথ্য দেখানো হয়। ব্যক্তিগত তথ্য প্রকাশ করা হয় না।</p>
 <form onSubmit={verify} className="space-y-3"><label htmlFor="public-verification-code" className="block font-semibold">QR যাচাই কোড</label><input id="public-verification-code" autoComplete="off" maxLength={128} value={code} onChange={e=>setCode(e.target.value)} className="w-full border rounded-lg p-3" placeholder="সনদের QR যাচাই কোড লিখুন"/><button disabled={busy} className="rounded-lg bg-emerald-800 text-white p-3 disabled:opacity-40">{busy?'যাচাই হচ্ছে…':'যাচাই করুন'}</button></form>
 {error&&<p role="alert" className="text-amber-800">{error}</p>}
 {result&&<div role="status" className="rounded-xl border p-4 space-y-2"><p className="font-bold">{result.status==='valid'?'সনদটি বৈধ':'সনদটি বাতিল'}</p><p>সনদের ধরন: {result.certificateType}</p><p>ইস্যুর তারিখ: {result.issuedOn}</p><p>ইস্যুকারী: {result.issuer}</p></div>}
 <p className="text-xs text-slate-500">পুরোনো স্মারক নম্বরভিত্তিক যাচাইয়ের পরিবর্তে নতুন নিরাপদ QR কোড প্রয়োজন। বিদ্যমান সনদগুলো স্থানান্তরের আগে সংশ্লিষ্ট কর্তৃপক্ষের অনুমোদন আবশ্যক।</p>
 </section>;
};
