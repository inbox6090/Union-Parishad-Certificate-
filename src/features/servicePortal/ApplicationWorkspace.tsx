import React,{useEffect,useState} from 'react';
import {onAuthStateChanged} from 'firebase/auth';
import {auth} from '../../firebase';
import {CitizenProfile} from '../citizenMaster/model';
import {listCitizenProfiles} from '../citizenMaster/service';
import {ApplicationDraft,STATUS_LABELS} from './applicationModel';
import {isServiceApproved,listMyApplications,saveApplicationDraft,submitApplication} from './applicationService';
import {PublicService} from './catalog';
export function ApplicationWorkspace({service,onClose}:{service:PublicService;onClose:()=>void}){
 const [user,setUser]=useState(auth.currentUser),[citizens,setCitizens]=useState<CitizenProfile[]>([]);
 const [selectedId,setSelectedId]=useState(''),[reason,setReason]=useState(''),[id,setId]=useState('');
 const [records,setRecords]=useState<ApplicationDraft[]>([]),[approved,setApproved]=useState(false);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 async function refresh(){setLoading(true);setError('');try{
  const [profiles,applications,allowed]=await Promise.all([listCitizenProfiles(),listMyApplications(),isServiceApproved(service.id)]);
  setCitizens(profiles);setRecords(applications);setApproved(allowed);
 }catch(e){setError(e instanceof Error?e.message:'তথ্য আনা যায়নি')}finally{setLoading(false)}}
 useEffect(()=>{if(user)void refresh();else{setCitizens([]);setRecords([]);setLoading(false)}},[user?.uid,service.id]);
 const selected=citizens.find(c=>c.id===selectedId);
 async function save(){setBusy(true);setError('');setNotice('');try{
  const draftId=id||crypto.randomUUID();
  await saveApplicationDraft({id:draftId,serviceId:service.id,citizenId:selectedId,fieldValues:{reason}});
  setId(draftId);setNotice('খসড়া নিরাপদে Firestore-এ সংরক্ষিত হয়েছে');await refresh();
 }catch(e){setError(e instanceof Error?e.message:'সংরক্ষণ ব্যর্থ')}finally{setBusy(false)}}
 async function submit(){if(!id)return;setBusy(true);setError('');try{await submitApplication(id);setNotice('আবেদন জমা হয়েছে');setId('');await refresh()}catch(e){setError(e instanceof Error?e.message:'জমা ব্যর্থ')}finally{setBusy(false)}}
 return <div className="space-y-4"><div className="flex justify-between gap-3"><h3 className="font-bold text-lg">{service.name_bn} — আবেদন</h3><button onClick={onClose} className="border rounded-lg px-3 py-2">বন্ধ</button></div>
 {!user?<p role="alert">আবেদন তৈরি ও ট্র্যাকিংয়ের জন্য Firebase-এ অনুমোদিত কর্মী হিসেবে লগইন করুন।</p>:loading?<p>তথ্য লোড হচ্ছে...</p>:<>
 {error&&<p role="alert" className="text-red-700">{error}</p>}{notice&&<p role="status" className="text-emerald-700">{notice}</p>}
 {!approved?<p role="alert" className="bg-amber-50 text-amber-900 p-3 rounded-lg">এই সেবার ফরম ও স্থানীয় অনুমোদন যাচাই করা হয়নি। নতুন আবেদন সংরক্ষণ বা জমা দেওয়া বন্ধ।</p>:<>
 <label className="block text-sm">নাগরিক প্রোফাইল<select className="block border rounded-lg p-3 w-full mt-1" value={selectedId} onChange={e=>setSelectedId(e.target.value)}><option value="">নাগরিক নির্বাচন করুন</option>{citizens.map(c=><option key={c.id} value={c.id}>{c.name} — {c.village} (ওয়ার্ড {c.wardNo})</option>)}</select></label>
 {selected&&<div className="rounded-lg bg-slate-100 text-slate-900 p-3 text-sm"><p className="font-semibold">{selected.name}</p><p>পিতা: {selected.father} · মাতা: {selected.mother}</p><p>{selected.village}, ওয়ার্ড {selected.wardNo}, {selected.postOffice}</p><p className="text-xs mt-2">মাস্টার প্রোফাইল থেকে তথ্য নেওয়া হয়েছে; এখানে পরিচয় তথ্য সম্পাদনা করা যাবে না।</p></div>}
 <label className="block text-sm">আবেদনের উদ্দেশ্য / বিবরণ<textarea className="block border rounded-lg p-3 w-full mt-1" value={reason} onChange={e=>setReason(e.target.value)} maxLength={1500} rows={3}/></label>
 <div className="flex flex-wrap gap-2"><button disabled={busy||!selectedId} onClick={()=>void save()} className="bg-emerald-800 text-white p-3 rounded-lg disabled:opacity-40">খসড়া সংরক্ষণ</button><button disabled={busy||!id} onClick={()=>void submit()} className="bg-slate-900 text-white p-3 rounded-lg disabled:opacity-40">আবেদন জমা</button></div>
 </>}
 <section className="border-t pt-3 space-y-2"><h4 className="font-bold">আমার আবেদন ও অবস্থা</h4>{records.filter(r=>r.serviceId===service.id).map(r=><div key={r.id} className="border rounded-lg p-3 flex flex-wrap justify-between gap-2"><div><p className="text-sm font-semibold">আবেদন: {r.id.slice(0,8)}…</p><p className="text-xs">{STATUS_LABELS[r.status]} · {r.updatedAt.slice(0,10)}</p></div>{r.status==='draft'&&approved&&<button className="border rounded-lg px-3 py-2" onClick={()=>{setId(r.id);setSelectedId(r.citizenId);setReason(r.fieldValues.reason||'')}}>খসড়া চালিয়ে যান</button>}</div>)}{!records.some(r=>r.serviceId===service.id)&&<p className="text-sm">এই সেবায় কোনো আবেদন নেই।</p>}</section>
 </>}</div>;
}
