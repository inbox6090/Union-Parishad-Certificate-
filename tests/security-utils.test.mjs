import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeInput, sanitizeObject, verifySha256Checksum, calculateSha256Checksum } from '../src/utils/security.ts';

test('HTML delimiters and inline JS markup are escaped in user input', () => {
  assert.equal(
    sanitizeInput('<script>alert("x")</script>'),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt;'
  );
});

test('NoSQL operator characters and dotted nested keys are sanitized', () => {
  const value = sanitizeObject({ '$where': 'return true', profile: { 'user.name': '<unsafe>' } });
  assert.equal(value['&#x24;where'], 'return true');
  assert.equal(value.profile['user&#x2E;name'], '&lt;unsafe&gt;');
});

test('optional input is empty and a positive maximum length caps output', () => {
  assert.equal(sanitizeInput(null), '');
  assert.equal(sanitizeInput('123456', 3), '123');
});

test('a changed backup payload never matches the original checksum', async () => {
  const original = { certificateId: 'unit-test', version: 1 };
  const checksum = await calculateSha256Checksum(original);
  assert.equal(await verifySha256Checksum(original, checksum), true);
  assert.equal(await verifySha256Checksum({ ...original, version: 2 }, checksum), false);
});
