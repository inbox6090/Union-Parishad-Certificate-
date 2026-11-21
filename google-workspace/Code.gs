/**
 * UPSM Google Workspace intake (bound to a private Google Spreadsheet).
 * Runtime: Google Apps Script only. No Firebase, Node server, or Gemini API.
 * Security: only submitApplication/getApplicationStatus are callable by public HTML;
 * administrative methods end with `_` and are guarded with an email allowlist.
 * All certificate content is DRAFT until a human officer approves it.
 */
var UPSM_SERVICES_ = Object.freeze({
  citizenship: 'নাগরিকত্ব সনদপত্র',
  character: 'চারিত্রিক সনদপত্র',
  permanent_resident: 'স্থায়ী বাসিন্দা সনদপত্র',
  warish: 'ওয়ারিশান / উত্তরাধিকার সনদ (মানব যাচাই আবশ্যক)',
  correction: 'তথ্য সংশোধন প্রত্যয়ন (মানব যাচাই আবশ্যক)'
});
var UPSM_HEADERS_ = [
  'CreatedAt','ApplicationId','RequestId','Service','Name','Father','Mother','Mobile',
  'Ward','Village','IdType','IdentityNo','Purpose','Status','TrackingHash',
  'UpdatedAt','DraftDocId','ApprovedBy','ApprovedAt','SignatureConfirmed',
  'PdfFileId','IssuedAt','PrivateNotes'
];
var UPSM_AUDIT_HEADERS_ = ['Timestamp','Event','ApplicationId','Actor','Detail'];
var UPSM_STATUS_ = { PENDING: 1, DRAFT_READY: 1, APPROVED: 1, REJECTED: 1, ISSUED: 1 };

function toLatinDigits_(input) {
  return String(input == null ? '' : input).replace(/[০-৯]/g, function (c) {
    return String('০১২৩৪৫৬৭৮৯'.indexOf(c));
  });
}
function toBnDigits_(input) {
  return String(input == null ? '' : input).replace(/[0-9]/g, function (c) {
    return '০১২৩৪৫৬৭৮৯'.charAt(Number(c));
  });
}
function cleanText_(v, limit) {
  var t = String(v == null ? '' : v).trim();
  if (t.length > limit || /[\u0000-\u001f\u007f]/.test(t)) throw Error('তথ্যের দৈর্ঘ্য বা অক্ষর সঠিক নয়।');
  return t;
}
function sanitizeCell_(value) {
  var t = String(value == null ? '' : value);
  return /^[\s]*[=+@\-]/.test(t) ? "'" + t : t;
}
function validateApplication_(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('আবেদন তথ্য পাওয়া যায়নি।');
  if (data.extra) throw Error('আবেদন গ্রহণ করা যায়নি।'); // honeypot
  if (data.consent !== true) throw Error('তথ্য সংরক্ষণের সম্মতি প্রয়োজন।');
  var service = cleanText_(data.service, 36);
  if (!Object.prototype.hasOwnProperty.call(UPSM_SERVICES_, service)) throw Error('সেবার ধরন সঠিক নয়।');
  var name = cleanText_(data.name, 100);
  var father = cleanText_(data.father, 100);
  var mother = cleanText_(data.mother, 100);
  var village = cleanText_(data.village, 100);
  if (!name || !father || !mother || !village) throw Error('নাম, পিতা, মাতা ও গ্রামের তথ্য প্রয়োজন।');
  var mobile = toLatinDigits_(data.mobile).replace(/[\s-]/g, '');
  if (!/^01[3-9][0-9]{8}$/.test(mobile)) throw Error('১১ সংখ্যার বৈধ বাংলাদেশি মোবাইল নম্বর দিন।');
  var ward = toLatinDigits_(data.ward).trim().replace(/^0+/, '');
  if (!/^[1-9]$/.test(ward)) throw Error('ওয়ার্ড ১ থেকে ৯-এর মধ্যে হতে হবে।');
  var idType = cleanText_(data.idType, 5);
  var identityNo = toLatinDigits_(data.identityNo).replace(/\s/g, '');
  if (!((idType === 'NID' && /^(?:[0-9]{10}|[0-9]{13}|[0-9]{17})$/.test(identityNo)) ||
        (idType === 'BRN' && /^[0-9]{17}$/.test(identityNo)))) {
    throw Error('পরিচয় নম্বর: NID ১০/১৩/১৭ অথবা জন্ম নিবন্ধন ১৭ সংখ্যা হতে হবে।');
  }
  var requestId = cleanText_(data.requestId, 70);
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(requestId)) throw Error('আবেদন অনুরোধ শনাক্তকারী সঠিক নয়।');
  return {
    service: service, name: name, father: father, mother: mother, village: village,
    mobile: mobile, ward: ward, idType: idType, identityNo: identityNo,
    purpose: cleanText_(data.purpose, 300), requestId: requestId
  };
}
function buildCertificateBody_(d) {
  var text = 'এই মর্মে প্রত্যয়ন খসড়া প্রস্তুত করা হইল যে, ' + d.name + ', পিতা: ' + d.father +
    ', মাতা: ' + d.mother + ', গ্রাম: ' + d.village + ', ওয়ার্ড নং ' + toBnDigits_(d.ward) +
    ', ০২নং বহেড়াতৈল ইউনিয়ন পরিষদের অধিক্ষেত্রের বাসিন্দা মর্মে আবেদন করিয়াছেন।';
  if (d.service === 'warish') text += '\nউত্তরাধিকারীদের পূর্ণাঙ্গ তালিকা ও সম্পর্ক পৃথকভাবে দাপ্তরিক যাচাই করা আবশ্যক।';
  if (d.service === 'correction') text += '\nমূল নথি ও সংশোধিত তথ্যের তুলনামূলক যাচাই আবশ্যক।';
  if (d.service === 'character') text += '\nচারিত্রিক তথ্যের সত্যতা সংশ্লিষ্ট কর্তৃপক্ষ কর্তৃক যাচাই সাপেক্ষ।';
  return text + '\nএই দলিল কেবল যাচাইয়ের খসড়া; অনুমোদিত কর্মকর্তার স্বাক্ষর ব্যতীত সনদ হিসেবে প্রযোজ্য নহে।';
}
function publicStatus_(record) {
  return { applicationId: record.applicationId, service: record.service, status: record.status,
    updatedAt: record.updatedAt };
}
function now_() {
  return Utilities.formatDate(new Date(), 'Asia/Dhaka', "yyyy-MM-dd'T'HH:mm:ss");
}
function digestHex_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + ((b + 256) & 255).toString(16)).slice(-2); }).join('');
}
function safeEquals_(a, b) {
  var x = String(a), y = String(b), out = x.length ^ y.length;
  for (var i = 0; i < Math.max(x.length, y.length); i++) out |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return out === 0;
}
function props_() { return PropertiesService.getScriptProperties(); }
function sheet_() {
  var id = props_().getProperty('SPREADSHEET_ID');
  if (!id) throw Error('সিস্টেম এখনো চালু করা হয়নি।');
  var sheet = SpreadsheetApp.openById(id).getSheetByName('Applications');
  if (!sheet) throw Error('আবেদন রেজিস্টার পাওয়া যায়নি।');
  return sheet;
}
function audit_(event, appId, actor, detail) {
  SpreadsheetApp.openById(props_().getProperty('SPREADSHEET_ID')).getSheetByName('Audit')
    .appendRow([now_(), event, appId || '', actor || '', detail || '']);
}
function rows_() {
  var sheet = sheet_();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, UPSM_HEADERS_.length).getValues().map(function (values, index) {
    var d = { row: index + 2 };
    UPSM_HEADERS_.forEach(function (header, column) { d[header] = values[column]; });
    return d;
  });
}
function recordCell_(sheet, row, header, value) {
  sheet.getRange(row, UPSM_HEADERS_.indexOf(header) + 1).setValue(value);
}
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  var requested = e && e.parameter && e.parameter.service;
  template.initialService = Object.prototype.hasOwnProperty.call(UPSM_SERVICES_, requested) ? requested : 'citizenship';
  template.initialView = (e && e.parameter && e.parameter.view === 'track') ? 'track' : 'apply';
  return template.evaluate().setTitle('০২নং বহেড়াতৈল ইউপি · নাগরিক আবেদন')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
/** Public method: called by HtmlService only; no admin operations here. */
function submitApplication(payload) {
  var d = validateApplication_(payload);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var result;
  try {
    var previous = rows_().filter(function (r) { return String(r.RequestId) === d.requestId; })[0];
    if (previous) return { duplicate: true, applicationId: previous.ApplicationId, message: 'অনুরোধটি আগে গ্রহণ করা হয়েছে। পূর্বের রসিদ ব্যবহার করুন।' };
    // Best-effort throttling for anonymous traffic; quotas and abuse monitoring remain necessary.
    var cache = CacheService.getScriptCache();
    var rateKey = 'phone:' + digestHex_(d.mobile + Utilities.formatDate(new Date(), 'Asia/Dhaka', 'yyyy-MM-dd-HH'));
    var attempts = Number(cache.get(rateKey) || '0');
    if (attempts >= 5) throw Error('এই নম্বর থেকে অনেক আবেদন এসেছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।');
    cache.put(rateKey, String(attempts + 1), 3600);
    // The ID has unguessable entropy; the tracking secret is never stored in plaintext.
    var appId = 'UPSM-' + new Date().getFullYear() + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 14).toUpperCase();
    var token = Utilities.getUuid() + '-' + Utilities.getUuid();
    var stamp = now_();
    var values = [stamp, appId, d.requestId, d.service, d.name, d.father, d.mother,
      d.mobile, d.ward, d.village, d.idType, d.identityNo, d.purpose, 'PENDING',
      digestHex_(token), stamp, '', '', '', 'NO', '', '', ''];
    sheet_().appendRow(values.map(sanitizeCell_));
    audit_('APPLICATION_CREATED', appId, 'PUBLIC', 'Google Web App');
    result = { applicationId: appId, trackingSecret: token, status: 'PENDING', duplicate: false };
  } finally { lock.releaseLock(); }
  var email = props_().getProperty('NOTIFY_EMAIL');
  if (email) {
    try {
      MailApp.sendEmail(email, 'UPSM নতুন আবেদন: ' + result.applicationId,
        'নতুন আবেদন জমা হয়েছে।\nID: ' + result.applicationId + '\nধরন: ' + UPSM_SERVICES_[d.service] + '\nঅনুমোদনের জন্য ব্যক্তিগত রেজিস্টার দেখুন।');
    } catch (ignored) { /* Do not undo saved applications if email quota is exhausted. */ }
  }
  return result;
}
/** Public method: both receipt ID and private tracking secret are required. */
function getApplicationStatus(applicationId, trackingSecret) {
  var id = cleanText_(applicationId, 45);
  var secret = cleanText_(trackingSecret, 100);
  if (!/^UPSM-[0-9]{4}-[A-F0-9]{14}$/.test(id) || secret.length < 60) throw Error('ট্র্যাকিং তথ্য সঠিক নয়।');
  var entry = rows_().filter(function (r) { return String(r.ApplicationId) === id; })[0];
  if (!entry || !safeEquals_(String(entry.TrackingHash), digestHex_(secret))) throw Error('এই ট্র্যাকিং তথ্যের আবেদন পাওয়া যায়নি।');
  return publicStatus_({ applicationId: id, service: UPSM_SERVICES_[String(entry.Service)] || 'সনদ আবেদন',
    status: entry.Status, updatedAt: entry.UpdatedAt });
}

/** Spreadsheet-owner setup: never expose by google.script.run. */
function setupUPSM_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw Error('Google Sheet থেকে Extensions → Apps Script খুলে সেটআপ চালান।');
  var ownerEmail = Session.getActiveUser().getEmail();
  if (!ownerEmail) throw Error('Google অ্যাকাউন্টে সাইন-ইন করে সেটআপ চালান।');
  var p = props_();
  var existing = p.getProperty('SPREADSHEET_ID');
  if (existing && existing !== ss.getId()) throw Error('অন্য ডাটাবেজের সঙ্গে আগে থেকেই যুক্ত আছে।');
  var main = ss.getSheetByName('Applications') || ss.insertSheet('Applications');
  if (main.getLastRow() === 0) main.appendRow(UPSM_HEADERS_);
  else if (main.getRange(1, 1, 1, UPSM_HEADERS_.length).getValues()[0].join('|') !== UPSM_HEADERS_.join('|')) throw Error('Applications শিটের হেডার মেলেনি; ডাটা ওভাররাইট করা হয়নি।');
  main.setFrozenRows(1);
  var audit = ss.getSheetByName('Audit') || ss.insertSheet('Audit');
  if (audit.getLastRow() === 0) audit.appendRow(UPSM_AUDIT_HEADERS_);
  audit.setFrozenRows(1);
  p.setProperties({ SPREADSHEET_ID: ss.getId(), ADMIN_EMAILS: p.getProperty('ADMIN_EMAILS') || ownerEmail,
    NOTIFY_EMAIL: p.getProperty('NOTIFY_EMAIL') || ownerEmail }, false);
  var folderId = p.getProperty('DRAFT_FOLDER_ID');
  if (!folderId) {
    folderId = DriveApp.createFolder('UPSM Private Drafts - ' + ss.getName()).getId();
    p.setProperty('DRAFT_FOLDER_ID', folderId);
  }
  if (!p.getProperty('TEMPLATE_DOC_ID')) {
    var doc = DocumentApp.create('UPSM Certificate Template - REVIEW BEFORE USE');
    var b = doc.getBody();
    b.appendParagraph('০২নং বহেড়াতৈল ইউনিয়ন পরিষদ, সখিপুর, টাঙ্গাইল').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    b.appendParagraph('{{certType}}');
    b.appendParagraph('আবেদন আইডি: {{memoNo}}    তারিখ: {{issueDate}}');
    b.appendParagraph('আবেদনকারী: {{name}}');
    b.appendParagraph('পিতা: {{fatherName}}    মাতা: {{motherName}}');
    b.appendParagraph('গ্রাম: {{village}}    ওয়ার্ড: {{wardNo}}');
    b.appendParagraph('{{body_text}}');
    b.appendParagraph('[অনুমোদিত কর্মকর্তার স্বাক্ষর, সিল, নাম ও পদবি — যাচাই সাপেক্ষ]');
    doc.saveAndClose();
    DriveApp.getFileById(doc.getId()).moveTo(DriveApp.getFolderById(folderId));
    p.setProperty('TEMPLATE_DOC_ID', doc.getId());
  }
  audit_('SYSTEM_SETUP', '', ownerEmail, 'Bound Google Sheet initialized');
  SpreadsheetApp.getUi().alert('UPSM সেটআপ সম্পন্ন। Script Properties ও Google Doc-এর দাপ্তরিক ফরম্যাট যাচাই করুন।');
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('UPSM · নাগরিক সেবা')
    .addItem('১. প্রথমবার সেটআপ', 'setupUPSM_')
    .addSeparator().addItem('২. নির্বাচিত আবেদনের খসড়া', 'prepareSelectedDraft_')
    .addItem('৩. নির্বাচিত আবেদন অনুমোদন', 'approveSelected_')
    .addItem('৪. নির্বাচিত আবেদন বাতিল', 'rejectSelected_')
    .addItem('৫. অনুমোদিত সনদের PDF (স্বাক্ষর যাচাই পরে)', 'issueSelected_')
    .addSeparator().addItem('ঐচ্ছিক: Google Form তৈরি', 'enableGoogleForm_')
    .addToUi();
}
function adminUser_() {
  var email = String(Session.getActiveUser().getEmail() || '').toLowerCase().trim();
  var allowed = String(props_().getProperty('ADMIN_EMAILS') || '').split(',').map(function (v) { return v.toLowerCase().trim(); });
  if (!email || allowed.indexOf(email) === -1) throw Error('এই অপারেশনের প্রশাসনিক অনুমতি নেই।');
  return email;
}
function selectedApplication_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || ss.getId() !== props_().getProperty('SPREADSHEET_ID')) throw Error('নিবন্ধিত Google Sheet থেকে কাজ করুন।');
  var selection = ss.getActiveRange();
  if (!selection || selection.getSheet().getName() !== 'Applications' || selection.getRow() < 2) throw Error('Applications শিটে একটি আবেদন সারি নির্বাচন করুন।');
  var row = selection.getRow(), values = selection.getSheet().getRange(row, 1, 1, UPSM_HEADERS_.length).getValues()[0];
  var obj = { row: row, sheet: selection.getSheet() };
  UPSM_HEADERS_.forEach(function (h, i) { obj[h] = values[i]; });
  return obj;
}
function setStatus_(d, status) {
  recordCell_(d.sheet, d.row, 'Status', status);
  recordCell_(d.sheet, d.row, 'UpdatedAt', now_());
}
function confirm_(message) {
  return SpreadsheetApp.getUi().alert(message, SpreadsheetApp.getUi().ButtonSet.YES_NO) === SpreadsheetApp.getUi().Button.YES;
}
function prepareSelectedDraft_() {
  var actor = adminUser_(), d = selectedApplication_();
  if (d.Status !== 'PENDING' && d.Status !== 'DRAFT_READY') throw Error('এই আবেদনের অবস্থা খসড়া তৈরির উপযোগী নয়।');
  if (d.DraftDocId) throw Error('আগেই খসড়া প্রস্তুত হয়েছে। বিদ্যমান DraftDocId দেখুন।');
  var p = props_();
  if (!p.getProperty('TEMPLATE_DOC_ID') || !p.getProperty('DRAFT_FOLDER_ID')) throw Error('সেটআপ সম্পন্ন হয়নি।');
  var raw = { service: d.Service, name: d.Name, father: d.Father, mother: d.Mother, village: d.Village, ward: d.Ward };
  var copy = DriveApp.getFileById(p.getProperty('TEMPLATE_DOC_ID')).makeCopy('DRAFT-' + d.ApplicationId, DriveApp.getFolderById(p.getProperty('DRAFT_FOLDER_ID')));
  var draftDoc = DocumentApp.openById(copy.getId());
  var body = draftDoc.getBody();
  var data = { certType: UPSM_SERVICES_[d.Service], memoNo: d.ApplicationId,
    issueDate: toBnDigits_(Utilities.formatDate(new Date(), 'Asia/Dhaka', 'dd-MM-yyyy')) + ' খ্রিঃ',
    name: d.Name, fatherName: d.Father, motherName: d.Mother, village: d.Village,
    wardNo: toBnDigits_(d.Ward), body_text: buildCertificateBody_(raw) };
  Object.keys(data).forEach(function (key) {
    body.replaceText('\\{\\{' + key + '\\}\\}', String(data[key] || ''));
  });
  draftDoc.saveAndClose();
  recordCell_(d.sheet, d.row, 'DraftDocId', copy.getId());
  setStatus_(d, 'DRAFT_READY');
  audit_('DRAFT_CREATED', d.ApplicationId, actor, 'Google Docs private review draft');
  SpreadsheetApp.getUi().alert('Draft তৈরি হয়েছে। Drive-এ ফাইল ID: ' + copy.getId());
}
function approveSelected_() {
  var actor = adminUser_(), d = selectedApplication_();
  if (d.Status !== 'DRAFT_READY' || !d.DraftDocId) throw Error('প্রথমে খসড়া তৈরি ও যাচাই করুন।');
  if (!confirm_('সব নাগরিক তথ্য, প্রমাণক, ওয়ারিশ/সংশোধন বিবরণ, অনুমোদিত কর্মকর্তা এবং দাপ্তরিক ভাষা যাচাই করেছেন?')) return;
  recordCell_(d.sheet, d.row, 'ApprovedBy', actor);
  recordCell_(d.sheet, d.row, 'ApprovedAt', now_());
  setStatus_(d, 'APPROVED');
  audit_('APPROVED', d.ApplicationId, actor, 'Manual officer approval');
}
function rejectSelected_() {
  var actor = adminUser_(), d = selectedApplication_();
  if (d.Status === 'ISSUED' || d.Status === 'REJECTED') throw Error('এই অবস্থায় বাতিল করা যাবে না।');
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('বাতিলের কারণ (শুধু দাপ্তরিক নথির জন্য)', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK || !response.getResponseText().trim()) return;
  recordCell_(d.sheet, d.row, 'PrivateNotes', sanitizeCell_(cleanText_(response.getResponseText(), 300)));
  setStatus_(d, 'REJECTED');
  audit_('REJECTED', d.ApplicationId, actor, 'Reason recorded privately');
}
function issueSelected_() {
  var actor = adminUser_(), d = selectedApplication_();
  if (d.Status !== 'APPROVED' || !d.DraftDocId || !d.ApprovedBy) throw Error('অনুমোদিত ও যাচাইকৃত খসড়া প্রয়োজন।');
  if (String(d.SignatureConfirmed).toUpperCase() !== 'YES') throw Error('স্বাক্ষর ও সিল যাচাই শেষে SignatureConfirmed ঘরে YES লিখুন।');
  if (d.PdfFileId) throw Error('PDF আগে তৈরি হয়েছে। দ্বিতীয় কপি করা হচ্ছে না।');
  if (!confirm_('Google Doc-এর দাপ্তরিক অনুমোদন, স্বাক্ষর এবং সিল দেখে নিশ্চিত হয়েছেন?')) return;
  var folder = DriveApp.getFolderById(props_().getProperty('DRAFT_FOLDER_ID'));
  var pdf = DriveApp.getFileById(d.DraftDocId).getAs(MimeType.PDF).setName('CERTIFICATE-' + d.ApplicationId + '.pdf');
  var file = folder.createFile(pdf); // PRIVATE: never call setSharing(ANYONE_WITH_LINK).
  recordCell_(d.sheet, d.row, 'PdfFileId', file.getId());
  recordCell_(d.sheet, d.row, 'IssuedAt', now_());
  setStatus_(d, 'ISSUED');
  audit_('ISSUED', d.ApplicationId, actor, 'Private PDF created; signed source manually confirmed');
  SpreadsheetApp.getUi().alert('ব্যক্তিগত Google Drive-এ PDF তৈরি হয়েছে। নাগরিককে দেওয়ার আগে শেষ যাচাই করুন।');
}
/** Optional Google Form intake, installed only by an authorized spreadsheet user. */
function enableGoogleForm_() {
  var actor = adminUser_(), p = props_();
  if (p.getProperty('GOOGLE_FORM_ID')) throw Error('Google Form আগে তৈরি হয়েছে: ' + p.getProperty('GOOGLE_FORM_ID'));
  var form = FormApp.create('UPSM - নাগরিক আবেদন (অফিসিয়াল যাচাই সাপেক্ষ)');
  form.setDescription('এখানে জমা দেওয়া তথ্য শুধু প্রশাসনিক যাচাইয়ের জন্য। আবেদন করলে সনদ স্বয়ংক্রিয়ভাবে অনুমোদিত হয় না।');
  form.addListItem().setTitle('service').setChoiceValues(Object.keys(UPSM_SERVICES_)).setRequired(true);
  ['name','father','mother','mobile','village','identityNo'].forEach(function (key) { form.addTextItem().setTitle(key).setRequired(true); });
  form.addListItem().setTitle('ward').setChoiceValues(['1','2','3','4','5','6','7','8','9']).setRequired(true);
  form.addListItem().setTitle('idType').setChoiceValues(['NID','BRN']).setRequired(true);
  form.addParagraphTextItem().setTitle('purpose');
  form.addCheckboxItem().setTitle('consent').setChoiceValues(['সম্মতি দিচ্ছি']).setRequired(true);
  ScriptApp.newTrigger('onCitizenFormSubmit_').forForm(form).onFormSubmit().create();
  p.setProperty('GOOGLE_FORM_ID', form.getId());
  audit_('FORM_CREATED', '', actor, 'Form created with installable submit trigger');
  SpreadsheetApp.getUi().alert('Google Form: ' + form.getPublishedUrl() + '\nপরীক্ষা ও অনুমোদনের আগে প্রকাশ করবেন না।');
}
function onCitizenFormSubmit_(event) {
  if (!event || !event.response) throw Error('Google Form submit event প্রয়োজন।');
  var fields = {};
  event.response.getItemResponses().forEach(function (item) {
    fields[item.getItem().getTitle()] = item.getResponse();
  });
  fields.consent = Array.isArray(fields.consent) && fields.consent.indexOf('সম্মতি দিচ্ছি') >= 0;
  fields.requestId = Utilities.getUuid();
  fields.extra = '';
  submitApplication(fields);
}