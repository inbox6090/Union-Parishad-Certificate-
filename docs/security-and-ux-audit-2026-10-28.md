# বহেড়াতৈল ইউনিয়ন পরিষদ — নিরাপত্তা ও ডিজাইন অডিট (২৮ অক্টোবর ২০২৬)

## অগ্রাধিকার: নিরাপত্তা (লাইভে পরিবর্তন করার আগে)

- `firestore.rules`: `certificates` সংগ্রহে public read/create/update/delete অনুমোদিত; `allow delete: if isAdmin() || true` সর্বদা true।
- `citizens`, `configs`, `apiKeys`, `webhooks`, `backups`: একাধিক সংগ্রহে `allow read, write: if true` আছে।
- `AdminGuard.tsx` শুধু localStorage-এর `bup_active_admin_session` থেকে role নিয়ে UI গোপন করে; সার্ভার-সাইড অনুমতির বিকল্প নয়।
- `HomePanel.tsx`-এ প্রকৃত ডেটার বিকল্প হিসেবে কাল্পনিক নাগরিক ও পরিসংখ্যান আছে। প্রশাসনিক ব্যবহারে এগুলো বাস্তব তথ্য মনে হওয়ার ঝুঁকি।
- `Sidebar.tsx`-এ approval menu-র নাম চেয়ারম্যান; বর্তমান পদবী ও অনুমোদন কর্তৃপক্ষ যাচাই সাপেক্ষে dynamic করা দরকার।

**সতর্কতা:** বর্তমান database schema, auth claims, Firestore access patterns, Cloud Functions, এবং production backup যাচাই ছাড়া নতুন restrictive rules deploy করবেন না। এতে বৈধ workflow বন্ধ হতে পারে।

## বাস্তবায়ন পরিকল্পনা

1. Firebase Emulator-এ read/write/role-based security tests; test users: anonymous, citizen, operator, secretary, approver, admin।
2. Public verification-এ শুধু প্রয়োজনীয় non-sensitive fields প্রকাশ। NID, ফোন, ঠিকানা, private draft কখনো public read নয়।
3. Approval/change operations server-side authenticated role checks, immutable audit event এবং human approval।
4. Fake sample profiles সরানো, empty state ও demo label, API ত্রুটি হলে 0-কে placeholder হিসেবে দেখানো নয়।
5. Mobile-first dashboard: পরিষ্কার নেভিগেশন, search, status, notice, application CTA, keyboard/contrast testing।
6. Print A4 ও QR verification end-to-end পরীক্ষা; Dark Mode-এ print অপরিবর্তিত রাখা।
7. GitHub PR -> CI -> staging -> data backup -> human-reviewed production release।

## Tool map

- GitHub: versioning, PR, security scanning, CI।
- Figma/Product Design: reusable design tokens and clickable prototype।
- Supabase: **বিকল্প**, বিদ্যমান Firebase migration অনুমোদন ছাড়া নয়।
- Vercel: staging, deployment only after environment verification।
- ClickUp/Notion: task tracking and acceptance checklist।
- Firecrawl/Liner: public UX/content audit, sensitive pages নয়।
- Higgsfield: non-official illustration/assets only, official seals or portraits নয়।
- Airtable/Drive: approved non-sensitive content management only।

এই ফাইল audit recommendation; production change বা fix completed দাবি নয়।
