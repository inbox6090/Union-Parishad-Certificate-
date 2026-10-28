import React,{useState} from 'react';
import {ApplicationWorkspace} from './ApplicationWorkspace';
import {ArrowRight,CheckCircle2,FileText,Menu,Search,ShieldCheck,X} from 'lucide-react';
import {UnionParishadConfig} from '../../types';
import {CATEGORY_LABELS,SERVICES,filterServices,PublicService,canStartService} from './catalog';
type Props={config:UnionParishadConfig;onNavigateTab:(tab:string)=>void};
export function ServicePortal({config,onNavigateTab}:Props){
 const [search,setSearch]=useState(''),[category,setCategory]=useState('all'),[mobileMenu,setMobileMenu]=useState(false);
 const [selected,setSelected]=useState<PublicService|null>(null),[step,setStep]=useState(0),[workspace,setWorkspace]=useState(false);
 const visible=filterServices(SERVICES,search,category);
 const categories=['all',...Object.keys(CATEGORY_LABELS)];
 const nav=[['সেবাসমূহ','services'],['আবেদন','create'],['সনদ যাচাই','verify'],['নাগরিক প্রোফাইল','citizens']];
 const navigate=(tab:string)=>{setMobileMenu(false);if(tab==='services'){document.getElementById('service-directory')?.scrollIntoView({behavior:'smooth'})}else onNavigateTab(tab)};
 return <div className="space-y-7 text-slate-900 dark:text-slate-100">
 <header className="rounded-2xl bg-emerald-950 text-white p-4 sm:p-5">
 <div className="flex items-center justify-between gap-3">
 <div><p className="text-xs text-emerald-200">নাগরিক সেবা পোর্টাল</p><h1 className="font-bold text-base sm:text-xl">{config.upName}</h1></div>
 <button aria-label={mobileMenu?'মেনু বন্ধ করুন':'মেনু খুলুন'} aria-expanded={mobileMenu} onClick={()=>setMobileMenu(!mobileMenu)} className="md:hidden rounded-lg border border-emerald-500 p-3">{mobileMenu?<X size={20}/>:<Menu size={20}/>}</button>
 <nav aria-label="প্রধান নেভিগেশন" className="hidden md:flex gap-2 flex-wrap">{nav.map(([label,tab])=><button key={tab} onClick={()=>navigate(tab)} className="rounded-lg px-3 py-2 text-sm hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-amber-300">{label}</button>)}</nav></div>
 {mobileMenu&&<nav aria-label="মোবাইল নেভিগেশন" className="md:hidden grid gap-2 mt-4">{nav.map(([label,tab])=><button key={tab} onClick={()=>navigate(tab)} className="text-left rounded-lg bg-emerald-800 p-3">{label}</button>)}</nav>}
 </header>
 <section className="rounded-2xl bg-gradient-to-br from-emerald-100 to-white dark:from-emerald-950 dark:to-slate-900 p-5 sm:p-8 lg:p-10 border border-emerald-200 dark:border-emerald-900">
 <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">সহজ, নিরাপদ ও স্বচ্ছ নাগরিক সেবা</p>
 <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 max-w-2xl">আপনার প্রয়োজনীয় সনদ ও প্রত্যয়ন খুঁজে নিন</h2>
 <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-xl">প্রকাশ্য সেবাতালিকা থেকে সনদ খুঁজুন। অনুমোদিত সেবাগুলোর আবেদন বিদ্যমান সনদ ফরমে করা যাবে।</p>
 <div className="mt-5 flex flex-col sm:flex-row gap-3">
 <button onClick={()=>document.getElementById('service-directory')?.scrollIntoView({behavior:'smooth'})} className="min-h-11 bg-emerald-800 text-white rounded-xl px-5 py-3 font-semibold inline-flex items-center justify-center gap-2">সেবা খুঁজুন <ArrowRight size={17}/></button>
 <button onClick={()=>onNavigateTab('verify')} className="min-h-11 border border-emerald-800 rounded-xl px-5 py-3 font-semibold">সনদ যাচাই</button>
 </div></section>
 <section id="service-directory" className="scroll-mt-4 space-y-4"><div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"><div><h2 className="text-xl font-bold">সেবা ক্যাটালগ</h2><p className="text-sm text-slate-500">{visible.length}টি সেবা পাওয়া গেছে · মোট {SERVICES.length}টি তালিকাভুক্ত</p></div>
 <label className="flex items-center gap-2 bg-white dark:bg-slate-900 border rounded-xl px-3 py-2"><Search size={18}/><span className="sr-only">সেবা অনুসন্ধান</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="সনদের নাম লিখুন" className="min-h-9 w-full sm:w-64 outline-none bg-transparent" /></label></div>
 <div className="flex flex-wrap gap-2" aria-label="সেবা বিভাগ">{categories.map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)} className={`min-h-11 rounded-full px-4 py-2 text-xs font-semibold border ${category===c?'bg-emerald-800 text-white':'bg-white dark:bg-slate-900'}`}>{c==='all'?'সব সেবা':CATEGORY_LABELS[c]}</button>)}</div>
 {visible.length===0?<p className="rounded-xl border p-5">এই নামে কোনো সেবা পাওয়া যায়নি।</p>:<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{visible.map(s=><article key={s.id} className="rounded-xl bg-white dark:bg-slate-900 border p-4 flex flex-col justify-between gap-4"><div><FileText className="text-emerald-700 mb-3"/><h3 className="font-bold">{s.name_bn}</h3><p className="text-xs text-slate-500 mt-2">{CATEGORY_LABELS[s.category]||'অন্যান্য'}</p></div><button onClick={()=>{setSelected(s);setStep(0);setWorkspace(false)}} className="min-h-11 text-emerald-800 dark:text-emerald-300 border rounded-lg font-semibold">বিস্তারিত ও আবেদন ধাপ</button></article>)}</div>}</section>
 <section className="rounded-2xl border bg-white dark:bg-slate-900 p-5"><h2 className="text-lg font-bold">আবেদনের ধাপ</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">{['সেবা নির্বাচন','নাগরিক তথ্য','প্রয়োজনীয় তথ্য','পর্যালোচনা','আবেদন ট্র্যাকিং'].map((t,i)=><div key={t} className="rounded-lg border p-3"><span className="font-bold text-emerald-700">{i+1}</span><p className="text-sm mt-2">{t}</p></div>)}</div></section>
 {selected&&<div role="dialog" aria-modal="true" aria-labelledby="wizard-title" className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3"><div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 space-y-4"><div className="flex justify-between gap-3"><h2 id="wizard-title" className="font-bold text-lg">{selected.name_bn}</h2><button aria-label="বন্ধ করুন" onClick={()=>setSelected(null)} className="p-2"><X/></button></div>
 {workspace?<ApplicationWorkspace service={selected} onClose={()=>setWorkspace(false)}/>:<>
 <p className="text-sm text-slate-500">ধাপ {step+1}/5 — {['সেবা নির্বাচন','নাগরিক প্রোফাইল','আবেদন তথ্য','পর্যালোচনা','জমা ও ট্র্যাকিং'][step]}</p>
 <div className="h-2 rounded-full bg-slate-200 overflow-hidden"><div className="bg-emerald-700 h-full" style={{width:`${(step+1)*20}%`}}/></div>
 {step===0&&<p>এই সেবার বিস্তারিত আবেদন ফরম এখনো সরকারি উৎস থেকে যাচাই করা হয়নি। এটি ক্যাটালগের একটি তথ্যভিত্তিক প্রিভিউ।</p>}
 {step===1&&<p>নাগরিক মাস্টার প্রোফাইল থেকে পরিচয় ও ঠিকানা নেওয়া হবে। ব্যক্তিগত তথ্য দেখার জন্য অনুমোদিত লগইন প্রয়োজন।</p>}
 {step===2&&<div><p>প্রস্তাবিত অতিরিক্ত তথ্যের ধরন:</p><ul className="list-disc pl-5 text-sm mt-2">{selected.extra_fields_proposed.map(f=><li key={f}>{f}</li>)}</ul><p className="text-xs text-amber-700 mt-3">এগুলো যাচাইকৃত সরকারি ফরমের আবশ্যিক ফিল্ড নয়।</p></div>}
 {step===3&&<p>প্রকৃত আবেদনের আগে তথ্য, প্রয়োজনীয় নথি এবং স্থানীয় অনুমোদিত নিয়ম যাচাই করতে হবে।</p>}
 {step===4&&<div className="space-y-2"><p className="font-semibold text-amber-700">অনলাইন জমা আপাতত বন্ধ</p><p className="text-sm">সেবাটি অনুমোদিত ও ফরম যাচাইকৃত না হওয়া পর্যন্ত আবেদন জমা বা সনদ ইস্যু করা যাবে না।</p>{canStartService(selected)&&<button onClick={()=>{setSelected(null);onNavigateTab('create')}} className="rounded-lg bg-emerald-800 text-white p-3">আবেদন ফরমে যান</button>}</div>}
 <div className="flex justify-between gap-2"><button disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))} className="border rounded-lg p-3 disabled:opacity-40">পেছনে</button><button disabled={step===4} onClick={()=>setStep(s=>Math.min(4,s+1))} className="rounded-lg bg-emerald-800 text-white p-3 disabled:opacity-40">পরবর্তী</button></div>
 <button onClick={()=>setWorkspace(true)} className="w-full rounded-lg border border-emerald-700 text-emerald-800 dark:text-emerald-200 p-3 font-semibold">নিরাপদ ড্রাফট, প্রোফাইল ও আবেদন ট্র্যাকিং</button>
 </>}</div></div>}
 <p className="text-xs text-slate-500 flex gap-2"><ShieldCheck size={16}/> এই ইন্টারফেস ইউনিয়ন পরিষদের নিজস্ব ডিজাইন; প্রত্যয়ন সরকারি ওয়েবসাইটের অনুলিপি বা আনুষ্ঠানিক সংযোগ নয়।</p>
 </div>;
}
