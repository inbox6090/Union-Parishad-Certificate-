import React,{useEffect,useState} from 'react';
import {onAuthStateChanged} from 'firebase/auth';
import {auth} from '../../firebase';
import {CitizenInput,CitizenProfile,toCertificateCitizen} from './model';
import {createCitizenProfile,listCitizenProfiles} from './service';
import {CitizenAccountRecord} from '../../types';
const initial:CitizenInput={name:'',father:'',mother:'',gender:'পুরুষ',village:'',wardNo:'০১',postOffice:''};
const fields:[keyof CitizenInput,string][]=[
 ['name','নাম (বাংলা)'],['nameEn','নাম (ইংরেজি)'],['father','পিতার নাম'],['mother','মাতার নাম'],
 ['nid','জাতীয় পরিচয়পত্র নম্বর'],['birthNo','জন্মনিবন্ধন নম্বর'],['dateOfBirth','জন্মতারিখ (YYYY-MM-DD)'],
 ['mobile','মোবাইল'],['spouseName','স্বামী/স্ত্রীর নাম'],['village','গ্রাম'],['wardNo','ওয়ার্ড'],
 ['postOffice','ডাকঘর'],['postCode','পোস্টকোড'],['holdingNo','হোল্ডিং নম্বর'],
 ['currentAddress','বর্তমান ঠিকানা'],['permanentAddress','স্থায়ী ঠিকানা'],
 ['occupation','পেশা'],['education','শিক্ষা'],['emergencyContact','জরুরি যোগাযোগ']
];
export function CitizenMasterPanel({onApplyForCitizen}:{onApplyForCitizen:(c:CitizenAccountRecord)=>void}){
 const [user,setUser]=useState(auth.currentUser);
 const [records,setRecords]=useState<CitizenProfile[]>([]);
 const [form,setForm]=useState<CitizenInput>(initial);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [search,setSearch]=useState('');
 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 async function refresh(){setBusy(true);setError('');try{setRecords(await listCitizenProfiles())}catch(e){setError(e instanceof Error?e.message:'তথ্য আনা যায়নি')}finally{setBusy(false)}}
 useEffect(()=>{if(user)void refresh();else setRecords([])},[user?.uid]);
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setNotice('');
 try{await createCitizenProfile(form);setForm(initial);setNotice('নাগরিক প্রোফাইল সংরক্ষিত হয়েছে');await refresh()}
 catch(e){setError(e instanceof Error?e.message:'সংরক্ষণ ব্যর্থ')}finally{setBusy(false)}}
 if(!user)return <section className="p-6 bg-white rounded-xl"><h2 className="font-bold">নাগরিক মাস্টার প্রোফাইল</h2><p>নাগরিকের ব্যক্তিগত তথ্য দেখতে বা সংরক্ষণ করতে Firebase লগইন এবং সার্ভার-অনুমোদিত ভূমিকা প্রয়োজন।</p></section>;
 const filtered=records.filter(c=>[c.name,c.village,c.wardNo].some(v=>v?.toLowerCase().includes(search.toLowerCase())));
 return <section className="space-y-5"><h2 className="text-xl font-bold">সুরক্ষিত নাগরিক মাস্টার প্রোফাইল</h2>
 <p className="text-sm">শুধু অনুমোদিত কর্মী তথ্য সংরক্ষণ ও ব্যবহার করতে পারবেন। NID ও জন্মনিবন্ধন তালিকায় দেখানো হয় না।</p>
 {error&&<p role="alert" className="text-red-700">{error}</p>}{notice&&<p role="status" className="text-green-700">{notice}</p>}
 <form onSubmit={save} className="bg-white rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
 <h3 className="font-bold md:col-span-3">নতুন নাগরিক</h3>
 {fields.map(([key,label])=><label key={key} className="text-sm">{label}<input className="block border rounded-lg p-2 w-full" value={String(form[key]||'')} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} autoComplete="off" /></label>)}
 <label className="text-sm">লিঙ্গ<select className="block border rounded-lg p-2 w-full" value={form.gender} onChange={e=>setForm(p=>({...p,gender:e.target.value as CitizenInput['gender']}))}><option>পুরুষ</option><option>মহিলা</option><option>হিজরা</option></select></label>
 <button disabled={busy} className="bg-emerald-800 text-white rounded-lg p-3 md:col-span-3">নাগরিক প্রোফাইল সংরক্ষণ</button></form>
 <div className="bg-white p-5 rounded-xl space-y-3"><h3 className="font-bold">সংরক্ষিত নাগরিক ({records.length})</h3>
 <input aria-label="নাম, গ্রাম বা ওয়ার্ড দিয়ে খুঁজুন" className="border p-2 rounded-lg w-full" placeholder="নাম, গ্রাম বা ওয়ার্ড" value={search} onChange={e=>setSearch(e.target.value)}/>
 <button onClick={()=>void refresh()} disabled={busy} className="border rounded p-2">রিফ্রেশ</button>
 {filtered.map(c=><div key={c.id} className="flex items-center justify-between border-b py-3 gap-3"><span>{c.name} — {c.village}, ওয়ার্ড {c.wardNo}</span><button className="bg-emerald-800 text-white rounded p-2" onClick={()=>onApplyForCitizen(toCertificateCitizen(c))}>সনদ আবেদন</button></div>)}
 </div></section>;
}
