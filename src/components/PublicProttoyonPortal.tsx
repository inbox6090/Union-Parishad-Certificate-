import React, { useState } from 'react';
import { 
  FileCheck, 
  Search, 
  QrCode, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  Clock, 
  HelpCircle, 
  Building2, 
  PhoneCall, 
  Users, 
  CheckCircle2, 
  FileText,
  CreditCard,
  Check,
  Sparkles
} from 'lucide-react';
import { UnionParishadConfig } from '../types';
import { CERTIFICATE_TYPES } from '../data/certificateTypes';
import { ServiceCatalogView } from './ServiceCatalogView';
import { FAQAccordion } from './FAQAccordion';
import { ApplicationStatusLookup } from './ApplicationStatusLookup';

interface PublicProttoyonPortalProps {
  config: UnionParishadConfig;
  onStartApplication: (serviceKey?: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenCertificate?: (certId: string) => void;
}

export const PublicProttoyonPortal: React.FC<PublicProttoyonPortalProps> = ({
  config,
  onStartApplication,
  onNavigateTab,
  onOpenCertificate
}) => {
  const [activeQuickTab, setActiveQuickTab] = useState<'catalog' | 'track' | 'faq'>('catalog');

  // Popular Services selection for quick cards
  const popularServiceKeys = ['citizenship', 'character', 'warish', 'family_certificate', 'unmarried', 'permanent_resident'];
  const popularServices = CERTIFICATE_TYPES.filter(s => popularServiceKeys.includes(s.key));

  return (
    <div className="space-y-12">
      {/* 1. Hero Section (Design tokens: primary #166534, accent #D97706, surface #FFFFFF, page #F8FAFC, text #0F172A) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-emerald-700/60" aria-labelledby="portal-hero-heading">
        {/* Subtle decorative geometry */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Official Emblem & Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত ডিজিটাল প্রত্যয়ন সেবা</span>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 id="portal-hero-heading" className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {config.upName}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-emerald-100 font-semibold max-w-2xl mx-auto leading-relaxed">
              সখিপুর, টাঙ্গাইল • স্মার্ট ডিজিটাল নাগরিক সেবা, অনলাইন প্রত্যয়ন আবেদন ও কিউআর যাচাইকরণ কেন্দ্রীয় প্ল্যাটফর্ম
            </p>
          </div>

          {/* 3 Core Primary Action Cards */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {/* Action 1: New Application */}
            <div 
              onClick={() => onStartApplication()}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/20 transition-all hover:border-amber-300/80 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-emerald-950 font-black flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-md">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h2 className="text-base font-black text-white group-hover:text-amber-300 transition">
                  সনদের জন্য নতুন আবেদন
                </h2>
                <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                  নাগরিকত্ব, ওয়ারিশান, চারিত্রিক ও ৪০+ প্রকার প্রত্যয়নের জন্য অনলাইনে সহজে আবেদন করুন।
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-extrabold text-amber-300">
                <span>আবেদন শুরু করুন</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Action 2: Track Application */}
            <div 
              onClick={() => {
                setActiveQuickTab('track');
                const trackElem = document.getElementById('tracking-section');
                if (trackElem) trackElem.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/20 transition-all hover:border-amber-300/80 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-400 text-teal-950 font-black flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-md">
                  <Clock className="w-6 h-6" />
                </div>
                <h2 className="text-base font-black text-white group-hover:text-amber-300 transition">
                  আবেদন ট্র্যাক করুন
                </h2>
                <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                  আবেদন রসিদের ট্র্যাকিং নম্বর দিয়ে বর্তমান প্রসেসিং স্ট্যাটাস ও অগ্রগতির খবর জানুন।
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-extrabold text-teal-300">
                <span>স্ট্যাটাস দেখুন</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Action 3: Verify Certificate */}
            <div 
              onClick={() => onNavigateTab('verify')}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/20 transition-all hover:border-amber-300/80 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-400 text-emerald-950 font-black flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-md">
                  <QrCode className="w-6 h-6" />
                </div>
                <h2 className="text-base font-black text-white group-hover:text-amber-300 transition">
                  ডিজিটাল সনদ QR যাচাই
                </h2>
                <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                  স্মার্টফোন দিয়ে কিউআর স্ক্যান বা মেমো নম্বর লিখে সনদের নির্ভুল সত্যতা নিশ্চিত করুন।
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-extrabold text-emerald-300">
                <span>যাচাইকরণ পোর্টাল</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. জনপ্রিয় সেবাসমূহ (Popular Services Quick Grid) */}
      <section className="space-y-4" aria-labelledby="popular-services-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 id="popular-services-heading" className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              জনপ্রিয় নাগরিক প্রত্যয়ন সেবাসমূহ
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              সর্বাধিক প্রয়োজনীয় নাগরিক সনদসমূহের জন্য তাৎক্ষণিক আবেদন করুন
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveQuickTab('catalog');
              const catElem = document.getElementById('catalog-section');
              if (catElem) catElem.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>সকল ৪০+ সেবা দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularServices.map((svc) => (
            <div
              key={svc.key}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-600 transition shadow-sm hover:shadow flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
                    {svc.category}
                  </span>
                  <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-400">
                    ৳{config.certificateFeeDefault || 50}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white group-hover:text-emerald-700 transition">
                  {svc.label}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {svc.promptInstruction}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onStartApplication(svc.key)}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-800 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>আবেদন করুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. ৪-ধাপ আবেদন প্রক্রিয়া ইনফোগ্রাফিক (Process Infographic) */}
      <section className="bg-slate-50 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6" aria-labelledby="process-heading">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
            সহজ ও ঝামেলাহীন আবেদন
          </span>
          <h2 id="process-heading" className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ডিজিটাল প্রত্যয়নপত্র প্রাপ্তির ৪টি সহজ ধাপ
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ঘরে বসেই বা ডিজিটাল সেন্টারে গিয়ে অল্প সময়ে প্রত্যয়নপত্র গ্রহণ করুন।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              num: '০১',
              title: 'সেবা নির্বাচন ও ফরম পূরণ',
              desc: 'ক্যাটালগ থেকে প্রয়োজনীয় সনদ নির্বাচন করে এনআইডি ও ব্যক্তিগত তথ্য প্রদান করুন।',
              icon: FileText
            },
            {
              num: '০২',
              title: 'প্রয়োজনীয় প্রমাণক আপলোড',
              desc: 'জাতীয় পরিচয়পত্র, ট্যাক্স রসিদ বা ইউপি মেম্বারের প্রত্যয়নপত্রের ছবি আপলোড করুন।',
              icon: CreditCard
            },
            {
              num: '০৩',
              title: 'স্থানীয় যাচাই ও অনুমোদন',
              desc: 'সংশ্লিষ্ট ওয়ার্ড মেম্বার ও সচিব মহোদয় কর্তৃক তথ্য যাচাই ও চেয়ারম্যানের অনুমোদন।',
              icon: ShieldCheck
            },
            {
              num: '০৪',
              title: 'ডিজিটাল সনদ গ্রহণ',
              desc: 'কিউআর কোড ও ডিজিটাল স্বাক্ষরিত প্রত্যয়নপত্র অনলাইন থেকে তাৎক্ষণিক প্রিন্ট বা ডাউনলোড করুন।',
              icon: Award
            }
          ].map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-2xl font-black text-emerald-800/20 dark:text-emerald-400/20 block mb-2">
                    {step.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mb-3 font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Interactive Full Service Catalog View */}
      <div id="catalog-section">
        <ServiceCatalogView
          config={config}
          onSelectService={(serviceKey) => onStartApplication(serviceKey)}
        />
      </div>

      {/* 5. Application Tracking Section */}
      <div id="tracking-section">
        <ApplicationStatusLookup
          config={config}
          onOpenCertificate={onOpenCertificate}
          onStartNewApplication={() => onStartApplication()}
        />
      </div>

      {/* 6. FAQ Accordion Section */}
      <div id="faq-section">
        <FAQAccordion />
      </div>

      {/* 7. Union Support & Citizen Contact Card */}
      <section className="bg-gradient-to-r from-emerald-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-700/60 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300">
            <PhoneCall className="w-4 h-4" />
            <span>ইউনিয়ন পরিষদ হেল্পডেস্ক ও নাগরিক তথ্য সেবা</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            যেকোনো তথ্য বা সহায়তায় আমাদের সাথে যোগাযোগ করুন
          </h2>
          <p className="text-xs text-emerald-100 max-w-xl">
            চেয়ারম্যান: {config.chairmanName} ({config.chairmanPhone || '০১৮৩৪-৩৩ ৩৩ ৩০০'}) • সচিব: {config.secretaryName} • ইমেইল: baheratailunion@gmail.com
          </p>
        </div>

        <button
          type="button"
          onClick={() => onStartApplication()}
          className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl shadow-lg transition shrink-0 cursor-pointer active:scale-95"
        >
          অনলাইনে আবেদন করুন
        </button>
      </section>
    </div>
  );
};
