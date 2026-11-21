'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const src = fs.readFileSync(__dirname + '/../Code.gs', 'utf8');
function createHarness() {
  const applications = [['CreatedAt','ApplicationId','RequestId','Service','Name','Father','Mother','Mobile','Ward','Village','IdType','IdentityNo','Purpose','Status','TrackingHash','UpdatedAt','DraftDocId','ApprovedBy','ApprovedAt','SignatureConfirmed','PdfFileId','IssuedAt','PrivateNotes']];
  const audit = [['Timestamp','Event','ApplicationId','Actor','Detail']];
  function sheet(rows) { return { getLastRow: () => rows.length, getRange(r,c,n,w) { return { getValues() { return rows.slice(r-1,r-1+n).map(x => x.slice(c-1,c-1+w)); } }; }, appendRow(row) { rows.push(row); } }; }
  const apps = sheet(applications), logs = sheet(audit);
  let emailCount = 0, uuid = 1;
  const cache = new Map();
  const context = vm.createContext({
    Date, console,
    SpreadsheetApp: { openById: () => ({getSheetByName: n => n === 'Applications' ? apps : logs}) },
    PropertiesService: {getScriptProperties: () => ({getProperty: k => ({SPREADSHEET_ID:'sid',NOTIFY_EMAIL:'test@localhost'}[k] || '')})},
    LockService: {getScriptLock: () => ({waitLock(){},releaseLock(){}})},
    CacheService: {getScriptCache: () => ({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})},
    MailApp: {sendEmail: () => emailCount++},
    Utilities: {
      DigestAlgorithm: {SHA_256:'sha256'}, Charset: {UTF_8:'utf8'},
      computeDigest: (_alg,s) => [...crypto.createHash('sha256').update(s).digest()].map(x => x>127?x-256:x),
      formatDate: () => '2026-11-21T16:00:00',
      getUuid: () => 'aaaaaaaa-aaaa-4aaa-8aaa-' + String(uuid++).padStart(12,'0')
    }
  });
  vm.runInContext(src, context);
  const good = {service:'citizenship',name:'আরিফ',father:'করিম',mother:'রহিমা',mobile:'01712345678',ward:'2',village:'বহেড়াতৈল',idType:'NID',identityNo:'1234567890',requestId:'48f0a6ce-48dc-4b2b-b95e-4d88ab32e30f',consent:true,extra:''};
  return {ctx:context,applications,audit,getMails:()=>emailCount,good};
}
test('public form stores one private application, sends a PII-free email and returns a secret', () => {
  const h=createHarness(), receipt=h.ctx.submitApplication(h.good);
  assert.equal(receipt.status,'PENDING');
  assert.equal(h.applications.length,2);
  assert.equal(h.applications[1][11],'1234567890');
  assert.equal(h.applications[1][14],crypto.createHash('sha256').update(receipt.trackingSecret).digest('hex'));
  assert.equal(h.getMails(),1);
  const status=h.ctx.getApplicationStatus(receipt.applicationId,receipt.trackingSecret);
  assert.equal(status.status,'PENDING');
  assert.equal(Object.hasOwn(status,'identityNo'),false);
  assert.equal(h.audit.length,2);
});
test('duplicate request is idempotent, and rejects wrong status secret', () => {
  const h=createHarness(), receipt=h.ctx.submitApplication(h.good);
  const duplicate=h.ctx.submitApplication(h.good);
  assert.equal(duplicate.duplicate,true);
  assert.equal(h.applications.length,2);
  assert.equal(h.getMails(),1);
  assert.throws(()=>h.ctx.getApplicationStatus(receipt.applicationId,receipt.trackingSecret+'z'),/পাওয়া যায়নি/);
});
test('spreadsheet formula injection is stored literally not executed', () => {
  const h=createHarness();
  h.ctx.submitApplication({...h.good,name:'=HYPERLINK("https://evil.example")'});
  assert.equal(h.applications[1][4].startsWith("'="),true);
});