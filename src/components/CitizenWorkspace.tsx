import React, { useState, useEffect } from 'react';
import { 
  User, 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  RefreshCw,
  FolderOpen,
  MapPin,
  Calendar,
  XCircle,
  FileCheck
} from 'lucide-react';
import { CitizenAccountRecord, CitizenApplicationRecord, UnionParishadConfig, ApplicationStatus } from '../types';
import { IdentityMaskedValue } from './IdentityMaskedValue';
import { CertificateApplicationWizard } from './CertificateApplicationWizard';

interface CitizenWorkspaceProps {
  config: UnionParishadConfig;
  onOpenCertificate?: (certId: string) => void;
  onTrackApplication?: (appId: string) => void;
}

const SAMPLE_CITIZEN: CitizenAccountRecord = {
  id: 'cit_user_01',
  name: 'মোঃ কামরুল হাসান',
  father: 'মোঃ আব্দুল জলিল',
  mother: 'মোছাঃ রহিমা খাতুন',
  gender: 'পুরুষ',
  mobile: '01712345678',
  nid: '19922692015000456',
  birthNo: '19922692015000001',
  holdingNo: '১২৪/ক',
  village: 'বহেড়াতৈল',
  wardNo: '০৫',
  postOffice: 'বহেড়াতৈল',
  postCode: '১৯৫০',
  totalCertificates: 2,
  registeredAt: '2026-02-10'
};

const SAMPLE_CITIZEN_APPLICATIONS: CitizenApplicationRecord[] = [
  {
    id: 'APP-2026-BUP-0104',
    idempotencyKey: 'idem_sample_1',
    citizenId: 'cit_user_01',
    serviceId: 'citizenship',
    serviceLabel: 'নাগরিকত্ব সনদপত্র',
    serviceCategory: 'নাগরিকত্ব ও পরিচয়',
    schemaVersion: '2.0.0',
    applicantName: 'মোঃ কামরুল হাসান',
    applicantPhone: '01712345678',
    applicantNid: '19922692015000456',
    wardNo: '০৫',
    village: 'বহেড়াতৈল',
    fatherName: 'মোঃ আব্দুল জলিল',
    motherName: 'মোছাঃ রহিমা খাতুন',
    gender: 'পুরুষ',
    postOffice: 'বহেড়াতৈল',
    feeAmount: 50,
    paymentStatus: 'paid',
    paymentMethod: 'bKash',
    trxId: 'BKX9827361',
    fieldValues: {},
    attachments: [
      { id: 'att_1', name: 'NID_Card_Front_Back.pdf', fileType: 'application/pdf', sizeKb: 420, uploadedAt: '2026-10-25', verified: true }
    ],
    status: 'issued',
    statusNote: 'চেয়ারম্যান মহোদয়ের ডিজিটাল স্বাক্ষরে সনদ প্রস্তুত হইয়াছে।',
    auditTrail: [
      { status: 'submitted', note: 'আবেদন দাখিলকৃত।', performedBy: 'মোঃ কামরুল হাসান', timestamp: '2026-10-25T10:00:00Z' },
      { status: 'approved', note: 'যাচাই সম্পন্ন ও অনুমোদিত।', performedBy: 'সচিব', timestamp: '2026-10-26T09:30:00Z' },
      { status: 'issued', note: 'সনদপত্র ইস্যু সম্পন্ন।', performedBy: 'চেয়ারম্যান', timestamp: '2026-10-26T14:15:00Z' }
    ],
    certificateId: 'cert_1729000000',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-26T14:15:00Z'
  },
  {
    id: 'APP-2026-BUP-0219',
    idempotencyKey: 'idem_sample_2',
    citizenId: 'cit_user_01',
    serviceId: 'warish',
    serviceLabel: 'ওয়ারিশান / উত্তরাধিকার সনদপত্র',
    serviceCategory: 'উত্তরাধিকার ও পরিবার',
    schemaVersion: '2.0.0',
    applicantName: 'মোঃ কামরুল হাসান',
    applicantPhone: '01712345678',
    applicantNid: '19922692015000456',
    wardNo: '০৫',
    village: 'বহেড়াতৈল',
    fatherName: 'মোঃ আব্দুল জলিল',
    motherName: 'মোছাঃ রহিমা খাতুন',
    gender: 'পুরুষ',
    postOffice: 'বহেড়াতৈল',
    feeAmount: 100,
    paymentStatus: 'paid',
    paymentMethod: 'bKash',
    trxId: 'BKX9918231',
    fieldValues: { deceasedName: 'মরহুম আব্দুল জলিল', deathDate: '১২/০৪/২০২৪' },
    attachments: [
      { id: 'att_2', name: 'Death_Certificate.jpg', fileType: 'image/jpeg', sizeKb: 650, uploadedAt: '2026-10-27', verified: true }
    ],
    status: 'under_review',
    statusNote: 'ওয়ার্ড মেম্বার কর্তৃক সরেজমিনে ওয়ারিশ তালিকা পরীক্ষা করা হইতেছে।',
    auditTrail: [
      { status: 'submitted', note: 'আবেদন দাখিলকৃত।', performedBy: 'মোঃ কামরুল হাসান', timestamp: '2026-10-27T11:20:00Z' },
      { status: 'under_review', note: 'ইউপি সদস্যের নিকট প্রেরণকৃত।', performedBy: 'সচিব', timestamp: '2026-10-27T16:00:00Z' }
    ],
    createdAt: '2026-10-27T11:20:00Z',
    updatedAt: '2026-10-27T16:00:00Z'
  }
];

export const CitizenWorkspace: React.FC<CitizenWorkspaceProps> = ({
  config,
  onOpenCertificate,
  onTrackApplication
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'applications' | 'profile' | 'wizard'>('dashboard');
  const [citizenProfile, setCitizenProfile] = useState<CitizenAccountRecord>(SAMPLE_CITIZEN);
  const [applications, setApplications] = useState<CitizenApplicationRecord[]>(SAMPLE_CITIZEN_APPLICATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch applications from server API and localStorage
  const fetchMyApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.applications) && data.applications.length > 0) {
          // Merge with samples
          const merged = [...data.applications];
          SAMPLE_CITIZEN_APPLICATIONS.forEach(s => {
            if (!merged.some(m => m.id === s.id)) merged.push(s);
          });
          setApplications(merged);
        }
      }
    } catch (err) {
      console.warn('Applications fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const totalApps = applications.length;
  const underReviewCount = applications.filter(a => a.status === 'under_review' || a.status === 'submitted').length;
  const issuedCount = applications.filter(a => a.status === 'issued').length;

  const filteredApps = applications.filter(a => {
    const q = searchFilter.toLowerCase().trim();
    return !q || a.id.toLowerCase().includes(q) || a.serviceLabel.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-md border border-emerald-600/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-emerald-950 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
            {citizenProfile.name[0] || 'না'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white">{citizenProfile.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-amber-300 text-[11px] font-bold border border-amber-400/40">
                যাচাইকৃত নাগরিক
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-1 flex items-center gap-2">
              <span>গ্রাম: {citizenProfile.village}, ওয়ার্ড: {citizenProfile.wardNo}</span>
              <span>•</span>
              <span>মোবাইল: <IdentityMaskedValue value={citizenProfile.mobile} type="mobile" className="text-emerald-200" /></span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveSubTab('wizard')}
          className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
        >
          <PlusCircle className="w-4 h-4 text-emerald-950" />
          <span>নতুন সনদের জন্য আবেদন</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'dashboard'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          ড্যাশবোর্ড ওভারভিউ
        </button>

        <button
          onClick={() => setActiveSubTab('applications')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'applications'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>আমার আবেদন তালিকা</span>
          <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 text-[10px] font-mono">
            {totalApps}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          আমার নাগরিক প্রোফাইল
        </button>
      </div>

      {/* TAB 1: ড্যাশবোর্ড ওভারভিউ */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-2xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500">মোট দাখিলকৃত আবেদন</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalApps} টি</h3>
                <span className="text-[10px] text-blue-700 font-bold">অনলাইন ডাটাবেসে সংরক্ষিত</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500">চলমান যাচাই ও পেন্ডিং</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{underReviewCount} টি</h3>
                <span className="text-[10px] text-amber-700 font-bold">মেম্বার/সচিব পর্যালোচনায়</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500">ইস্যুকৃত প্রস্তুত সনদ</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{issuedCount} টি</h3>
                <span className="text-[10px] text-emerald-700 font-bold">ডিজিটাল ডাউনলোড ও QR সত্যায়িত</span>
              </div>
            </div>
          </div>

          {/* Recent Applications Quick Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                সাম্প্রতিক আবেদনসমূহের অগ্রগতি
              </h3>
              <button
                onClick={() => setActiveSubTab('applications')}
                className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>সব আবেদন দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{app.id}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        app.status === 'issued' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        app.status === 'under_review' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        'bg-blue-50 text-blue-800 border-blue-300'
                      }`}>
                        {app.status === 'issued' ? 'ইস্যুকৃত' : app.status === 'under_review' ? 'যাচাইাধীন' : 'দাখিলকৃত'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                      {app.serviceLabel}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{app.statusNote}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onTrackApplication && (
                      <button
                        onClick={() => onTrackApplication(app.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                      >
                        ট্র্যাক
                      </button>
                    )}
                    {app.status === 'issued' && app.certificateId && onOpenCertificate && (
                      <button
                        onClick={() => onOpenCertificate(app.certificateId!)}
                        className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-300" />
                        <span>সনদ ডাউনলোড</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: আমার আবেদন তালিকা */}
      {activeSubTab === 'applications' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                সকল দাখিলকৃত আবেদন
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                আপনার দাখিলকৃত সনদপত্রের বর্তমান স্ট্যাটাস ও ট্র্যাকিং হিস্টোরি।
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="আইডি বা সেবার নাম..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-600 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-emerald-800 dark:text-emerald-400">{app.id}</span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-bold">দাখিল: {new Date(app.createdAt).toLocaleDateString('bn-BD')}</span>
                  </div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {app.serviceLabel}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{app.statusNote}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onTrackApplication && (
                    <button
                      onClick={() => onTrackApplication(app.id)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      ট্র্যাকিং দেখুন
                    </button>
                  )}
                  {app.status === 'issued' && app.certificateId && onOpenCertificate && (
                    <button
                      onClick={() => onOpenCertificate(app.certificateId!)}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-300" />
                      <span>সনদপত্র গ্রহণ</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: আমার নাগরিক প্রোফাইল */}
      {activeSubTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              নাগরিক মাস্টার প্রোফাইল বিবরণ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              বহেড়াতৈল ইউনিয়ন পরিষদের কেন্দ্রীয় নাগরিক ডাটাবেসে সংরক্ষিত তথ্যাবলী।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 block font-bold">পূর্ণ নাম</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{citizenProfile.name}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 block font-bold">লিঙ্গ</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{citizenProfile.gender}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 block font-bold">পিতার নাম</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{citizenProfile.father}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 block font-bold">মাতার নাম</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{citizenProfile.mother}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 block font-bold">জাতীয় পরিচয়পত্র (NID)</span>
              <IdentityMaskedValue value={citizenProfile.nid} type="nid" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 block font-bold">মোবাইল নম্বর</span>
              <IdentityMaskedValue value={citizenProfile.mobile} type="mobile" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 block font-bold">স্থায়ী ঠিকানা</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                গ্রাম: {citizenProfile.village}, ওয়ার্ড নং {citizenProfile.wardNo}, ডাকঘর: {citizenProfile.postOffice} ({citizenProfile.postCode})
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 block font-bold">হোল্ডিং নম্বর</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{citizenProfile.holdingNo || 'উপলব্ধ নয়'}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: নতুন আবেদন উইজার্ড Modal or View */}
      {activeSubTab === 'wizard' && (
        <CertificateApplicationWizard
          config={config}
          initialCitizen={citizenProfile}
          onApplicationComplete={(app) => {
            setApplications(prev => [app, ...prev]);
            setActiveSubTab('applications');
          }}
          onBackToPortal={() => setActiveSubTab('dashboard')}
          onTrackStatus={(appId) => {
            if (onTrackApplication) onTrackApplication(appId);
          }}
        />
      )}
    </div>
  );
};
