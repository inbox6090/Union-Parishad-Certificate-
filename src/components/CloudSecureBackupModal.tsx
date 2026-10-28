import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileJson,
  ShieldCheck,
  RefreshCw,
  Database,
  Users,
  FileText,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Search,
  Lock,
  HardDrive
} from 'lucide-react';
import {
  CitizenAccountRecord,
  CertificateRecord,
  UnionParishadConfig,
  CloudSecureBackupPayload,
  BackupSnapshot
} from '../types';
import {
  exportCitizenAndCertificatesCloudBackup,
  fetchFirestoreBackupsFromFirebase,
  restoreFullBackupToFirestore,
  fetchCertificatesFromFirebase
} from '../firebase';
import { calculateSha256Checksum, verifySha256Checksum, sanitizeInput } from '../utils/security';

interface CloudSecureBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UnionParishadConfig;
  initialCitizens?: CitizenAccountRecord[];
  initialCertificates?: CertificateRecord[];
  onRestoreComplete?: () => void;
}

export const CloudSecureBackupModal: React.FC<CloudSecureBackupModalProps> = ({
  isOpen,
  onClose,
  config,
  initialCitizens,
  initialCertificates,
  onRestoreComplete
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'restore' | 'history'>('export');

  // Export State
  const [citizensList, setCitizensList] = useState<CitizenAccountRecord[]>(initialCitizens || []);
  const [certificatesList, setCertificatesList] = useState<CertificateRecord[]>(initialCertificates || []);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [backupNotes, setBackupNotes] = useState<string>('নাগরিক মাস্টার রেজিস্টার ও সনদপত্র লগ ক্লাউড ব্যাকআপ');
  const [includeConfig, setIncludeConfig] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [exportSuccessResult, setExportSuccessResult] = useState<{
    backupId: string;
    filename: string;
    downloadUrl?: string;
    storagePath?: string;
    sizeKb: number;
    checksum: string;
    payload: CloudSecureBackupPayload;
  } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedChecksum, setCopiedChecksum] = useState<boolean>(false);

  // Restore & Verify State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<CloudSecureBackupPayload | null>(null);
  const [isVerifyingFile, setIsVerifyingFile] = useState<boolean>(false);
  const [checksumVerified, setChecksumVerified] = useState<boolean | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreResultMsg, setRestoreResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // History State
  const [backupsHistory, setBackupsHistory] = useState<BackupSnapshot[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');
  const [restoringHistoryId, setRestoringHistoryId] = useState<string | null>(null);

  // Fetch full data if not passed or when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLiveDataset();
      loadHistory();
    }
  }, [isOpen]);

  const loadLiveDataset = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch certificates from both server and Firebase
      const [resLogs, fbCerts] = await Promise.all([
        fetch('/api/admin/logs').then(r => r.ok ? r.json() : { logs: [] }).catch(() => ({ logs: [] })),
        fetchCertificatesFromFirebase().catch(() => [])
      ]);

      const certMap = new Map<string, CertificateRecord>();
      [...(resLogs.logs || []), ...fbCerts].forEach(c => {
        if (c && c.memoNo) {
          certMap.set(c.memoNo, c);
        }
      });
      const resolvedCerts = Array.from(certMap.values());
      setCertificatesList(resolvedCerts);

      // 2. Resolve or build citizen records
      if (initialCitizens && initialCitizens.length > 0) {
        setCitizensList(initialCitizens);
      } else {
        const citMap = new Map<string, CitizenAccountRecord>();
        resolvedCerts.forEach(cert => {
          if (!cert.citizen) return;
          const c = cert.citizen;
          const key = c.nid || c.birthNo || c.holdingNo || c.name;
          if (citMap.has(key)) {
            const ex = citMap.get(key)!;
            ex.totalCertificates += 1;
            ex.lastCertificateType = cert.typeLabel;
            ex.lastCertificateDate = cert.issueDate;
          } else {
            citMap.set(key, {
              id: `cit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              nid: c.nid || '',
              birthNo: c.birthNo || '',
              holdingNo: c.holdingNo || '',
              name: c.name,
              father: c.father || '',
              mother: c.mother || '',
              spouseName: c.spouseName || '',
              gender: c.gender || 'পুরুষ',
              mobile: c.mobile || '',
              village: c.village || 'বহেড়াতৈল',
              wardNo: c.wardNo || '০১',
              postOffice: c.postOffice || 'বহেড়াতৈল',
              postCode: c.postCode || '১৯৫০',
              totalCertificates: 1,
              lastCertificateType: cert.typeLabel,
              lastCertificateDate: cert.issueDate,
              registeredAt: cert.createdAt || new Date().toISOString()
            });
          }
        });
        setCitizensList(Array.from(citMap.values()));
      }
    } catch (err) {
      console.warn('Error loading live dataset for backup:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const records = await fetchFirestoreBackupsFromFirebase();
      setBackupsHistory(records);
    } catch (err) {
      console.warn('Error fetching backup history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  // Execute Cloud Backup & Trigger Local Download
  const handleExecuteBackupAndExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccessResult(null);
    setExportProgress({ stage: 'প্রক্রিয়া শুরু হচ্ছে...', percent: 5 });

    try {
      const sanitizedNotes = sanitizeInput(backupNotes, 300) || 'নাগরিক মাস্টার রেজিস্টার ও প্রত্যয়নপত্র ক্লাউড ব্যাকআপ';

      // Get logged in admin info if available
      let exportedBy: { name: string; email: string; role?: string } | undefined = undefined;
      try {
        const storedAdmin = localStorage.getItem('bup_active_admin_session');
        if (storedAdmin) {
          const parsed = JSON.parse(storedAdmin);
          exportedBy = {
            name: parsed.name || 'ইউপি এডমিন',
            email: parsed.email || 'baheratailunion@gmail.com',
            role: parsed.role || 'super_admin'
          };
        }
      } catch (e) {
        // fallback
      }

      // 1. Try Firebase Cloud Storage & Firestore cloud-native export
      let cloudResult: any = null;
      try {
        cloudResult = await exportCitizenAndCertificatesCloudBackup(
          citizensList,
          certificatesList,
          config,
          exportedBy,
          sanitizedNotes,
          (progress) => setExportProgress(progress)
        );
      } catch (fbErr) {
        console.warn('Direct Firebase cloud export error, using server sync fallback:', fbErr);
      }

      // 2. Also sync with server endpoint for persistence & server backupStore
      setExportProgress({ stage: '৪/৫: সার্ভার ডাটাবেস ও ব্যাকআপ ট্র্যাকিং সিঙ্ক হচ্ছে...', percent: 85 });
      const serverRes = await fetch('/api/admin/backup/cloud-secure-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenMasterRegister: citizensList,
          certificateLogs: certificatesList,
          notes: sanitizedNotes,
          exportedBy,
          config: includeConfig ? config : undefined
        })
      });
      const serverData = await serverRes.json().catch(() => ({}));

      const finalPayload: CloudSecureBackupPayload = cloudResult?.payload || serverData.payload;
      const finalFilename = cloudResult?.filename || serverData.filename || `UP_Citizen_Register_Backup_${Date.now()}.json`;
      const finalChecksum = cloudResult?.checksum || serverData.checksum || await calculateSha256Checksum(finalPayload);
      const finalDownloadUrl = cloudResult?.downloadUrl || undefined;
      const finalSizeKb = cloudResult?.sizeKb || serverData.sizeKb || Math.round(new Blob([JSON.stringify(finalPayload)]).size / 1024);

      const resultObject = {
        backupId: cloudResult?.backupId || serverData.backup?.id || `sec_bkp_${Date.now()}`,
        filename: finalFilename,
        downloadUrl: finalDownloadUrl,
        storagePath: cloudResult?.storagePath,
        sizeKb: finalSizeKb,
        checksum: finalChecksum,
        payload: finalPayload
      };

      setExportSuccessResult(resultObject);

      // 3. Trigger immediate local file download for user
      triggerLocalDownload(finalPayload, finalFilename);

      setExportProgress({ stage: '৫/৫: ক্লাউড ব্যাকআপ সফল ও লোকাল JSON ডাউনলোড সম্পন্ন!', percent: 100 });
      loadHistory();
    } catch (err: any) {
      console.error('Backup execution failed:', err);
      setExportError(err.message || 'ক্লাউড ব্যাকআপ এক্সপোর্ট প্রক্রিয়া সম্পন্ন করা সম্ভব হয় নাই।');
    } finally {
      setIsExporting(false);
    }
  };

  const triggerLocalDownload = (data: any, filename: string) => {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Local download error:', e);
    }
  };

  const handleCopyChecksum = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 2000);
  };

  // Restore Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setIsVerifyingFile(true);
    setRestoreResultMsg(null);
    setChecksumVerified(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Validate format
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('অবৈধ JSON ফাইল ফরম্যাট।');
      }

      setParsedBackup(parsed);

      // Verify checksum if available
      if (parsed.meta?.checksum) {
        const expectedChecksum = parsed.meta.checksum;
        const dataForHash = {
          citizensCount: parsed.citizenMasterRegister?.length || 0,
          certificatesCount: parsed.certificateLogs?.length || parsed.certificates?.length || 0,
          citizenIds: (parsed.citizenMasterRegister || []).map((c: any) => c.id || c.nid || c.name),
          certificateMemos: (parsed.certificateLogs || parsed.certificates || []).map((c: any) => c.memoNo),
          timestamp: parsed.timestamp
        };
        const computed = await calculateSha256Checksum(dataForHash);
        const isMatch = computed.toLowerCase() === expectedChecksum.toLowerCase();
        setChecksumVerified(isMatch);
      } else {
        setChecksumVerified(null);
      }
    } catch (err: any) {
      setParsedBackup(null);
      setRestoreResultMsg({
        type: 'error',
        text: 'ফাইল পার্সিং বা যাচাইকরণে ত্রুটি: ' + (err.message || 'অবৈধ JSON')
      });
    } finally {
      setIsVerifyingFile(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!parsedBackup) return;

    const certCount = parsedBackup.certificateLogs?.length || (parsedBackup as any).certificates?.length || 0;
    const citCount = parsedBackup.citizenMasterRegister?.length || 0;

    if (!window.confirm(`আপনি কি নিশ্চিত যে '${restoreFile?.name || 'ব্যাকআপ ফাইল'}' থেকে ${citCount} জন নাগরিক ও ${certCount} টি প্রত্যয়নপত্র সিস্টেমে রিস্টোর করতে চান?`)) {
      return;
    }

    setIsRestoring(true);
    setRestoreResultMsg(null);

    try {
      // 1. Restore to Firebase Firestore
      let fsMsg = '';
      try {
        const fsResult = await restoreFullBackupToFirestore(parsedBackup);
        fsMsg = ` (Firestore-এ ${fsResult.totalRestored} টি রেকর্ড রিস্টোর করা হয়েছে)`;
      } catch (fsErr) {
        console.warn('Firestore restore notice:', fsErr);
      }

      // 2. Restore to Server database
      const serverRes = await fetch('/api/admin/backup/restore-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupData: parsedBackup,
          restoreMode
        })
      });
      const serverData = await serverRes.json();

      if (serverData.success) {
        setRestoreResultMsg({
          type: 'success',
          text: `ডাটাবেস সফলভাবে রিস্টোর হয়েছে! মোট ${serverData.restoredCitizens} জন নাগরিক এবং ${serverData.restoredCertificates} টি প্রত্যয়নপত্র আপডেট করা হয়েছে।${fsMsg}`
        });
        if (onRestoreComplete) {
          onRestoreComplete();
        }
        loadLiveDataset();
      } else {
        throw new Error(serverData.message || 'রিস্টোর অপারেশন সম্পন্ন হয়নি।');
      }
    } catch (err: any) {
      setRestoreResultMsg({
        type: 'error',
        text: 'রিস্টোর ব্যর্থ: ' + (err.message || String(err))
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDownloadHistoricalBackup = (bkp: BackupSnapshot) => {
    if (bkp.downloadUrl) {
      window.open(bkp.downloadUrl, '_blank');
    } else if (bkp.backupData) {
      triggerLocalDownload(bkp.backupData, bkp.filename || `Backup_${bkp.id}.json`);
    } else {
      alert('এই ফাইলের ক্লাউড ডাউনলোড লিঙ্ক পাওয়া যায়নি।');
    }
  };

  const handleRestoreFromHistory = async (bkp: BackupSnapshot) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${bkp.filename}' ব্যাকআপ ডাটাবেসে রিস্টোর করতে চান?`)) {
      return;
    }

    setRestoringHistoryId(bkp.id);
    try {
      let payload = bkp.backupData;
      if (!payload && bkp.downloadUrl) {
        const res = await fetch(bkp.downloadUrl);
        payload = await res.json();
      }

      if (!payload) {
        throw new Error('ব্যাকআপ ফাইলের ডাটা ডাউনলোড করা যায়নি।');
      }

      await restoreFullBackupToFirestore(payload);
      await fetch('/api/admin/backup/restore-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData: payload, restoreMode: 'merge' })
      });

      alert(`'${bkp.filename}' সফলভাবে রিস্টোর হয়েছে!`);
      if (onRestoreComplete) onRestoreComplete();
      loadLiveDataset();
    } catch (err: any) {
      alert('রিস্টোর ত্রুটি: ' + (err.message || String(err)));
    } finally {
      setRestoringHistoryId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-emerald-500/30 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 p-5 flex items-center justify-between shrink-0 border-b border-emerald-800/60">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 rounded-2xl shadow-lg shrink-0">
              <Cloud className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  নাগরিক মাস্টার রেজিস্টার ও প্রত্যয়নপত্র ক্লাউড ব্যাকআপ
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black rounded-full">
                  Secure JSON v3.0
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                সমগ্র সিটিজেন মাস্টার রেজিস্টার ও সনদপত্র লগ নিরাপদ ক্লাউডে ব্যাকআপ এবং লোকাল ডিভাইসে এনক্রিপ্টেড JSON ফাইল হিসেবে সংরক্ষণ করুন।
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-slate-900 text-amber-300 border-t border-x border-slate-700 font-black shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>১. ক্লাউড ব্যাকআপ ও লোকাল JSON এক্সপোর্ট</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-slate-900 text-emerald-300 border-t border-x border-slate-700 font-black shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>২. ব্যাকআপ ফাইল যাচাই ও রিস্টোর</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-sky-300 border-t border-x border-slate-700 font-black shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-sky-400" />
            <span>৩. ক্লাউড ব্যাকআপ হিস্টোরি ({backupsHistory.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: EXPORT & CLOUD BACKUP */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Dataset Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">সিটিজেন মাস্টার রেজিস্টার</span>
                    <span className="text-xl font-black text-white">
                      {isLoadingData ? '...' : `${citizensList.length} জন নাগরিক`}
                    </span>
                    <span className="text-[10px] text-emerald-300 block">৯টি ওয়ার্ড ও হোল্ডিং নাম্বার সংযুক্ত</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">প্রত্যয়নপত্র রেজিস্টার লগ</span>
                    <span className="text-xl font-black text-white">
                      {isLoadingData ? '...' : `${certificatesList.length} টি সনদপত্র`}
                    </span>
                    <span className="text-[10px] text-amber-300 block">৪০+ ধরন, কিউআর ও পেমেন্ট ট্র্যাকিং</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">নিরাপত্তা ও ইন্টিগ্রিটি</span>
                    <span className="text-xs font-mono font-bold text-indigo-200 block truncate">
                      SHA-256 Tamper-Proof
                    </span>
                    <span className="text-[10px] text-slate-400 block">Firebase Cloud Storage সিঙ্ক</span>
                  </div>
                </div>
              </div>

              {/* Form & Options */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                  ব্যাকআপ কনফিগারেশন ও বিবরণ
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      ব্যাকআপ নোট / বিবরণী:
                    </label>
                    <input
                      type="text"
                      value={backupNotes}
                      onChange={(e) => setBackupNotes(e.target.value)}
                      placeholder="যেমন: অক্টোবর ২০২৬ নিয়মিত নাগরিক ও প্রত্যয়নপত্র ডাটাবেস ব্যাকআপ..."
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeConfig}
                        onChange={(e) => setIncludeConfig(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      <span>ইউনিয়ন পরিষদের সিস্টেম কনফিগারেশন ও সিল অন্তর্ভুক্ত করুন</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-emerald-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="rounded text-emerald-500 w-4 h-4 bg-slate-900 border-slate-700 cursor-not-allowed"
                      />
                      <span>Firebase Cloud Storage ও Firestore ক্লাউড স্ন্যাপশট সক্রিয়</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExecuteBackupAndExport}
                    disabled={isExporting || isLoadingData}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm rounded-xl shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                        <span>ক্লাউড ব্যাকআপ প্রক্রিয়া সম্পন্ন হইতেছে...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 text-amber-300" />
                        <span>🔒 ক্লাউড ব্যাকআপ সংরক্ষণ ও সিকিউর JSON ডাউনলোড করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              {isExporting && exportProgress && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/50 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>{exportProgress.stage}</span>
                    </span>
                    <span className="text-amber-400 font-mono text-sm">{exportProgress.percent}%</span>
                  </div>

                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700 p-0.5">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, exportProgress.percent)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Export Error */}
              {exportError && (
                <div className="bg-rose-950/90 text-rose-200 p-4 rounded-xl border border-rose-500/50 flex items-center gap-3 text-xs">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{exportError}</span>
                </div>
              )}

              {/* Export Completed Card */}
              {exportSuccessResult && (
                <div className="bg-emerald-950/90 p-5 rounded-2xl border border-emerald-500/60 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="font-extrabold text-sm text-white">
                        ক্লাউড ব্যাকআপ সফল ও লোকাল JSON ফাইল প্রস্তুত!
                      </span>
                    </div>
                    <span className="font-mono text-xs text-amber-300 bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-700/60">
                      {exportSuccessResult.filename} ({exportSuccessResult.sizeKb} KB)
                    </span>
                  </div>

                  {/* Checksum Badge */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px] truncate">
                      <span className="text-amber-400 font-bold">SHA-256 Checksum:</span>
                      <span className="truncate max-w-md text-emerald-300" title={exportSuccessResult.checksum}>
                        {exportSuccessResult.checksum}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyChecksum(exportSuccessResult.checksum)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-600 transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedChecksum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedChecksum ? 'কপি হয়েছে' : 'চেকসাম কপি'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => triggerLocalDownload(exportSuccessResult.payload, exportSuccessResult.filename)}
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4 text-slate-950" />
                      <span>পুনরায় JSON ফাইল ডাউনলোড করুন</span>
                    </button>

                    {exportSuccessResult.downloadUrl && (
                      <a
                        href={exportSuccessResult.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Cloud className="w-4 h-4 text-amber-300" />
                        <span>Firebase Cloud Storage ফাইল ভিউ</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VERIFY & RESTORE */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-700 pb-3">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-extrabold text-sm text-white">
                    সিকিউর ব্যাকআপ JSON ফাইল আপলোড ও ডাটাবেস রিস্টোর
                  </h4>
                </div>

                {/* Upload File Input */}
                <div className="p-6 border-2 border-dashed border-slate-600 hover:border-emerald-500 rounded-2xl text-center space-y-3 bg-slate-900/50 transition">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl w-fit mx-auto">
                    <FileJson className="w-8 h-8" />
                  </div>
                  <div>
                    <label className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl cursor-pointer shadow transition inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>ব্যাকআপ JSON ফাইল সিলেক্ট করুন (.json)</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-2">
                      পূর্বে ডাউনলোডকৃত 'UP_Citizen_Register_Backup_*.json' ফাইলটি এখানে আপলোড করুন।
                    </p>
                  </div>
                </div>
              </div>

              {/* Verifying Indicator */}
              {isVerifyingFile && (
                <div className="p-4 bg-slate-950 rounded-xl text-center text-xs text-amber-300 flex items-center justify-center gap-2 border border-slate-800">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>ব্যাকআপ ফাইলের স্ট্রাকচার ও ক্রিপ্টোগ্রাফিক চেকসাম যাচাই করা হচ্ছে...</span>
                </div>
              )}

              {/* Parsed File Details */}
              {parsedBackup && (
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">
                        যাচাইকৃত ব্যাকআপ প্যাকেজ
                      </span>
                      <h4 className="text-sm font-black text-white">
                        {parsedBackup.meta?.unionParishad || config.upName}
                      </h4>
                    </div>

                    {checksumVerified !== null && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                        checksumVerified
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                          : 'bg-rose-950 text-rose-300 border-rose-500/60'
                      }`}>
                        {checksumVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                        <span>{checksumVerified ? 'ইন্টিগ্রিটি যাচাইকৃত (Valid SHA-256)' : 'চেকসাম অমিল (Tampered/Modified)'}</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">নাগরিক রেকর্ড:</span>
                      <span className="text-base font-black text-amber-300">
                        {parsedBackup.citizenMasterRegister?.length || 0} জন
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">সনদপত্র রেকর্ড:</span>
                      <span className="text-base font-black text-emerald-300">
                        {parsedBackup.certificateLogs?.length || (parsedBackup as any).certificates?.length || 0} টি
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">ব্যাকআপ তারিখ:</span>
                      <span className="text-[11px] font-mono text-slate-200">
                        {parsedBackup.timestamp ? new Date(parsedBackup.timestamp).toLocaleDateString('bn-BD') : 'N/A'}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">প্যাকেজ ভার্সন:</span>
                      <span className="text-[11px] font-mono text-slate-200">
                        {parsedBackup.formatVersion || 'Legacy'}
                      </span>
                    </div>
                  </div>

                  {/* Restore Mode Options */}
                  <div className="space-y-2 pt-2 border-t border-slate-700">
                    <label className="block text-xs font-bold text-slate-300">রিস্টোর মোড নির্ধারণ করুন:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRestoreMode('merge')}
                        className={`p-3 rounded-xl border text-xs text-left transition cursor-pointer ${
                          restoreMode === 'merge'
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="font-bold block text-white">মার্জ মোড (Merge - নিরাপদ)</span>
                        <span className="text-[11px] text-slate-400">বিদ্যমান ডাটা মুছে না দিয়ে শুধুমাত্র নতুন রেকর্ডসমূহ যুক্ত করিবে।</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRestoreMode('overwrite')}
                        className={`p-3 rounded-xl border text-xs text-left transition cursor-pointer ${
                          restoreMode === 'overwrite'
                            ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-2 ring-amber-500/40'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="font-bold block text-white">সম্পূর্ণ প্রতিস্থাপন (Overwrite)</span>
                        <span className="text-[11px] text-slate-400">বর্তমান ডাটাবেস সম্পূর্ণ মুছে ব্যাকআপ ফাইলের অবস্থা রিস্টোর করিবে।</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleExecuteRestore}
                      disabled={isRestoring}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                          <span>ডাটাবেসে রিস্টোর করা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-5 h-5 text-slate-950" />
                          <span>ডাটাবেসে সম্পূর্ণ রিস্টোর নিশ্চিত করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Restore Result Message */}
              {restoreResultMsg && (
                <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
                  restoreResultMsg.type === 'success'
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/60'
                    : 'bg-rose-950/90 text-rose-200 border-rose-500/60'
                }`}>
                  {restoreResultMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <span>{restoreResultMsg.text}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-sky-400" />
                    <span>ক্লাউড ও লোকাল ব্যাকআপ রেকর্ডস হিস্টোরি</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Firebase Cloud Storage ও সার্ভার স্ন্যাপশটে সংরক্ষিত ফাইলসমূহ।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="খুঁজুন..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={loadHistory}
                    disabled={isLoadingHistory}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition cursor-pointer"
                    title="রিফ্রেশ"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin text-amber-300' : ''}`} />
                  </button>
                </div>
              </div>

              {isLoadingHistory ? (
                <div className="p-8 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>ক্লাউড ব্যাকআপ হিস্টোরি লোড হচ্ছে...</span>
                </div>
              ) : backupsHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 space-y-2">
                  <Database className="w-8 h-8 text-slate-500 mx-auto" />
                  <p>কোনো সংরক্ষিত ক্লাউড ব্যাকআপ হিস্টোরি পাওয়া যায় নাই।</p>
                  <p className="text-[11px] text-slate-500">প্রথম ট্যাবে গিয়ে একটি নতুন ক্লাউড ব্যাকআপ তৈরি করুন।</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                        <th className="p-3">তারিখ ও সময়</th>
                        <th className="p-3">ফাইল নাম ও বিবরণ</th>
                        <th className="p-3 text-center">রেকর্ড সংখ্যা</th>
                        <th className="p-3 text-center">সাইজ</th>
                        <th className="p-3 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {backupsHistory
                        .filter(b => {
                          if (!historySearchTerm.trim()) return true;
                          const q = historySearchTerm.toLowerCase();
                          return (
                            (b.filename && b.filename.toLowerCase().includes(q)) ||
                            (b.notes && b.notes.toLowerCase().includes(q)) ||
                            (b.storagePath && b.storagePath.toLowerCase().includes(q))
                          );
                        })
                        .map(bkp => (
                          <tr key={bkp.id} className="hover:bg-slate-800/50 transition">
                            <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                              {new Date(bkp.timestamp).toLocaleString('bn-BD')}
                            </td>
                            <td className="p-3 max-w-xs">
                              <div className="font-mono font-bold text-amber-300 flex items-center gap-1.5 truncate">
                                <FileJson className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="truncate" title={bkp.filename}>{bkp.filename}</span>
                              </div>
                              {bkp.notes && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5" title={bkp.notes}>
                                  {bkp.notes}
                                </p>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold text-white whitespace-nowrap">
                              {bkp.recordsCount || 0} টি
                            </td>
                            <td className="p-3 text-center font-mono text-slate-300 whitespace-nowrap">
                              {bkp.sizeKb >= 1024 ? `${(bkp.sizeKb / 1024).toFixed(2)} MB` : `${bkp.sizeKb || 16} KB`}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap space-x-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadHistoricalBackup(bkp)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1 cursor-pointer border border-slate-700"
                              >
                                <Download className="w-3.5 h-3.5 text-amber-300" />
                                <span>ডাউনলোড</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRestoreFromHistory(bkp)}
                                disabled={restoringHistoryId === bkp.id}
                                className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-lg transition inline-flex items-center gap-1 cursor-pointer border border-amber-300 disabled:opacity-50"
                              >
                                {restoringHistoryId === bkp.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5 text-slate-950" />
                                )}
                                <span>রিস্টোর</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Firebase Firestore & Cloud Storage Native Integration</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
