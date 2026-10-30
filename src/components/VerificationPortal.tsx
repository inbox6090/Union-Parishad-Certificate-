import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  User, 
  MapPin, 
  Award, 
  FileCheck,
  Layers,
  Upload
} from 'lucide-react';
import { UnionParishadConfig } from '../types';
import { sanitizeInput } from '../utils/security';
import { BulkQrVerifier } from './BulkQrVerifier';

interface VerificationPortalProps {
  config: UnionParishadConfig;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({ config }) => {
  const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single');
  const [memoInput, setMemoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    found: boolean;
    verification?: {
      memoNo: string; typeLabel: string; issueDate: string; issuedBy: string;
      status: string; isValid: boolean;
    };
    message?: string;
  } | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitizedMemo = sanitizeInput(memoInput.trim(), 100);
    if (!sanitizedMemo) return;
    setLoading(true);
    setVerificationData(null);
    try {
      const res = await fetch(`/api/certificate/verify/${encodeURIComponent(sanitizedMemo)}`);
      if (!res.ok) throw new Error('Verification service unavailable');
      const data = await res.json();
      setVerificationData(data);
    } catch {
      // Never read full private certificates from Firestore in a public flow.
      setVerificationData({ found: false, message: 'যাচাইকরণ সার্ভারে সংযোগে ত্রুটি ঘটিয়াছে।' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Mode Selector Bar */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-2 max-w-xl mx-auto">
        <button
          onClick={() => setViewMode('single')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
            viewMode === 'single'
              ? 'bg-emerald-800 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>একক সনদ অনলাইন ভেরিফিকেশন</span>
        </button>

        <button
          onClick={() => setViewMode('bulk')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
            viewMode === 'bulk'
              ? 'bg-emerald-800 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4 text-amber-400" />
          <span>প্রশাসনিক বাল্ক কিউআর অডিট টুল</span>
        </button>
      </div>

      {viewMode === 'bulk' ? (
        <BulkQrVerifier config={config} />
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Verification Input Header Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 md:p-8 rounded-2xl shadow-xl border border-emerald-800 text-center space-y-4">
            <div className="inline-flex p-3 bg-emerald-800/80 rounded-full border border-emerald-700 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-amber-300" />
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                ডিজিটাল প্রত্যয়নপত্র ভেরিফিকেশন ও অনলাইন সত্যতা যাচাই
              </h2>
              <p className="text-xs md:text-sm text-emerald-200 mt-1 max-w-xl mx-auto">
                {config.upName} কর্তৃক ইস্যুকৃত সকল সনদের কিউআর কোড বা স্মারক নম্বর টাইপ করিয়া আসল কপির সত্যতা অনলাইন ডাটাবেস হইতে পরীক্ষা করুন।
              </p>
            </div>

            {/* Form Input */}
            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  placeholder="স্মারক নম্বর লিখুন (যেমন: BUP-2026-1082)"
                  value={memoInput}
                  onChange={(e) => setMemoInput(e.target.value)}
                  className="w-full px-4 py-3 bg-emerald-900/90 border-2 border-emerald-700 text-white placeholder-emerald-300 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                <span>সত্যতা যাচাই করুন</span>
              </button>
            </form>
          </div>

          {/* Verification Result Section */}
          {verificationData && (
            <div className="animate-fade-in space-y-6">
              {verificationData.found && verificationData.verification ? (
                <div className="space-y-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-9 h-9 text-emerald-700" />
                    <h3 className="text-xl font-bold text-emerald-950">
                      {verificationData.verification.isValid ? 'সনদটি অনলাইনে যাচাইকৃত' : 'সনদটি আর বৈধ নয়'}
                    </h3>
                  </div>
                  <p><strong>স্মারক নম্বর:</strong> {verificationData.verification.memoNo}</p>
                  <p><strong>সনদের ধরন:</strong> {verificationData.verification.typeLabel}</p>
                  <p><strong>ইস্যুর তারিখ:</strong> {verificationData.verification.issueDate}</p>
                  <p><strong>ইস্যুকারী:</strong> {verificationData.verification.issuedBy}</p>
                  <p><strong>বর্তমান অবস্থা:</strong> {verificationData.verification.status}</p>
                  <p className="text-xs text-slate-600">
                    নাগরিকের গোপন তথ্য এবং পূর্ণাঙ্গ সনদের কপি এই পাবলিক পৃষ্ঠায় প্রকাশ করা হয় না।
                    নিজস্ব সনদ সংগ্রহের জন্য অনুমোদিত অফিসে যোগাযোগ করুন।
                  </p>
                </div>
              ) : (
                /* Not Found Banner */
                <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-center space-y-3 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-900">
                      ⚠️ কোনো রেকর্ডের মিল পাওয়া যায় নাই!
                    </h3>
                    <p className="text-xs text-red-700 mt-1 max-w-md mx-auto">
                      {verificationData.message || 'আপনার প্রদানকৃত স্মারক বা সনদ নম্বরটি সঠিক নয় অথবা অনলাইন ডাটাবেসে নিবন্ধিত হয় নাই। অনুগ্রহ করে সঠিক নম্বর প্রদান করুন।'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

