import {readFileSync,existsSync} from 'node:fs';
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const required=['firebase','react','vite'];
for(const name of required)if(!pkg.dependencies?.[name])throw Error('Missing dependency: '+name);
if(!existsSync('firestore.rules'))throw Error('Missing Firestore rules');
const rules=readFileSync('firestore.rules','utf8');
if(/allow\s+(?:read|write|create|update|delete)(?:\s*,\s*\w+)*\s*:\s*if\s+true\s*;/.test(rules))throw Error('Unconditional Firestore access detected');
if(!rules.includes('publicCertificateVerifications'))throw Error('Missing public QR projection rules');
console.log('Static build preflight passed. IMPORTANT: does NOT certify Firebase security, API parity, or deployment readiness.');
