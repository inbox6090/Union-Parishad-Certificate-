import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileCheck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  ShieldCheck, 
  Calendar, 
  User, 
  MapPin, 
  Download, 
  FileText, 
  Send, 
  CheckSquare, 
  Square,
  Award,
  RefreshCw,
  X
} from 'lucide-react';
import { 
  CitizenApplicationRecord, 
  ApplicationStatus, 
  UnionParishadConfig, 
  CertificateRecord 
} from '../types';
import { IdentityMaskedValue } from './IdentityMaskedValue';
import { authenticatedApiFetch } from '../lib/apiAuth';

interface ApplicationQueueProps {
  config: UnionParishadConfig;
  onCertificateIssued?: (cert: CertificateRecord) => void;
  onOpenCertificate?: (certId: string) => void;
}

const SAMPLE_APPLICATIONS: CitizenApplicationRecord[] = [
  {
    id: 'APP-2026-BUP-0104',
    idempotencyKey: 'idem_queue_1',
    citizenId: 'cit_101',
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
      { id: 'att_1', name: 'NID_Card.pdf', fileType: 'application/pdf', sizeKb: 340, uploadedAt: '2026-10-25', verified: true }
    ],
    status: 'approved',
    statusNote: 'ওয়ার্ড মেম্বারের সুপারিশ ও হোল্ডিং ট্যাক্স পরিশোধ নিশ্চিত হইয়াছে।',
    auditTrail: [
      { status: 'submitted', note: 'নাগরিক কর্তৃক অনলাইনে দাখিলকৃত।', performedBy: 'মোঃ কামরুল হাসান', timestamp: '2026-10-25T10:00:00Z' },
      { status: 'under_review', note: 'ওয়ার্ড ০৫ মেম্বার কর্তৃক পরীক্ষাধীন।', performedBy: 'সচিব', timestamp: '2026-10-26T09:30:00Z' },
      { status: 'approved', note: 'সচিব মহোদয় কর্তৃক অনুমোদিত।', performedBy: 'ইউপি সচিব', timestamp: '2026-10-27T11:00:00Z' }
    ],
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-27T11:00:00Z'
  },
  {
    id: 'APP-2026-BUP-0219',
    idempotencyKey: 'idem_queue_2',
    citizenId: 'cit_102',
    serviceId: 'warish',
    serviceLabel: 'ওয়ারিশান / উত্তরাধিকার সনদপত্র',
    serviceCategory: 'উত্তরাধিকার ও পরিবার',
    schemaVersion: '2.0.0',
    applicantName: 'মোছাঃ সেলিনা আক্তার',
    applicantPhone: '01819283746',
    applicantNid: '19872692015000789',
    wardNo: '০২',
    village: 'গড়গোবিন্দপুর',
    fatherName: 'মৃত মকবুল হোসেন',
    motherName: 'আনোয়ারা বেগম',
    gender: 'মহিলা',
    postOffice: 'বহেড়াতৈল',
    feeAmount: 100,
    paymentStatus: 'paid',
    paymentMethod: 'Nagad',
    trxId: 'NGD4910283',
    fieldValues: { deceasedName: 'মরহুম মকবুল হোসেন', deathDate: '১৫/০২/২০২২' },
    attachments: [
      { id: 'att_2', name: 'Death_Certificate.jpg', fileType: 'image/jpeg', sizeKb: 512, uploadedAt: '2026-10-27', verified: true }
    ],
    status: 'under_review',
    statusNote: 'সরেজমিনে উত্তরাধিকারীদের তালিকা ও ওয়ারিশগণ জীবিত আছেন কিনা পরীক্ষা করা হচ্ছে।',
    auditTrail: [
      { status: 'submitted', note: 'নাগরিক কর্তৃক দাখিলকৃত।', performedBy: 'মোছাঃ সেলিনা আক্তার', timestamp: '2026-10-27T08:15:00Z' },
      { status: 'under_review', note: 'ওয়ার্ড মেম্বারের নিকট প্রেরিত।', performedBy: 'ইউডিসি উদ্যোক্তা', timestamp: '2026-10-27T10:00:00Z' }
    ],
    createdAt: '2026-10-27T08:15:00Z',
    updatedAt: '2026-10-27T10:00:00Z'
  },
  {
    id: 'APP-2026-BUP-0342',
    idempotencyKey: 'idem_queue_3',
    citizenId: 'cit_103',
    serviceId: 'character',
    serviceLabel: 'চারিত্রিক সনদপত্র',
    serviceCategory: 'নাগরিকত্ব ও পরিচয়',
    schemaVersion: '2.0.0',
    applicantName: 'তানভীর আহমেদ',
    applicantPhone: '01912837465',
    applicantNid: '20012692015000111',
    wardNo: '০৮',
    village: 'বেতুয়া',
    fatherName: 'আজিজুর রহমান',
    motherName: 'তাহমিনা আক্তার',
    gender: 'পুরুষ',
    postOffice: 'বহেড়াতৈল',
    feeAmount: 50,
    paymentStatus: 'unpaid',
    paymentMethod: 'কাউন্টারে প্রদেয়',
    fieldValues: { purpose: 'বাংলাদেশ বিমানবাহিনীতে যোগদানের জন্য' },
    attachments: [],
    status: 'submitted',
    statusNote: 'নতুন দাখিলকৃত আবেদন। ইউপি সেবা ডেস্কে যাচাই অপেক্ষমান।',
    auditTrail: [
      { status: 'submitted', note: 'অনলাইন পোর্টাল হইতে সরাসরি আবেদন দাখিলকৃত।', performedBy: 'তানভীর আহমেদ', timestamp: '2026-10-28T09:30:00Z' }
    ],
    createdAt: '2026-10-28T09:30:00Z',
    updatedAt: '2026-10-28T09:30:00Z'
  }
];

export const ApplicationQueue: React.FC<ApplicationQueueProps> = ({
  config,
  onCertificateIssued,
  onOpenCertificate
}) => {
  const [applications, setApplications] = useState<CitizenApplicationRecord[]>([]);
  const [selectedApp, setSelectedApp] = useState<CitizenApplicationRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Verification Checklist State in Modal
  const [checkNid, setCheckNid] = useState(false);
  const [checkMemberRecommend, setCheckMemberRecommend] = useState(false);
  const [checkDocs, setCheckDocs] = useState(false);
  const [checkFee, setCheckFee] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedApiFetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.applications)) {
          setApplications(data.applications);
        }
      }
    } catch (err) {
      setApplications([]);
      console.warn('Private queue requires verified staff login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openAppModal = (app: CitizenApplicationRecord) => {
    setSelectedApp(app);
    setCheckNid(app.status === 'approved' || app.status === 'issued');
    setCheckMemberRecommend(app.status === 'approved' || app.status === 'issued');
    setCheckDocs(app.status === 'approved' || app.status === 'issued');
    setCheckFee(app.paymentStatus === 'paid');
    setActionNote('');
  };

  // Status Transition Action
  const handleUpdateStatus = async (newStatus: ApplicationStatus) => {
    if (!selectedApp) return;
    setIsProcessingAction(true);

    const now = new Date().toISOString();
    const updatedRecord: CitizenApplicationRecord = {
      ...selectedApp,
      status: newStatus,
      statusNote: actionNote || (newStatus === 'approved' ? 'ইউপি প্রশাসন কর্তৃক অনুমোদিত।' : newStatus === 'rejected' ? 'আবেদনটি বাতিল করা হইয়াছে।' : 'অতিরিক্ত তথ্য চাওয়া হইয়াছে।'),
      auditTrail: [
        ...selectedApp.auditTrail,
        {
          status: newStatus,
          note: actionNote || `স্ট্যাটাস পরিবর্তন: ${newStatus}`,
          performedBy: config.secretaryName || 'ইউপি অফিসার',
          role: 'প্রশাসনিক কর্মকর্তা',
          timestamp: now
        }
      ],
      updatedAt: now
    };

    try {
      const response = await authenticatedApiFetch(`/api/applications/${selectedApp.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: actionNote })
      });
      if (!response.ok) throw new Error('Status change rejected by server');
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? updatedRecord : a));
      setSelectedApp(updatedRecord);
    } catch (err) {
      console.warn('Unauthorized or invalid status change:', err);
      alert('স্ট্যাটাস পরিবর্তন করা যায়নি। Firebase Staff Login এবং যথাযথ অনুমতি প্রয়োজন।');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Issue Official Certificate directly from approved application
  const handleIssueCertificate = async () => {
    if (!selectedApp) return;
    setIsProcessingAction(true);

    try {
      const res = await authenticatedApiFetch(`/api/applications/${selectedApp.id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          issuedBy: config.chairmanName
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.certificate) {
          const updatedApp: CitizenApplicationRecord = {
            ...selectedApp,
            status: 'issued',
            certificateId: data.certificate.id,
            statusNote: 'ডিজিটাল কিউআর কোড ও স্বাক্ষরসহ প্রত্যয়নপত্র প্রস্তুত ও ইস্যুকৃত।',
            updatedAt: new Date().toISOString()
          };
          setApplications(prev => prev.map(a => a.id === selectedApp.id ? updatedApp : a));
          setSelectedApp(updatedApp);

          if (onCertificateIssued) {
            onCertificateIssued(data.certificate);
          }
        }
      }
    } catch (err) {
      console.warn('Error issuing certificate:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesWard = wardFilter === 'all' || app.wardNo === wardFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      app.id.toLowerCase().includes(q) || 
      app.applicantName.toLowerCase().includes(q) ||
      (app.applicantNid && app.applicantNid.includes(q)) ||
      app.serviceLabel.toLowerCase().includes(q);
    return matchesStatus && matchesWard && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 mb-1">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span>প্রশাসনিক যাচাই ও আবেদন কিউ (Application Queue)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            নাগরিক সনদ আবেদন ব্যবস্থাপনা ও যাচাই
          </h1>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="আবেদন আইডি, নাম বা NID..."
            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'all', label: 'সকল আবেদন' },
            { key: 'submitted', label: 'নতুন দাখিলকৃত' },
            { key: 'under_review', label: 'যাচাইাধীন' },
            { key: 'approved', label: 'অনুমোদিত' },
            { key: 'issued', label: 'ইস্যুকৃত' },
            { key: 'rejected', label: 'বাতিল' }
          ].map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === st.key
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Ward Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">ওয়ার্ড ফিল্টার:</span>
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">সকল ওয়ার্ড</option>
            {['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯'].map(w => (
              <option key={w} value={w}>ওয়ার্ড নং {w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">ট্র্যাকিং আইডি</th>
                <th className="py-3.5 px-4">আবেদনকারী</th>
                <th className="py-3.5 px-4">সেবা / প্রত্যয়ন</th>
                <th className="py-3.5 px-4">গ্রাম ও ওয়ার্ড</th>
                <th className="py-3.5 px-4">ফি স্ট্যাটাস</th>
                <th className="py-3.5 px-4">বর্তমান স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-right">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    কোনো আবেদন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                      {app.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">{app.applicantName}</div>
                      <div className="text-[10px] text-slate-400">
                        <IdentityMaskedValue value={app.applicantNid || app.applicantBirthNo} type="nid" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {app.serviceLabel}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {app.village} (ওয়ার্ড {app.wardNo})
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        app.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        ৳{app.feeAmount} ({app.paymentStatus === 'paid' ? 'পরিশোধিত' : 'বকেয়া'})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        app.status === 'issued' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        app.status === 'approved' ? 'bg-teal-50 text-teal-800 border-teal-300' :
                        app.status === 'under_review' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        app.status === 'rejected' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                        'bg-blue-50 text-blue-800 border-blue-300'
                      }`}>
                        {app.status === 'issued' ? 'সনদ প্রস্তুত' :
                         app.status === 'approved' ? 'অনুমোদিত' :
                         app.status === 'under_review' ? 'যাচাইাধীন' :
                         app.status === 'rejected' ? 'বাতিল' : 'দাখিলকৃত'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openAppModal(app)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-300" />
                        <span>যাচাই ও সিদ্ধান্ত</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Decision Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 font-extrabold">
                  {selectedApp.id}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedApp.serviceLabel} — আবেদন পর্যালোচনা
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block">আবেদনকারী:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{selectedApp.applicantName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">পিতা ও মাতা:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedApp.fatherName} • {selectedApp.motherName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">মোবাইল:</span>
                <IdentityMaskedValue value={selectedApp.applicantPhone} type="mobile" />
              </div>
              <div>
                <span className="text-slate-400 block">গ্রাম ও ওয়ার্ড:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedApp.village}, ওয়ার্ড {selectedApp.wardNo}</span>
              </div>
              <div>
                <span className="text-slate-400 block">NID / জন্ম নিবন্ধন:</span>
                <IdentityMaskedValue value={selectedApp.applicantNid || selectedApp.applicantBirthNo} type="nid" />
              </div>
              <div>
                <span className="text-slate-400 block">ফি:</span>
                <span className="font-black text-emerald-800 dark:text-emerald-400">৳{selectedApp.feeAmount} ({selectedApp.paymentStatus})</span>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
              <h4 className="font-black text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                <span>প্রশাসনিক যাচাই চেকলিস্ট (Verification Checklist)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkNid}
                    onChange={(e) => setCheckNid(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-600"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">জাতীয় পরিচয়পত্র / জন্ম সনদ যাচাইকৃত</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkMemberRecommend}
                    onChange={(e) => setCheckMemberRecommend(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-600"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">ওয়ার্ড মেম্বারের প্রাথমিক সুপারিশপ্রাপ্ত</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkDocs}
                    onChange={(e) => setCheckDocs(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-600"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">প্রয়োজনীয় সংযুক্তি ও দলিলপত্র প্রাপ্ত</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkFee}
                    onChange={(e) => setCheckFee(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-600"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">সরকারি সনদ ফি পরিশোধ নিশ্চিত</span>
                </label>
              </div>
            </div>

            {/* Note input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                প্রশাসনিক মন্তব্য / সিদ্ধান্ত নোট (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="যেমন: সকল কাগজপত্র সঠিক থাকায় চূড়ান্ত অনুমোদন প্রদান করা হইলো।"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Decision Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition cursor-pointer"
                >
                  প্রত্যাখ্যান করুন
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus('needs_information')}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition cursor-pointer"
                >
                  তথ্য সংশোধন চান
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedApp.status !== 'approved' && selectedApp.status !== 'issued' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={isProcessingAction}
                    className="px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow transition cursor-pointer"
                  >
                    অনুমোদন করুন
                  </button>
                )}

                {selectedApp.status === 'approved' && (
                  <button
                    type="button"
                    onClick={handleIssueCertificate}
                    disabled={isProcessingAction}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-800 to-indigo-950 hover:from-emerald-700 hover:to-indigo-900 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>ডিজিটাল সনদ তৈরি ও ইস্যু করুন</span>
                  </button>
                )}

                {selectedApp.status === 'issued' && selectedApp.certificateId && onOpenCertificate && (
                  <button
                    type="button"
                    onClick={() => onOpenCertificate(selectedApp.certificateId!)}
                    className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>ইস্যুকৃত সনদপত্র দেখুন</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
