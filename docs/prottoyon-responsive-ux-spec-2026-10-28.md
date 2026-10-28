# প্রত্যয়ন-অনুপ্রাণিত ইউনিয়ন পরিষদ UX/UI বাস্তবায়ন স্পেসিফিকেশন
তারিখ: ২০২৬-১০-২৮ | প্রকল্প: inbox6090/Union-Parishad-Certificate-
স্থিতি: গবেষণাভিত্তিক স্পেসিফিকেশন; বাস্তবায়ন বা প্রোডাকশন অনুমোদন নয়।

## প্রমাণের সীমা
যাচাইকৃত: /register/citizen, /register/union, /union/covered, /faq-এর প্রকাশ্য টেক্সট; প্রকাশ্য ব্যবহারকারী ম্যানুয়ালের সার্চ-ইনডেক্সে দৃশ্যমান ঐতিহাসিক স্ক্রিনশট।
সীমাবদ্ধতা: হোমপেজ সরাসরি খুলতে টাইমআউট; লাইভ ডেস্কটপ/মোবাইল DOM, CSS, সঠিক pixel measurements, authenticated form states, actual responsive breakpoint ও সব সনদ-ফরম দেখা হয়নি। তাই নিচের ভিজ্যুয়াল টোকেন ও breakpoint **নিজস্ব প্রস্তাব**, প্রত্যয়নের হুবহু পরিমাপ নয়।
সূত্র:
- https://prottoyon.gov.bd/register/citizen
- https://prottoyon.gov.bd/register/union
- https://prottoyon.gov.bd/union/covered
- https://prottoyon.gov.bd/faq
- https://www.prottoyon.gov.bd/frontend/user_manual.pdf
- https://github.com/JCodesMore/ai-website-cloner-template

## ১. তথ্য স্থাপত্য ও নেভিগেশন
Public header: [নিজস্ব ইউনিয়ন পরিচয়] [সেবাসমূহ] [আবেদন ট্র্যাকিং] [সনদ যাচাই] [নির্দেশিকা] [FAQ] [লগইন/নিবন্ধন]।
Home: Hero + 'সনদের জন্য আবেদন' + 'আবেদন ট্র্যাক' + 'QR যাচাই'; জনপ্রিয় সেবা; সব সেবা অনুসন্ধান/ক্যাটাগরি; আবেদন প্রক্রিয়া; সহায়তা।
Citizen workspace: [ড্যাশবোর্ড] [আমার প্রোফাইল] [নতুন আবেদন] [আমার আবেদন] [নোটিফিকেশন]।
Staff workspace: [নাগরিক মাস্টার] [আবেদন তালিকা] [যাচাই] [অনুমোদন] [সনদ ইস্যু] [অডিট লগ]।
সেবা ক্যাটালগ: পূর্বে সংরক্ষিত ৪৭টি সেবা JSON; ইউনিয়নভিত্তিক enablement এবং আলাদা যাচাইকৃত/প্রস্তাবিত ফিল্ড।

## ২. ডেস্কটপ UI (প্রস্তাবিত)
Viewport target 1440×900; max content width 1200px; header 72px; navigation 48px; 12-column grid; 24px gutters।
Top navigation দৃশ্যমান; বাম সেবা-ক্যাটাগরি ফিল্টার (260px) এবং ডানদিকে 3-column সেবা কার্ড।
Hero-তে সংক্ষিপ্ত বাংলা শিরোনাম, স্পষ্ট প্রাথমিক CTA; বিজ্ঞাপনধর্মী কোলাহল নয়।
Form content max-width 840px; প্রগ্রেস স্টেপার, ডানদিকে optional সহায়তা/প্রয়োজনীয় কাগজের সারাংশ।
নিজস্ব টোকেন: primary #166534, accent #D97706, surface #FFFFFF, page #F8FAFC, text #0F172A, error #B91C1C; font stack 'Noto Sans Bengali', system-ui, sans-serif।
এসব রঙ প্রত্যয়নের নির্ভুল CSS নয়, এই অ্যাপের জন্য নতুন design system।

## ৩. মোবাইল UI (প্রস্তাবিত)
360–430px মোবাইল target; breakpoint <768px-এ single column, 768–1023px tablet 2-column, >=1024px desktop 3-column।
Header: লোগো/ইউনিয়ন নাম + hamburger; menu drawer with focus trap and Escape close।
সেবা কার্ড full width; searchable filter chips; CTA minimum 44×44px; fixed bottom CTA only when it does not obstruct keyboard or content।
Form: প্রতিটি ধাপে 1-column fields; progress text 'ধাপ ২/৫'; Back/Save Draft/Next; validation summary at top and inline errors।
OTP field keyboard numeric; document upload camera/file; slow-network retry, skeleton/empty/offline/error states।
No horizontal scroll at 320px; visible focus, contrast >=4.5:1; responsive font 16px base.

## ৪. যাচাইকৃত প্রকাশ্য কার্যপ্রবাহ
নাগরিক নিবন্ধন: ইংরেজি নাম (required), বাংলা নাম, ঐচ্ছিক ইমেইল, ১১-অঙ্ক মোবাইল (required), নিরাপত্তা কোড (required), verification code to phone/email; প্রোফাইল সম্পূর্ণ করতে সাধারণ তথ্য ও ঠিকানা প্রয়োজন। (সূত্র /register/citizen)
আবেদন: নাগরিক নিবন্ধন/প্রোফাইল -> সেবা নির্বাচন -> সনদভিত্তিক তথ্য -> দাখিল -> সংশ্লিষ্ট কর্তৃপক্ষকে অবহিত -> স্থানীয় যাচাই -> অনুমোদন/প্রত্যাখ্যান -> নোটিফিকেশন -> অনুমোদিত হলে PDF -> কর্তৃপক্ষের প্রচলিত ইস্যু/স্বাক্ষর প্রক্রিয়া। (সূত্র /faq)
ইউনিয়ন অনবোর্ডিং: ইউনিয়ন তথ্য -> প্রশাসনিক তথ্য -> সেবা ও খরচ -> ব্যাংক তথ্য। এটি **ইউনিয়ন প্রশাসনের অনবোর্ডিং**, নাগরিক সনদ আবেদনের ধাপ নয়। (সূত্র /register/union)

## ৫. প্রস্তাবিত অ্যাপ আবেদন উইজার্ড
Step 0: Authentication/authorization; নাগরিকের সম্মতি এবং প্রোফাইলের অবস্থা।
Step 1: Service selection; title, fee from approved local config, required documents, turnaround only if officially confirmed।
Step 2: Citizen master profile; existing citizenId, read-only preview; edit requires authorized workflow।
Step 3: Service-specific schema; field origin badges verified/proposed; dependent fields; attachments।
Step 4: Review; declaration; submission; idempotency key to prevent duplicate submission।
Step 5: Receipt with applicationId and status tracking.
Status: draft -> submitted -> under_review -> needs_information -> approved/rejected -> issued; revocation separate privileged workflow.
Application record stores citizenId, serviceId, schemaVersion, fieldValues, attachments metadata, status, auditTrail, createdBy, timestamps; never rely on name/NID as record primary key.

## ৬. নিরাপত্তা ও ব্যক্তিগত তথ্য
Current repository firestore.rules has unsafe public permissions on /citizens, /certificates, /apiKeys and other collections; do not deploy citizen workflow until audited and corrected.
Use server-verified Firebase Auth custom claims; Firestore rules must enforce least privilege, deny-by-default, separate public QR verification projection from private certificates.
Never put NID/mobile in URL, public verification payload, analytics, logs or client-exposed public lists. Mask identifiers. Storage upload type/size/ownership restrictions; private bucket; signed access.
No production migration without verified backup, access tests, and rollback plan. Do not import personal data from prottoyon.gov.bd.
Cloner repository uses Next.js; current app Vite/React. Rebuild reusable presentation components, do not replace app runtime or copy government logos, text blocks or brand identity verbatim.

## ৭. প্রস্তাবিত React component map
PublicLayout, ResponsiveHeader, ServiceCategoryFilter, ServiceCard, ServiceSearch, ApplicationStatusLookup, VerificationSearch, FAQAccordion.
CitizenLayout, CitizenProfileCompletion, CertificateApplicationWizard, ApplicantReview, UploadEvidence, ApplicationReceipt, MyApplications.
StaffLayout, CitizenMasterPanel, ApplicationQueue, VerificationChecklist, ApprovalDecision, IssueCertificate, AuditTimeline.
Reusable: Stepper, FormField, BanglaNumberInput, AddressSelector, IdentityMaskedValue, EmptyState, ErrorSummary, ConfirmDialog.

## ৮. Definition of Done
- 320/375/768/1024/1440px visual QA; desktop/mobile screenshots captured from own implementation.
- Keyboard-only, screen-reader labels, Bengali Unicode, zoom 200%, color contrast checks.
- Tests: auth denial; unauthorized read/write; duplicate citizen; invalid NID/BRN/mobile; profile autofill; draft recovery; submission idempotency; approval-only issuance; private/public separation.
- npm run lint, npm run build, npm run test pass; no real PII in fixtures.
- Actual source screenshots/CSS inspection pending; no claim of pixel-perfect clone.
