import React,{useState} from 'react';
import {doc,getDoc} from 'firebase/firestore';
import {db} from '../../firebase';
type PublicResult={status:'valid'|'revoked';typeLabel:string;issuedAt:string};
export function PublicQrVerification(){
 const [token,setToken]=useState(''),[result,setResult]=useState<PublicResult|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function verify(e:React.FormEvent){e.preventDefault();setError('');setResult(null);
  const value=token.trim();
  if(!/^[a-zA-Z0-9_-]{20,128}$/.test(value)){setError('সঠিক QR যাচাইকরণ টোকেন লিখুন');return;}
  setBusy(true);
  try{const snap=await getDoc(doc(db,'publicCertificateVerifications',value));
   if(!snap.exists()){setError('এই টোকেনের কোনো প্রকাশ্য যাচাইকরণ রেকর্ড পাওয়া যায়নি');return;}
   const d=snap.data();
   if(!['valid','revoked'].includes(d.status)||typeof d.typeLabel!=='string'||typeof d.issuedAt!=='string'){setError('যাচাইকরণ রেকর্ড অসম্পূর্ণ');return;}
   setResult({status:d.status,typeLabel:d.typeLabel,issuedAt:d.issuedAt});
  }catch{setError('যাচাইকরণ সেবা এই মুহূর্তে পাওয়া যাচ্ছে না')}finally{setBusy(false)}
 }
 return <section className="max-w-xl mx-auto rounded-2xl border bg-white dark:bg-slate-900 p-5 sm:p-8 space-y-4">
  <h2 className="font-bold text-xl">পাবলিক QR সনদ যাচাই</h2>
  <p className="text-sm text-slate-600 dark:text-slate-300">সনদের QR-এ থাকা পৃথক যাচাইকরণ টোকেন দিন। ব্যক্তিগত তথ্য এখানে প্রকাশ করা হয় না। পুরোনো স্মারক নম্বরের জন্য সংশ্লিষ্ট অফিসে যোগাযোগ করুন।</p>
  <form onSubmit={verify} className="space-y-3"><label className="block text-sm font-medium">যাচাইকরণ টোকেন<input value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" maxLength={128} className="block w-full mt-2 border rounded-lg p-3 bg-transparent" placeholder="QR token" /></label><button disabled={busy} className="min-h-11 rounded-lg bg-emerald-800 text-white px-5 disabled:opacity-50">{busy?'যাচাই হচ্ছে...':'যাচাই করুন'}</button></form>
  {error&&<p role="alert" className="text-red-700">{error}</p>}
  {result&&<div role="status" className="rounded-lg bg-slate-100 text-slate-900 p-4"><p className="font-bold">{result.status==='valid'?'সনদটি বৈধ':'সনদটি বাতিল করা হয়েছে'}</p><p>সনদের ধরন: {result.typeLabel}</p><p>ইস্যুর তারিখ: {result.issuedAt}</p></div>}
 </section>;
}
