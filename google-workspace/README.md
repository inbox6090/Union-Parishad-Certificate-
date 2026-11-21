# UPSM — Google Workspace নাগরিক আবেদন ও সনদ খসড়া সিস্টেম

**০২নং বহেড়াতৈল ইউনিয়ন পরিষদ, সখিপুর, টাঙ্গাইল**

এই Google Apps Script অংশটি `inbox6090/Union-Parishad-Certificate-` প্রজেক্টের জন্য **স্বতন্ত্র Google Workspace intake backend**। নাগরিকের নতুন আবেদন থেকে খসড়া ও দাপ্তরিক অনুমোদন পর্যন্ত Google ecosystem-এ কাজ করার জন্য ডিজাইন করা।

## Architecture / Data flow

```
Citizen browser → Apps Script HTML Web App → Google Sheets (Applications + Audit)
                                                    ↓
          Google Sheet menu → human review → private Google Docs draft
                                                    ↓
                          authorized approval + signed document validation
                                                    ↓
                                      Google Drive private PDF / office delivery
```

- Primary database: **একটি Google Sheet** (`Applications`); legacy Firebase/Express-এ একই আবেদন duplicate করে না।
- Frontend: Apps Script `HtmlService` (same-origin `google.script.run`), তাই React থেকে cross-origin CORS সমস্যার প্রয়োজন হয় না।
- Optional Google Form intake: privileged spreadsheet menu থেকে form + trigger install করা যায়।
- **Gemini Custom Gem সরাসরি API নয়**: শেয়ার করা Gem-এর দাপ্তরিক ভাষা ও `{{body_text}}` নিয়ম অনুসারে deterministic draft তৈরি হয়। Gemini Gem-এর সঙ্গে authenticated API integration এই সংস্করণে নেই; কোনো paid API key প্রয়োজন নেই।
- ৫ ধরনের pilot সেবা: নাগরিকত্ব, চারিত্রিক, স্থায়ী বাসিন্দা, ওয়ারিশান, তথ্য সংশোধন। ৪০+ সেবার দাবির বদলে আইনগত/দাপ্তরিক টেমপ্লেট যাচাই শেষে প্রত্যেকটি আলাদা যোগ করতে হবে।
- আবেদন জমা **সনদ ইস্যু নয়**; স্বাক্ষর/সিল ও কাগজপত্র মানব যাচাই বাধ্যতামূলক।

## ১) Google Sheet তৈরি ও স্ক্রিপ্ট যুক্ত করুন

1. দাপ্তরিক Google account-এ সাইন-ইন করে **নতুন একটি private Google Sheet** তৈরি করুন, নাম `UPSM Google Workspace Application Register`। `Anyone with the link` শেয়ারিং **Off/Restricted** রাখুন।
2. Sheet → **Extensions → Apps Script** খুলুন। স্বয়ংক্রিয় Code.gs খালি হলে এই প্যাকেজের `Code.gs` পুরোটা paste করুন।
3. Apps Script editor → `+` → **HTML** → file name `Index`; `Index.html`-এর সম্পূর্ণ source paste করুন।
4. ঐচ্ছিক: **Project Settings → Show appsscript.json** → এই প্যাকেজের `appsscript.json`-এর manifest paste করুন (Google authorization scopes চেক করুন)।
5. Editor-এ `setupUPSM_` function নির্বাচন করে **Run** করুন, Google-এর authorization screen থেকে প্রয়োজনীয় permissions দিন। এতে `Applications`, `Audit` tab, private Google Drive folder এবং একটি Google Docs template তৈরি হবে।
6. Spreadsheet পুনরায় খুলুন, **UPSM · নাগরিক সেবা** মেনু পাবেন। Script Properties-এ `SPREADSHEET_ID`, `DRAFT_FOLDER_ID`, `TEMPLATE_DOC_ID`, `ADMIN_EMAILS`, `NOTIFY_EMAIL` সঠিক হয়েছে কি না দেখুন। `ADMIN_EMAILS` comma-separated exact email address; সেবার দায়িত্বপ্রাপ্ত কর্মকর্তাদের প্রকৃত অনুমোদন ছাড়া কাউকে যোগ করবেন না।
7. Draft Google Doc-এর layout, উপযুক্ত পদবি, সঠিক ইউনিয়নের বানান, দাপ্তরিক ফি, টেমপ্লেট এবং অনুমোদিত স্বাক্ষরকারী কর্মকর্তা **নিজে যাচাই করে সংশোধন** করুন। অনুমোদনবিহীন খসড়া ব্যবহার করবেন না।

## ২) Staging Web App deploy করুন

1. Apps Script → **Deploy → New deployment** → type **Web app**।
2. **Execute as: Me** (শুধু দাপ্তরিক অ্যাকাউন্ট)। **Who has access: Anyone** (যদি সত্যিকারের পাবলিক পোর্টাল চালু করতে চান, security/legal review ও controlled pilot শেষ হওয়ার পরে); আগে Google-account restricted staging-এ পরীক্ষা করুন।
3. Web App `.../exec` URL কপি করে test submission দিন। **Real NID নয়, কেবল test/synthetic data** ব্যবহার করুন।
4. ১টি আবেদন জমা দিয়ে `Applications` ও `Audit` ট্যাবে record, email notification, receipt, tracking secret দিয়ে status lookup যাচাই করুন। একই `RequestId` দ্বিতীয়বার জমা দিলে একটিই রেকর্ড হবে।
5. Applications tab-এ একটি row select করে menu → **নির্বাচিত আবেদনের খসড়া**; Google Doc output যাচাই করুন।
6. অনুমোদনের যথার্থ authority নিশ্চিত হওয়ার পর menu → **নির্বাচিত আবেদন অনুমোদন**। প্রকৃত অনুমোদনকারী স্বাক্ষর ও সিল পরীক্ষা করে Google Doc-এ নথির সংযোজন শেষ করলে একই row-এর `SignatureConfirmed` সেলে **YES** লিখুন; তার পর **PDF** menu action। PDF ড্রাইভে **private** থাকবে, স্বয়ংক্রিয় public download link তৈরি হবে না।
7. Form চাইলে Sheet menu → **Google Form তৈরি**। Form/trigger পরীক্ষা করুন; ফরমের response Google Form-এও থাকে, আর এই script Google Sheet-এ একই schema-তে লেখে।

## ৩) বিদ্যমান React সাইটে Google application link দিন

Site hosting build environment (e.g. Vite) এ:

```dotenv
VITE_GOOGLE_WORKSPACE_WEBAPP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

এটি **backend API secret নয়**; public URL। GitHub branch-এর React integration থাকলে নতুন-আবেদন button এই Google Web App-এ যাবে; `/exec?view=track` হল ট্র্যাকিং লিংক। **এই env var সেট না করলে পুরনো আবেদন wizard চালু থাকবে — সেটা এই Google Sheet-এ সেভ হয় না।**

## নিরাপত্তা ও অপারেশনাল সীমাবদ্ধতা

- Sheets, Docs, Drive folder ও script project private রাখুন; Full NID/BRN, মোবাইল নম্বর, certificate PDF public sheet/API-তে দেবেন না।
- Apps Script web app execution-as-owner grants privileged sheet access *only to narrowly-defined server functions*; `submitApplication` ও secret-bound `getApplicationStatus` ছাড়া admin functions underscore suffix-এ private রাখা হয়েছে। Deployment-এর আগে স্বাধীন security review আবশ্যক।
- Mobile number throttling = best-effort in-script CacheService, **CAPTCHA/WAF নয়**; uncontrolled public intake-এ bot/abuse, quota exhaustion, spam এবং PII risk আছে।
- Google Apps Script quotas, Google account rate limits, Form trigger failures, audit log mutability, GDPR/বাংলাদেশি প্রযোজ্য privacy rules, data retention policy, access request, incident response review করতে হবে।
- ইস্যু করা PDF **cryptographic digital signature নয়**। এখানে কেবল ম্যানুয়াল স্বাক্ষর যাচাইয়ের দাবি রাখা হয়েছে; বাস্তব সিল/স্বাক্ষর ছাড়া অফিসিয়াল সনদ হিসেবে ব্যবহারযোগ্য বলে দাবি করবেন না।
- AI-derived text আইনগতভাবে অনুমোদিত নয়; ওয়ারিশ/সংশোধন ক্ষেত্রে ইনপুটের বাইরে কারও পরিচয় বা সম্পর্ক অনুমান করে না।
- Formula injection neutralization, input validation, receipt-secret hash, idempotency request IDs এবং sheet menu email allowlist অন্তর্ভুক্ত। `Audit` tab **immutable ledger নয়**; উচ্চমাত্রার production assurance-এর জন্য বাইরে থেকে অপরিবর্তনীয় audit ব্যবস্থা লাগবে।
- **জাতীয় পরিচয়পত্রের ছবি/নথি আপলোড এই pilot-এ নেই**; verification ও evidence সংগ্রহ অফিসে আলাদাভাবে করতে হবে।
- Public Google Form করলে privacy notice এবং data collection authorization আগে চূড়ান্ত করুন।

## যাচাই

```bash
node --test tests/*.test.cjs
```

লোকাল unit এবং mock integration test Google Apps Script-এ প্রকৃত OAuth, permission, Google quota, email, template rendering, Web App execution পরীক্ষা করে না।

**Production ready: NO**; real-world signed certificate issuing must stay disabled until authorized testing, template confirmation and documented approval.