import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
test('Cloudflare static build has independent script',()=>{const p=JSON.parse(readFileSync('package.json','utf8'));assert.match(p.scripts['build:pages'],/vite build/);assert.doesNotMatch(p.scripts['build:pages'],/server\.ts/);});
test('Firestore rules deny unrestricted private collections',()=>{const s=readFileSync('firestore.rules','utf8');assert.doesNotMatch(s,/allow\s+(read|write|create|update|delete)(?:\s*,\s*\w+)*\s*:\s*if\s+true\s*;/);assert.match(s,/publicCertificateVerifications/);});
test('Cloudflare API requests fail closed instead of SPA fallback',()=>{const s=readFileSync('functions/api/[[path]].ts','utf8');assert.match(s,/503/);});
