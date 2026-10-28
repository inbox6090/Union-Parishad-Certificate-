import React, { useState, useEffect, useId } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  FileCheck, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  User, 
  Phone, 
  Lock, 
  CreditCard, 
  FileText, 
  Calendar, 
  MapPin, 
  HelpCircle, 
  Loader2,
  Check,
  Building2,
  Plus,
  Paperclip
} from 'lucide-react';
import { CERTIFICATE_TYPES, CERTIFICATE_CATEGORIES } from '../data/certificateTypes';
import { 
  CertificateTypeConfig, 
  UnionParishadConfig, 
  CitizenAccountRecord, 
  CitizenApplicationRecord, 
  ApplicationAttachment,
  ApplicationStatus
} from '../types';
import { KNOWN_VILLAGES, WARDS } from '../data/villages';
import { IdentityMaskedValue } from './IdentityMaskedValue';
import { ApplicationReceipt } from './ApplicationReceipt';
import { WarishTableBuilder } from './WarishTableBuilder';

interface CertificateApplicationWizardProps {
  config: UnionParishadConfig;
  initialServiceKey?: string;
  initialCitizen?: CitizenAccountRecord | null;
  onApplicationComplete?: (application: CitizenApplicationRecord) => void;
  onBackToPortal?: () => void;
  onTrackStatus?: (appId: string) => void;
}

const STEPS = [
  { step: 0, title: 'নাগরিক সম্মতি', desc: 'আইডি ও সম্মতিপত্র' },
  { step: 1, title: 'সেবা নির্বাচন', desc: 'সনদের ধরন ও ফি' },
  { step: 2, title: 'নাগরিক প্রোফাইল', desc: 'মাস্টার ডাটা ও ঠিকানা' },
  { step: 3, title: 'প্রয়োজনীয় তথ্য ও প্রমাণক', desc: 'ফিল্ড ও সংযুক্তি' },
  { step: 4, title: 'রিভিউ ও অঙ্গীকারনামা', desc: 'চূড়ান্ত ঘোষণা' },
  { step: 5, title: 'আবেদন রসিদ', desc: 'ট্র্যাকিং আইডি' }
];

export const CertificateApplicationWizard: React.FC<CertificateApplicationWizardProps> = ({
  config,
  initialServiceKey,
  initialCitizen,
  onApplicationComplete,
  onBackToPortal,
  onTrackStatus
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialServiceKey ? 2 : 0);
  const [idempotencyKey] = useState<string>(() => `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Step 0: Consent & Auth State
  const [hasConsented, setHasConsented] = useState<boolean>(true);
  const [authMobile, setAuthMobile] = useState<string>(initialCitizen?.mobile || '');
  const [authNid, setAuthNid] = useState<string>(initialCitizen?.nid || '');

  // Step 1: Selected Service
  const [selectedServiceKey, setSelectedServiceKey] = useState<string>(initialServiceKey || 'citizenship');
  const selectedService = CERTIFICATE_TYPES.find(s => s.key === selectedServiceKey) || CERTIFICATE_TYPES[0];

  // Step 2: Citizen Profile Form
  const [citizenName, setCitizenName] = useState<string>(initialCitizen?.name || '');
  const [fatherName, setFatherName] = useState<string>(initialCitizen?.father || '');
  const [motherName, setMotherName] = useState<string>(initialCitizen?.mother || '');
  const [spouseName, setSpouseName] = useState<string>(initialCitizen?.spouseName || '');
  const [gender, setGender] = useState<'পুরুষ' | 'মহিলা' | 'হিজরা'>(initialCitizen?.gender || 'পুরুষ');
  const [mobile, setMobile] = useState<string>(initialCitizen?.mobile || '');
  const [nid, setNid] = useState<string>(initialCitizen?.nid || '');
  const [birthNo, setBirthNo] = useState<string>(initialCitizen?.birthNo || '');
  const [holdingNo, setHoldingNo] = useState<string>(initialCitizen?.holdingNo || '');
  const [village, setVillage] = useState<string>(initialCitizen?.village || 'বহেড়াতৈল');
  const [wardNo, setWardNo] = useState<string>(initialCitizen?.wardNo || '০৫');
  const [postOffice, setPostOffice] = useState<string>(initialCitizen?.postOffice || 'বহেড়াতৈল');
  const [postCode, setPostCode] = useState<string>(initialCitizen?.postCode || '১৯৫০');

  // Step 3: Service-specific Dynamic Fields & Tables
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [tableValues, setTableValues] = useState<Record<string, string[][]>>({});
  const [attachments, setAttachments] = useState<ApplicationAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 4: Payment & Declaration
  const [paymentMethod, setPaymentMethod] = useState<string>('bKash');
  const [trxId, setTrxId] = useState<string>('');
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Step 5: Submitted Result
  const [submittedApp, setSubmittedApp] = useState<CitizenApplicationRecord | null>(null);

  // Sync initial citizen props if provided
  useEffect(() => {
    if (initialCitizen) {
      setCitizenName(initialCitizen.name || '');
      setFatherName(initialCitizen.father || '');
      setMotherName(initialCitizen.mother || '');
      setSpouseName(initialCitizen.spouseName || '');
      setGender(initialCitizen.gender || 'পুরুষ');
      setMobile(initialCitizen.mobile || '');
      setNid(initialCitizen.nid || '');
      setBirthNo(initialCitizen.birthNo || '');
      setHoldingNo(initialCitizen.holdingNo || '');
      setVillage(initialCitizen.village || 'বহেড়াতৈল');
      setWardNo(initialCitizen.wardNo || '০৫');
    }
  }, [initialCitizen]);

  const serviceFee = (config.typeFeeOverrides && config.typeFeeOverrides[selectedServiceKey] !== undefined)
    ? config.typeFeeOverrides[selectedServiceKey]
    : ((config.categoryFees && config.categoryFees[selectedService.category] !== undefined)
        ? config.categoryFees[selectedService.category]
        : (config.certificateFeeDefault || 50));

  // Attachment upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    const newAttachments: ApplicationAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`'${file.name}' ফাইলের আকার ৫ মেগাবাইটের বেশি। অনুগ্রহ করে ছোট ফাইল আপলোড করুন।`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        newAttachments.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          fileType: file.type || 'application/octet-stream',
          sizeKb: Math.round(file.size / 1024),
          dataUrl: reader.result as string,
          uploadedAt: new Date().toISOString(),
          verified: true
        });

        if (newAttachments.length === files.length) {
          setAttachments(prev => [...prev, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Step Validation
  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];
    if (currentStep === 0) {
      if (!hasConsented) errors.push('নাগরিক তথ্য যাচাই ও ব্যবহারের সম্মতিতে টিক চিহ্ন দেওয়া আবশ্যক।');
    } else if (currentStep === 1) {
      if (!selectedServiceKey) errors.push('দয়া করে একটি সনদ বা সেবা নির্বাচন করুন।');
    } else if (currentStep === 2) {
      if (!citizenName.trim()) errors.push('আবেদনকারীর পূর্ণ নাম লিখুন।');
      if (!fatherName.trim()) errors.push('পিতার নাম লিখুন।');
      if (!motherName.trim()) errors.push('মাতার নাম লিখুন।');
      if (!mobile.trim() || mobile.length < 11) errors.push('১১ ডিজিটের সঠিক মোবাইল নম্বর লিখুন।');
      if (!nid.trim() && !birthNo.trim()) errors.push('জাতীয় পরিচয়পত্র (NID) অথবা জন্ম নিবন্ধন নম্বর প্রদান করা আবশ্যক।');
      if (!village.trim()) errors.push('গ্রাম নির্বাচন করুন।');
      if (!wardNo.trim()) errors.push('ওয়ার্ড নম্বর নির্বাচন করুন।');
    } else if (currentStep === 3) {
      if (selectedService.simpleFields) {
        selectedService.simpleFields.forEach(f => {
          if (f.required && !fieldValues[f.key]?.trim()) {
            errors.push(`'${f.label}' পূরণ করা আবশ্যক।`);
          }
        });
      }
    } else if (currentStep === 4) {
      if (!declarationAccepted) {
        errors.push('আইনগত সত্যতা ও দায়বদ্ধতার ঘোষণাপত্রে টিক প্রদান করা বাধ্যতামূলক।');
      }
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setFormErrors([]);
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setFormErrors([]);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Final Submit Handler
  const handleSubmitApplication = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setFormErrors([]);

    const appId = `APP-2026-BUP-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const applicationRecord: CitizenApplicationRecord = {
      id: appId,
      idempotencyKey,
      citizenId: initialCitizen?.id || `cit_${Date.now()}`,
      serviceId: selectedService.key,
      serviceLabel: selectedService.label,
      serviceCategory: selectedService.category,
      schemaVersion: '2.0.0',
      applicantName: citizenName.trim(),
      applicantPhone: mobile.trim(),
      applicantNid: nid.trim() || undefined,
      applicantBirthNo: birthNo.trim() || undefined,
      holdingNo: holdingNo.trim() || undefined,
      wardNo,
      village,
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      spouseName: spouseName.trim() || undefined,
      gender,
      postOffice,
      postCode,
      feeAmount: serviceFee,
      paymentStatus: trxId ? 'paid' : 'unpaid',
      paymentMethod,
      trxId: trxId.trim() || undefined,
      fieldValues,
      tableValues,
      attachments,
      status: 'submitted',
      statusNote: 'আবেদনটি সফলভাবে ইউনিয়ন পরিষদ অনলাইন সিস্টেমে দাখিল হইয়াছে।',
      auditTrail: [
        {
          status: 'submitted',
          note: 'নাগরিক কর্তৃক অনলাইনে ৫-ধাপ উইজার্ডের মাধ্যমে দাখিলকৃত।',
          performedBy: citizenName,
          role: 'নাগরিক (Citizen)',
          timestamp: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    try {
      // 1. Submit to server API
      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationRecord)
      });

      if (!res.ok) {
        console.warn('Backend server submit notice, saving locally.');
      }
    } catch (err) {
      console.warn('Application network save notice:', err);
    } finally {
      // Always store in localStorage for offline resiliency
      localStorage.setItem(`app_${appId}`, JSON.stringify(applicationRecord));
      setSubmittedApp(applicationRecord);
      setIsSubmitting(false);
      setCurrentStep(5);

      if (onApplicationComplete) {
        onApplicationComplete(applicationRecord);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Stepper Component */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              {config.upName} • ডিজিটাল নাগরিক প্রত্যয়ন সেবা
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              সনদের জন্য আবেদন উইজার্ড
            </h1>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
              ধাপ {currentStep + 1} / {STEPS.length}
            </span>
          </div>
        </div>

        {/* Stepper Steps Bar */}
        <div className="grid grid-cols-6 gap-2">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-amber-400 text-emerald-950 ring-4 ring-amber-400/20 shadow-md font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.step + 1}
                </div>
                <span className={`text-[11px] font-bold mt-1.5 hidden md:block ${
                  isCurrent ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Validation Errors Banner */}
      {formErrors.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 p-4 rounded-2xl text-xs space-y-1">
          <div className="font-extrabold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>অনুগ্রহ করে নিচের তথ্যগুলো সঠিকভাবে পূরণ করুন:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {formErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Step Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* STEP 0: নাগরিক সম্মতি ও পরিচিতি */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                ধাপ ১: নাগরিক পরিচিতি ও সম্মতিপত্র
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                ডিজিটাল ইউনিয়ন পরিষদ প্ল্যাটফর্মে নাগরিক প্রত্যয়ন আবেদন প্রক্রিয়ায় আপনার পরিচয় ও তথ্যের সত্যতা নিশ্চিতকরণ।
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
              <h3 className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>ব্যক্তিগত তথ্য সংরক্ষণ ও নাগরিক অঙ্গীকার</span>
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের স্থানীয় সরকার নির্দেশিকা মোতাবেক আপনার প্রদত্ত জাতীয় পরিচয়পত্র, জন্ম নিবন্ধন ও পারিবারিক তথ্যাবলী শুধুমাত্র ইউনিয়ন পরিষদের দাপ্তরিক প্রত্যয়নপত্র প্রস্তুত ও যাচাইয়ের কাজে ব্যবহৃত হইবে। কোনো তথ্য তৃতীয় পক্ষের সাথে বাণিজ্যিক উদ্দেশ্যে শেয়ার করা হইবে না।
              </p>

              <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-800 focus:ring-emerald-600 border-slate-300"
                />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                  আমি প্রত্যয়ন আবেদন প্রক্রিয়ার শর্তাবলী ও ডেটা সুরক্ষানীতি মানিয়া সম্মতি প্রদান করিতেছি।
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর (১১ ডিজিট) *
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  জাতীয় পরিচয়পত্র (NID) নম্বর
                </label>
                <input
                  type="text"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  placeholder="১০, ১৩ বা ১৭ ডিজিটের এনআইডি"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: সেবা নির্বাচন */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                ধাপ ২: প্রয়োজনীয় প্রত্যয়নপত্র বা সেবা নির্বাচন
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                নিচের তালিকা হতে আপনার প্রয়োজনীয় নাগরিক সেবা ও প্রত্যয়নপত্রের ধরন নির্বাচন করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {CERTIFICATE_TYPES.map((svc) => {
                const isSelected = selectedServiceKey === svc.key;
                return (
                  <button
                    key={svc.key}
                    type="button"
                    onClick={() => setSelectedServiceKey(svc.key)}
                    className={`p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-700 dark:border-emerald-500 ring-2 ring-emerald-600/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 block mb-0.5">
                        {svc.category}
                      </span>
                      <h4 className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white">
                        {svc.label}
                      </h4>
                    </div>

                    <div className="shrink-0 ml-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-amber-950 dark:text-amber-200 block">
                  নির্বাচিত সেবা: {selectedService.label}
                </span>
                <span className="text-[11px] text-amber-800 dark:text-amber-300">
                  সরকারি সার্ভিস ফি: <strong>৳{serviceFee}</strong> • ক্যাটাগরি: {selectedService.category}
                </span>
              </div>
              <span className="px-3 py-1 bg-amber-400 text-emerald-950 font-black text-xs rounded-xl">
                ৳{serviceFee}
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: নাগরিক প্রোফাইল পর্যালোচনা */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                ধাপ ৩: নাগরিক মাস্টার প্রোফাইল ও ঠিকানা
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                আবেদনকারীর জাতীয় পরিচয়পত্র বা জন্ম নিবন্ধন অনুযায়ী তথ্যাবলী নির্ভুলভাবে লিখুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  আবেদনকারীর পূর্ণ নাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="যেমন: মোঃ কামরুল হাসান"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  লিঙ্গ নির্বাচন করুন *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                >
                  <option value="পুরুষ">পুরুষ</option>
                  <option value="মহিলা">মহিলা</option>
                  <option value="হিজরা">হিজরা</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পিতার নাম *
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="যেমন: মোঃ আব্দুল জলিল"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মাতার নাম *
                </label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="যেমন: মোছাঃ রহিমা খাতুন"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  স্বামী / স্ত্রীর নাম (যদি থাকে)
                </label>
                <input
                  type="text"
                  value={spouseName}
                  onChange={(e) => setSpouseName(e.target.value)}
                  placeholder="ঐচ্ছিক"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর (এসএমএস নোটিফিকেশন) *
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  জাতীয় পরিচয়পত্র (NID) নম্বর
                </label>
                <input
                  type="text"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  placeholder="যেমন: 19842692015000123"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অনলাইন জন্ম নিবন্ধন নম্বর
                </label>
                <input
                  type="text"
                  value={birthNo}
                  onChange={(e) => setBirthNo(e.target.value)}
                  placeholder="১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  গ্রাম নির্বাচন করুন *
                </label>
                <select
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                >
                  {KNOWN_VILLAGES.map((v, i) => (
                    <option key={i} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ওয়ার্ড নম্বর *
                </label>
                <select
                  value={wardNo}
                  onChange={(e) => setWardNo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                >
                  {['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯'].map(w => (
                    <option key={w} value={w}>ওয়ার্ড নং {w}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: সেবা-নির্দিষ্ট তথ্য ও সংযুক্তি */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                ধাপ ৪: {selectedService.label}-এর বিশেষ তথ্য ও কাগজপত্র
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                উক্ত সনদের জন্য নির্ধারিত তথ্য পূরণ করুন এবং প্রয়োজনীয় প্রমাণক ফাইল আপলোড করুন।
              </p>
            </div>

            {/* Dynamic Simple Fields */}
            {selectedService.simpleFields && selectedService.simpleFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedService.simpleFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {field.label} {field.required && '*'}
                    </label>
                    <input
                      type={field.type || 'text'}
                      value={fieldValues[field.key] || ''}
                      onChange={(e) => setFieldValues({ ...fieldValues, [field.key]: e.target.value })}
                      placeholder={field.placeholder || `${field.label} লিখুন...`}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-700 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Warish Table Builder Integration if selectedService is 'warish' */}
            {selectedService.key === 'warish' && (
              <div className="pt-2">
                <WarishTableBuilder
                  initialRows={tableValues['warish_list']}
                  onChange={(rows) => setTableValues({ ...tableValues, warish_list: rows })}
                />
              </div>
            )}

            {/* Evidence & Document Upload */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-emerald-700" />
                  <span>প্রয়োজনীয় কাগজপত্র সংযুক্তি (PDF / JPG / PNG, সর্বোচ্চ ৫ MB)</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {attachments.length} টি ফাইল সংযুক্ত
                </span>
              </div>

              {uploadError && (
                <div className="p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-600 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-800/40 transition">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  কাগজপত্রের ফাইল ড্র্যাগ করুন অথবা ব্রাউজ করুন
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  জাতীয় পরিচয়পত্র, হোল্ডিং ট্যাক্স রসিদ বা ইউপি মেম্বারের প্রত্যয়ন
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileUpload}
                  className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-800 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
              </div>

              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-white truncate">{att.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({att.sizeKb} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="ফাইল মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: রিভিউ ও অঙ্গীকারনামা */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                ধাপ ৫: চূড়ান্ত পর্যালোচনা ও আইনগত ঘোষণা
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                দাখিল করার পূর্বে আপনার প্রদত্ত সমস্ত তথ্যাবলী মিলিয়ে নিন।
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <span className="font-black text-sm text-slate-900 dark:text-white">
                  {selectedService.label}
                </span>
                <span className="font-mono font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 rounded-xl">
                  ফি: ৳{serviceFee}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">আবেদনকারী:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{citizenName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">মোবাইল:</span>
                  <IdentityMaskedValue value={mobile} type="mobile" />
                </div>
                <div>
                  <span className="text-slate-400 block">পিতা ও মাতা:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{fatherName} • {motherName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">গ্রাম ও ওয়ার্ড:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{village}, ওয়ার্ড নং {wardNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">NID / জন্ম নিবন্ধন:</span>
                  <IdentityMaskedValue value={nid || birthNo} type="nid" />
                </div>
                <div>
                  <span className="text-slate-400 block">সংযুক্তি সংখ্যা:</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-400">{attachments.length} টি দলিল</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                সরকারি সনদ ফি পরিশোধের মাধ্যম নির্বাচন করুন:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['bKash', 'Nagad', 'Rocket', 'কাউন্টারে প্রদেয়'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      paymentMethod === m
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                        : 'border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {paymentMethod !== 'কাউন্টারে প্রদেয়' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    পেমেন্ট ট্রানজেকশন আইডি (TrxID)
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="যেমন: BKP9A7X312"
                    className="w-full sm:w-80 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Formal Legal Declaration */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(e) => setDeclarationAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-800 focus:ring-emerald-600 border-slate-300"
                />
                <span className="text-xs font-extrabold text-amber-950 dark:text-amber-200 leading-relaxed">
                  আমি শপথপূর্বক ঘোষণা করিতেছি যে, উপরোক্ত সমস্ত তথ্যাবলী ও আপলোডকৃত কাগজপত্র সম্পূর্ণ সত্য ও নির্ভুল। ভবিষ্যতে কোনো তথ্য অসত্য বা জালিয়াতি প্রমাণিত হইলে দেশের প্রচলিত আইন অনুযায়ী শাস্তির দায় বহন করিতে বাধ্য থাকিব।
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 5: আবেদন রসিদ */}
        {currentStep === 5 && submittedApp && (
          <ApplicationReceipt
            application={submittedApp}
            config={config}
            onTrackStatus={() => {
              if (onTrackStatus) onTrackStatus(submittedApp.id);
            }}
            onStartNew={() => {
              setCurrentStep(0);
              setSubmittedApp(null);
              setAttachments([]);
              setFieldValues({});
              setTrxId('');
              setDeclarationAccepted(false);
            }}
          />
        )}

        {/* Wizard Footer Navigation Controls */}
        {currentStep < 5 && (
          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী ধাপ</span>
                </button>
              ) : onBackToPortal ? (
                <button
                  type="button"
                  onClick={onBackToPortal}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
                >
                  বাতিল করুন
                </button>
              ) : null}
            </div>

            <div>
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>পরবর্তী ধাপ</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting || !declarationAccepted}
                  className="px-7 py-3 bg-gradient-to-r from-emerald-800 to-indigo-950 hover:from-emerald-700 hover:to-indigo-900 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>আবেদন দাখিল হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      <span>আবেদন চূড়ান্তভাবে দাখিল করুন</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
