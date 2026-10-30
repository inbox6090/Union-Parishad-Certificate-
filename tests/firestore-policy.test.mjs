import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

test('Firestore rules must not contain unconditional OR-true access', () => {
  assert.doesNotMatch(rules, /\|\|\s*true\b/, 'Unconditional OR true bypasses authorization');
});

test('private collections must not allow direct public reads', () => {
  for (const collection of ['certificates', 'applications', 'citizens', 'configs', 'backups', 'admins']) {
    const match = rules.match(new RegExp('match\\s+\\/' + collection + '\\/\\{[^}]+\\}\\s*\\{([\\s\\S]*?)\\n\\s*\\}'));
    assert.ok(match, 'Missing security rule for ' + collection);
    assert.doesNotMatch(match[1], /allow\s+(?:read|list|get)\s*:\s*if\s+true\b/, collection + ' is public');
  }
});

test('public verification and private certificates must use separate collections', () => {
  assert.match(rules, /match\s+\/public_verifications\/\{/);
  assert.match(rules, /match\s+\/certificates\/\{/);
});
