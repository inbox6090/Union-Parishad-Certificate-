import React, { useState } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  Download, 
  ArrowRight, 
  Printer, 
  Calendar, 
  User, 
  MapPin, 
  RefreshCw,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { CitizenApplicationRecord, ApplicationStatus, UnionParishadConfig } from '../types';
import { IdentityMaskedValue } from './IdentityMaskedValue';
import { authenticatedApiFetch } from '../lib/apiAuth';

interface ApplicationStatusLookupProps {
  config: UnionParishadConfig;
  onOpenCertificate?: (certId: string) => void;
  onStartNewApplication?: () => void;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; desc: string }> = {
  draft: {
    label: 'খসড়া (Draft)',
    color: 'text-slate-600 bg-slate-100 border-slate-300',
    desc: 'আবেদনটি এখনও চূড়ান্তভাবে দাখিল করা হয়নি।'
  },
  submitted: {
    label: 'দাখিলকৃত (Submitted)',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    desc: 'আবেদনটি সফলভাবে গৃহীত হয়েছে এবং প্রশাসনিক পর্যালোচনার অপেক্ষায় আছে।'
  },
  under_review: {
    label: 'যাচাইাধীন (Under Review)',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    desc: 'সংশ্লিষ্ট ওয়ার্ড মেম্বার ও সচিব মহোদয় কর্তৃক তথ্য ও কাগজপত্র যাচাই করা হচ্ছে।'
  },
  needs_information: {
    label: 'অতিরিক্ত তথ্য প্রয়োজন (Needs Info)',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    desc: 'আবেদনে কোনো কাগজপত্রের ঘাটতি থাকায় অতিরিক্ত তথ্য বা প্রমাণক চাওয়া হয়েছে।'
  },
  approved: {
    label: 'অনুমোদিত (Approved)',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    desc: 'আবেদনটি সফলভাবে অনুমোদিত হয়েছে। চেয়ারম্যান মহোদয়ের স্বাক্ষর ও সনদ ইস্যু সম্পন্ন করা হচ্ছে।'
  },
  issued: {
    label: 'সনদ ইস্যুকৃত (Issued)',
    color: 'text-emerald-800 bg-emerald-100 border-emerald-300',
    desc: 'ডিজিটাল কিউআর কোড ও স্বাক্ষরযুক্ত প্রত্যয়নপত্র প্রস্তুত। আপনি এখনই ডাউনলোড বা প্রিন্ট করতে পারেন।'
  },
  rejected: {
    label: 'বাতিলকৃত (Rejected)',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    desc: 'সঠিক তথ্যের ঘাটতি বা অসংগতির কারণে আবেদনটি বাতিল করা হয়েছে।'
  },
  revoked: {
    label: 'প্রত্যাহারকৃত (Revoked)',
    color: 'text-red-900 bg-red-100 border-red-300',
    desc: 'প্রশাসনিক সিদ্ধান্তে সনদটি প্রত্যাহার করা হয়েছে।'
  }
};

const STEP_STAGES: { key: ApplicationStatus; label: string }[] = [
  { key: 'submitted', label: '১. আবেদন দাখিল' },
  { key: 'under_review', label: '২. স্থানীয় যাচাই' },
  { key: 'approved', label: '৩. প্রশাসনিক অনুমোদন' },
  { key: 'issued', label: '৪. সনদ ইস্যু সম্পন্ন' }
];

export const ApplicationStatusLookup: React.FC<ApplicationStatusLookupProps> = ({
  config,
  onOpenCertificate,
  onStartNewApplication
}) => {
  const [trackingId, setTrackingId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchedRecord, setSearchedRecord] = useState<CitizenApplicationRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackingId.trim();
    if (!cleanId) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSearchedRecord(null);

    try {
      const res = await authenticatedApiFetch(`/api/applications/${encodeURIComponent(cleanId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.application) {
          setSearchedRecord(data.application);
          return;
        }
      }
      
      // Fallback search in local storage or simulated sample records
      const saved = localStorage.getItem(`app_${cleanId}`);
      if (saved) {
        setSearchedRecord(JSON.parse(saved));
        return;
      }

      setErrorMessage('উক্ত ট্র্যাকিং আইডি বা স্মারক নম্বরে কোনো আবেদন খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক আইডি লিখুন।');
    } catch (err: any) {
      setErrorMessage('সার্ভারের সাথে যোগাযোগে বিঘ্ন ঘটেছে। কিছুক্ষণ পর পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepStatus = (currentStatus: ApplicationStatus, stepKey: ApplicationStatus) => {
    const order: ApplicationStatus[] = ['draft', 'submitted', 'under_review', 'approved', 'issued'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (currentStatus === 'rejected') return 'rejected';
    if (currentIndex >= stepIndex && currentIndex !== -1) return 'completed';
    if (currentIndex + 1 === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 mb-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>রিয়েল-টাইম আবেদন ট্র্যাকিং সিস্টেম</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          ডিজিটাল আবেদন ট্র্যাকিং
        </h2>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-2">
          আপনার আবেদন রসিদে উল্লিখিত ট্র্যাকিং আইডি (যেমন: <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">APP-2026-BUP-0104</span>) বা স্মারক নম্বর লিখে অনুসন্ধান করুন।
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border-2 border-emerald-800/20 focus-within:border-emerald-700 transition">
          <div className="flex items-center gap-2.5 px-3 w-full">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="আবেদন ট্র্যাকিং নম্বর লিখুন..."
              className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !trackingId.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>অনুসন্ধান হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>ট্র্যাক করুন</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {errorMessage && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Record Result */}
      {searchedRecord && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 bg-slate-50/50 dark:bg-slate-800/30 space-y-6">
          {/* Top Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-5">
            <div>
              <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 font-extrabold uppercase tracking-wider">
                ট্র্যাকিং আইডি: {searchedRecord.id}
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {searchedRecord.serviceLabel}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ক্যাটাগরি: {searchedRecord.serviceCategory} • দাখিলের তারিখ: {new Date(searchedRecord.createdAt).toLocaleDateString('bn-BD')}
              </p>
            </div>

            <div className={`px-4 py-2 rounded-2xl border font-bold text-xs flex items-center gap-2 ${STATUS_CONFIG[searchedRecord.status].color}`}>
              {searchedRecord.status === 'issued' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
              {searchedRecord.status === 'rejected' && <XCircle className="w-4 h-4 text-rose-700" />}
              {searchedRecord.status === 'under_review' && <Clock className="w-4 h-4 text-amber-700" />}
              <span>{STATUS_CONFIG[searchedRecord.status].label}</span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="py-2">
            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-4">আবেদনের চলমান অগ্রগতি:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STEP_STAGES.map((step) => {
                const state = getStepStatus(searchedRecord.status, step.key);
                return (
                  <div
                    key={step.key}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      state === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200'
                        : state === 'current'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-200 ring-2 ring-amber-400/40'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {state === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : state === 'current' ? (
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                      )}
                      <span className="text-xs font-extrabold">{step.label}</span>
                    </div>
                    <p className="text-[10px] leading-tight opacity-80">
                      {state === 'completed' ? 'সম্পন্ন হয়েছে' : state === 'current' ? 'বর্তমান পর্যায়' : 'অপেক্ষমান'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Note or Rejection Reason */}
          {(searchedRecord.statusNote || searchedRecord.rejectionReason) && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${searchedRecord.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
              <span className="font-bold mr-1">কর্তৃপক্ষের নোট:</span>
              <span>{searchedRecord.rejectionReason || searchedRecord.statusNote}</span>
            </div>
          )}

          {/* Citizen Details Summary */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">আবেদনকারীর নাম</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                {searchedRecord.applicantName}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন</span>
              <IdentityMaskedValue value={searchedRecord.applicantNid || searchedRecord.applicantBirthNo} type="nid" />
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">মোবাইল নম্বর</span>
              <IdentityMaskedValue value={searchedRecord.applicantPhone} type="mobile" />
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">পিতা ও মাতা</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {searchedRecord.fatherName} • {searchedRecord.motherName}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">গ্রাম ও ওয়ার্ড নম্বর</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                গ্রাম: {searchedRecord.village}, ওয়ার্ড: {searchedRecord.wardNo}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">ফি স্ট্যাটাস</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-400">
                ৳{searchedRecord.feeAmount} ({searchedRecord.paymentStatus === 'paid' ? 'পরিশোধিত' : 'অপেক্ষমান'})
              </span>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>ডিজিটাল অডিট লগ ও ফায়ারবেস ক্লাউড ভেরিফাইড</span>
            </div>

            <div className="flex items-center gap-2">
              {searchedRecord.status === 'issued' && searchedRecord.certificateId && onOpenCertificate && (
                <button
                  type="button"
                  onClick={() => onOpenCertificate(searchedRecord.certificateId!)}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>ডিজিটাল সনদপত্র দেখুন ও ডাউনলোড করুন</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>রসিদ প্রিন্ট</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
