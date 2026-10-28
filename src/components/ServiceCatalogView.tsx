import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  FileCheck, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Users,
  Building2,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';
import { CERTIFICATE_TYPES, CERTIFICATE_CATEGORIES } from '../data/certificateTypes';
import { CertificateTypeConfig, UnionParishadConfig } from '../types';

interface ServiceCatalogViewProps {
  config: UnionParishadConfig;
  onSelectService: (serviceKey: string) => void;
}

export const ServiceCatalogView: React.FC<ServiceCatalogViewProps> = ({
  config,
  onSelectService
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    return ['all', ...CERTIFICATE_CATEGORIES];
  }, []);

  const getServiceFee = (serviceKey: string, category: string): number => {
    if (config.typeFeeOverrides && config.typeFeeOverrides[serviceKey] !== undefined) {
      return config.typeFeeOverrides[serviceKey];
    }
    if (config.categoryFees && config.categoryFees[category] !== undefined) {
      return config.categoryFees[category];
    }
    return config.certificateFeeDefault || 50;
  };

  const getEstimatedTurnaround = (serviceKey: string): string => {
    if (serviceKey === 'warish' || serviceKey === 'land_ownership') return '২-৩ কার্যদিবস';
    if (serviceKey === 'citizenship' || serviceKey === 'character') return '১ কার্যদিবস';
    return '১-২ কার্যদিবস';
  };

  const getRequiredDocs = (service: CertificateTypeConfig): string[] => {
    const defaultDocs = ['জাতীয় পরিচয়পত্র বা অনলাইন জন্ম নিবন্ধন', 'হোল্ডিং ট্যাক্স পরিশোধ রসিদ'];
    if (service.key === 'warish') {
      return ['মৃত ব্যক্তির মৃত্যু সনদপত্র', 'সকল ওয়ারিশের এনআইডি/জন্ম নিবন্ধন', 'স্থানীয় ইউপি সদস্যের প্রত্যয়ন'];
    }
    if (service.key.includes('marriage') || service.key === 'unmarried') {
      return ['এনআইডি বা ডিজিটাল জন্ম নিবন্ধন', 'পাসপোর্ট সাইজ ছবি (২ কপি)', 'পিতা/মাতার সম্মতিপত্র'];
    }
    if (service.key === 'same_person') {
      return ['এসএসসি/শিক্ষাগত সনদ ও এনআইডি কপি', 'পাসপোর্ট বা অন্যান্য নথির কপি'];
    }
    return defaultDocs;
  };

  const filteredServices = useMemo(() => {
    return CERTIFICATE_TYPES.filter((svc) => {
      const matchesCategory = selectedCategory === 'all' || svc.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        svc.label.toLowerCase().includes(q) || 
        svc.category.toLowerCase().includes(q) ||
        (svc.promptInstruction && svc.promptInstruction.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <section className="space-y-6" aria-labelledby="services-catalog-heading">
      {/* Top Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 mb-1">
            <FileCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>৪০+ প্রকার দাপ্তরিক নাগরিক সনদ সেবা</span>
          </div>
          <h2 id="services-catalog-heading" className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            ডিজিটাল সেবা ক্যাটালগ ও প্রত্যয়নপত্র তালিকা
          </h2>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="সনদের নাম বা বিষয় দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: 260px Left Sidebar (Desktop) + 3-Column Grid (Right) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Category Filter Sidebar (260px on Desktop) */}
        <div className="w-full lg:w-[260px] shrink-0 bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>সেবা ক্যাটাগরি</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
              {filteredServices.length}টি সেবা
            </span>
          </div>

          {/* Desktop Vertical Menu / Mobile Horizontal Chips */}
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const count = cat === 'all' 
                ? CERTIFICATE_TYPES.length 
                : CERTIFICATE_TYPES.filter(s => s.category === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-700'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{cat === 'all' ? 'সকল সেবাসমূহ' : cat}</span>
                  <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded-md font-mono ${
                    isSelected ? 'bg-emerald-950/60 text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Service Cards (3-Column Grid on Desktop) */}
        <div className="flex-1 w-full">
          {filteredServices.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">কোনো সেবা পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 mt-1">অনুসন্ধান বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-4 px-4 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                সব সেবা প্রদর্শন করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredServices.map((svc) => {
                const fee = getServiceFee(svc.key, svc.category);
                const turnaround = getEstimatedTurnaround(svc.key);
                const docs = getRequiredDocs(svc);

                return (
                  <div
                    key={svc.key}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400">
                          {svc.category}
                        </span>
                        <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/80">
                          ৳{fee}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition leading-snug">
                        {svc.label}
                      </h3>

                      {/* Brief Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {svc.promptInstruction || 'বহেড়াতৈল ইউনিয়ন পরিষদের ডিজিটাল ডাটাবেস যাচাই ও স্বাক্ষরিত প্রত্যয়নপত্র।'}
                      </p>

                      {/* Meta Information (Turnaround & Required Docs) */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>প্রসেসিং সময়: <strong className="text-slate-800 dark:text-slate-200">{turnaround}</strong></span>
                        </div>

                        <div>
                          <span className="text-slate-400 block mb-1">প্রয়োজনীয় কাগজপত্র:</span>
                          <ul className="text-slate-600 dark:text-slate-400 space-y-0.5 list-disc pl-3.5">
                            {docs.slice(0, 2).map((d, i) => (
                              <li key={i} className="truncate">{d}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Apply Button CTA */}
                    <div className="mt-5 pt-3">
                      <button
                        type="button"
                        onClick={() => onSelectService(svc.key)}
                        className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer group-hover:bg-gradient-to-r group-hover:from-emerald-800 group-hover:to-emerald-900 active:scale-98"
                      >
                        <span>সনদের জন্য আবেদন করুন</span>
                        <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
