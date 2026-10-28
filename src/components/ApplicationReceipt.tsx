import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ArrowRight, 
  FileText, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  QrCode as QrIcon 
} from 'lucide-react';
import { CitizenApplicationRecord, UnionParishadConfig } from '../types';
import { StyledQrCode } from './StyledQrCode';
import { IdentityMaskedValue } from './IdentityMaskedValue';

interface ApplicationReceiptProps {
  application: CitizenApplicationRecord;
  config: UnionParishadConfig;
  onTrackStatus?: () => void;
  onStartNew?: () => void;
}

export const ApplicationReceipt: React.FC<ApplicationReceiptProps> = ({
  application,
  config,
  onTrackStatus,
  onStartNew
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(application.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const trackingUrl = `${window.location.origin}/?tab=track&appId=${encodeURIComponent(application.id)}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-600/50 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl text-amber-300 border border-white/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">আবেদন সফলভাবে দাখিল হইয়াছে!</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              আপনার আবেদনের ডিজিটাল রসিদ নিচে প্রস্তুত হইয়াছে। ট্র্যাকিং নম্বরটি সংরক্ষণ করুন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-950" />
            <span>প্রিন্ট রসিদ</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border-2 border-slate-200 dark:border-slate-800 shadow-md print:border-none print:shadow-none print:p-0">
        {/* Receipt Header with Union Identity */}
        <div className="text-center border-b-2 border-emerald-800/20 pb-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="UP Seal" className="w-14 h-14 object-contain" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center font-black text-xl">
                ০২
              </div>
            )}
            <div>
              <h1 className="text-lg md:text-xl font-black text-emerald-900 dark:text-emerald-300 tracking-tight">
                গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
              </h1>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                {config.upName}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                {config.address} • ডাকঘর: বহেড়াতৈল (১৯৫০), উপজেলা: {config.upazila}, জেলা: {config.district}
              </p>
            </div>
          </div>

          <div className="inline-block mt-2 px-4 py-1 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-700/40 rounded-full text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
            ডিজিটাল নাগরিক সনদ আবেদন রসিদ (Application Acknowledgement Receipt)
          </div>
        </div>

        {/* Tracking ID & QR Code Hero Grid */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">আবেদন ট্র্যাকিং নম্বর (Application ID)</span>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-mono text-xl md:text-2xl font-black text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-900 px-4 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 select-all">
                {application.id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-700 transition cursor-pointer print:hidden"
                title="আইডি কপি করুন"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              দাখিলের তারিখ: <strong>{new Date(application.createdAt).toLocaleDateString('bn-BD')}</strong> • সেবা: <strong className="text-slate-900 dark:text-white">{application.serviceLabel}</strong>
            </p>
          </div>

          {/* Styled QR Code */}
          <div className="flex flex-col items-center bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
            <StyledQrCode
              text={trackingUrl}
              size={110}
              colorScheme="govt-emerald"
              frameStyle="badge"
              label="আবেদন ট্র্যাকিং"
            />
            <span className="text-[10px] font-mono text-slate-400 mt-1">স্ক্যান করে স্ট্যাটাস দেখুন</span>
          </div>
        </div>

        {/* Summary Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-8">
          <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-700" />
              <span>আবেদনকারীর তথ্যাবলী</span>
            </h3>
            
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-500">নাম:</span>
              <span className="font-bold text-slate-900 dark:text-white">{application.applicantName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-500">পিতা:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{application.fatherName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-500">মাতা:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{application.motherName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-500">জাতীয় পরিচয়পত্র/জন্ম নিবন্ধন:</span>
              <IdentityMaskedValue value={application.applicantNid || application.applicantBirthNo} type="nid" />
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">মোবাইল নম্বর:</span>
              <IdentityMaskedValue value={application.applicantPhone} type="mobile" />
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>ঠিকানা ও ফি বিবরণ</span>
            </h3>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-500">গ্রাম ও ওয়ার্ড:</span>
              <span className="font-bold text-slate-900 dark:text-white">গ্রাম: {application.village}, ওয়ার্ড: {application.wardNo}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-500">ডাকঘর ও উপজেলা:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">বহেড়াতৈল (১৯৫০), সখিপুর, টাঙ্গাইল</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-500">সরকারি সনদ ফি:</span>
              <span className="font-black text-emerald-800 dark:text-emerald-400">৳{application.feeAmount}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-500">পরিশোধের মাধ্যম:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{application.paymentMethod || 'ইউপি কাউন্টার / ক্যাশ'}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">ট্রানজেকশন আইডি:</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{application.trxId || 'কাউন্টারে প্রদেয়'}</span>
            </div>
          </div>
        </div>

        {/* Official Instructions */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 space-y-1 mb-8">
          <p className="font-extrabold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>জরুরি নির্দেশনাবলী:</span>
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px] leading-relaxed">
            <li>আবেদনটি সংশ্লিষ্ট ওয়ার্ডের ইউপি সদস্য এবং সচিব মহোদয় কর্তৃক তথ্যাবলী যাচাইপূর্বক অনুমোদন করা হইবে।</li>
            <li>অনুমোদনের পর মোবাইল এসএমএস অথবা এই ট্র্যাকিং আইডির মাধ্যমে সরাসরি ডিজিটাল স্বাক্ষরিত প্রত্যয়নপত্র ডাউনলোড করিতে পারিবেন।</li>
            <li>যে কোনো জিজ্ঞাসায় ইউনিয়ন পরিষদ ডিজিটাল সেন্টারে রসিদের ট্র্যাকিং নম্বর প্রদর্শন করুন।</li>
          </ul>
        </div>

        {/* Footer Seal & Signature */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex items-end justify-between text-xs">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-700/40 flex items-center justify-center text-[10px] text-emerald-800 dark:text-emerald-400 font-bold mx-auto mb-1">
              ইউপি সিলমোহর
            </div>
            <span className="text-slate-500 text-[10px]">অফিসিয়াল সিল</span>
          </div>

          <div className="text-center space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">{config.secretaryName}</p>
            <p className="text-[10px] text-slate-500">{config.secretaryTitle || 'প্রশাসনিক কর্মকর্তা / সচিব'}</p>
            <p className="text-[10px] text-emerald-700 font-bold">{config.upName}</p>
          </div>
        </div>
      </div>

      {/* Action Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        {onTrackStatus && (
          <button
            type="button"
            onClick={onTrackStatus}
            className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
          >
            <span>আবেদন ট্র্যাক করুন</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        )}

        {onStartNew && (
          <button
            type="button"
            onClick={onStartNew}
            className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            + নতুন আরেকটি আবেদন করুন
          </button>
        )}
      </div>
    </div>
  );
};
