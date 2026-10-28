import React, { useState } from 'react';
import { ChevronDown, HelpCircle, FileCheck, ShieldCheck, CreditCard, Clock, RotateCcw, AlertTriangle } from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq_1',
    category: 'আবেদন পদ্ধতি',
    question: 'অনলাইনে ইউনিয়ন পরিষদ প্রত্যয়নপত্রের জন্য কীভাবে আবেদন করব?',
    answer: 'হোমপেজে "সনদের জন্য নতুন আবেদন" বাটনে ক্লিক করে ৫টি সহজ ধাপে আবেদন সম্পন্ন করতে পারেন: ১. মোবাইল/এনআইডি তথ্য প্রদান ও সম্মতি, ২. সেবার তালিকা হতে কাঙ্ক্ষিত সনদ নির্বাচন, ৩. নাগরিক প্রোফাইল যাচাই, ৪. প্রয়োজনীয় কাগজপত্র আপলোড ও সেবা-নির্দিষ্ট তথ্য প্রদান, এবং ৫. চূড়ান্ত পর্যালোচনা করে দাখিল। দাখিলের সাথে সাথে একটি ডিজিটাল আবেদন ট্র্যাকিং রসিদ পাবেন।',
    icon: FileCheck
  },
  {
    id: 'faq_2',
    category: 'কাগজপত্র',
    question: 'প্রত্যয়নপত্র আবেদনের জন্য কী কী কাগজপত্র ও প্রমাণক প্রয়োজন?',
    answer: 'সাধারণ সনদের (যেমন নাগরিকত্ব, চারিত্রিক, স্থায়ী বাসিন্দা) জন্য আবেদনকারীর জাতীয় পরিচয়পত্র (NID) বা ডিজিটাল জন্ম নিবন্ধনের কপি এবং হোল্ডিং ট্যাক্স রসিদ প্রয়োজন। ওয়ারিশান বা উত্তরাধিকার সনদের ক্ষেত্রে মৃত ব্যক্তির মৃত্যু সনদ, সকল ওয়ারিশের জাতীয় পরিচয়পত্র/জন্ম নিবন্ধন এবং স্থানীয় ইউপি সদস্যের প্রত্যয়ন সংযুক্তি হিসেবে আপলোড করতে হয়।',
    icon: HelpCircle
  },
  {
    id: 'faq_3',
    category: 'ফি ও পেমেন্ট',
    question: 'সরকারি ফি কীভাবে পরিশোধ করতে হবে?',
    answer: 'ইউপি কর্তৃক অনুমোদিত সরকারি ফি বিকাশ (bKash), নগদ (Nagad), রকেট বা সরাসরি ইউনিয়ন পরিষদ সেবা কেন্দ্রে পরিশোধ করা যায়। অনলাইন আবেদনের রিভিউ ধাপে ট্রানজেকশন আইডি (TrxID) প্রদান করে সহজে ফি পরিশোধ নিশ্চিত করা যায়।',
    icon: CreditCard
  },
  {
    id: 'faq_4',
    category: 'প্রসেসিং সময়',
    question: 'আবেদন দাখিলের পর কত সময়ের মধ্যে সনদ পাওয়া যাবে?',
    answer: 'সাধারণ নাগরিকত্ব ও চারিত্রিক সনদপত্র ১-২ কার্যদিবসের মধ্যে স্থানীয় ইউপি সচিব ও চেয়ারম্যান মহোদয় কর্তৃক অনুমোদিত হয়ে প্রস্তুত হয়। ওয়ারিশান বা ভূমি সংক্রান্ত সনদে ক্ষেত্রবিশেষে সরেজমিনে যাচাইয়ের প্রয়োজন হলে সর্বোচ্চ ৩-৫ কার্যদিবস সময় লাগতে পারে।',
    icon: Clock
  },
  {
    id: 'faq_5',
    category: 'যাচাই ও নিরাপত্তা',
    question: 'কিউআর কোডযুক্ত ডিজিটাল সনদের সত্যতা কীভাবে যাচাই করা যায়?',
    answer: 'প্রতিটি ইস্যুকৃত সনদে একটি বিশেষ ক্রিপ্টোগ্রাফিক কিউআর কোড এবং ইউনিক স্মারক নম্বর থাকে। যেকোনো স্মার্টফোন দিয়ে কিউআর কোড স্ক্যান করলে সরাসরি ইউনিয়ন পরিষদের কেন্দ্রীয় ক্লাউড ডাটাবেস হতে সত্যতা যাচাই করা যায়। কোনো নকল বা বিকৃত সনদ সিস্টেমে বৈধ হিসেবে গৃহীত হবে না।',
    icon: ShieldCheck
  },
  {
    id: 'faq_6',
    category: 'সংশোধন ও পুনরায় প্রিন্ট',
    question: 'সনদে কোনো তথ্য ভুল হলে বা সনদ হারিয়ে গেলে করণীয় কী?',
    answer: 'ইস্যুকৃত সনদের মেমো নম্বর বা আবেদন ট্র্যাকিং আইডি দিয়ে "সনদ যাচাই" বা "আবেদন ট্র্যাক" মেনুতে গিয়ে যে কোনো সময় পুনরায় ডিজিটাল কপি ডাউনলোড ও প্রিন্ট করা যায়। তথ্য সংশোধনের প্রয়োজন হলে ইউনিয়ন পরিষদে সরাসরি বা অনলাইনে অতিরিক্ত তথ্য অনুরোধের মাধ্যমে আবেদন করতে পারেন।',
    icon: RotateCcw
  }
];

export const FAQAccordion: React.FC = () => {
  const [openId, setOpenId] = useState<string>('faq_1');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'আবেদন পদ্ধতি', 'কাগজপত্র', 'ফি ও পেমেন্ট', 'প্রসেসিং সময়', 'যাচাই ও নিরাপত্তা', 'সংশোধন ও পুনরায় প্রিন্ট'];

  const filteredFaqs = selectedCategory === 'all' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(f => f.category === selectedCategory);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm transition-all" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/80 mb-3">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>সচরাচর জিজ্ঞাসা ও প্রশ্নোত্তর</span>
          </div>
          <h2 id="faq-heading" className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            নাগরিক সনদ আবেদন নির্দেশিকা ও সহায়তা
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl mx-auto">
            ০২নং বহেড়াতৈল ইউনিয়ন পরিষদের ডিজিটাল প্রত্যয়ন সেবা গ্রহণের পূর্বে সাধারণ প্রশ্নের উত্তর জেনে নিন।
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'সব প্রশ্নোত্তর' : cat}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            const Icon = faq.icon;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? 'border-emerald-600 dark:border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? '' : faq.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 rounded-2xl"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-xl shrink-0 ${isOpen ? 'bg-emerald-800 text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-emerald-700 dark:text-emerald-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-emerald-100 dark:border-emerald-900/50 mt-1">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Help Banner */}
        <div className="mt-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-950 dark:text-amber-200 font-medium">
              আপনার প্রশ্নের উত্তর পাননি? সরাসরি ইউনিয়ন পরিষদ হটলাইনে (০১৮৩৪-৩৩ ৩৩ ৩০০) যোগাযোগ করুন অথবা ইউডিসি হেল্পডেস্কে আসুন।
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
