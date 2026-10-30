import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyApiRoute, isAllowedAtLevel } from '../src/middleware/express-route-policy.ts';

const apiRoutes = [
  ['GET','/api/health','public'],['GET','/api/certificate/types','public'],
  ['GET','/api/public/config','public'],['GET','/api/certificate/verify/SAFE-TEST','public'],
  ['GET','/api/v1/certificates/verify/SAFE-TEST','public'],
  ['POST','/api/applications/submit','public'],
  ['POST','/api/users/sync','authenticated'],['GET','/api/users','staff'],
  ['GET','/api/applications/APP-1','authenticated'],
  ['GET','/api/applications','staff'],['POST','/api/applications/APP-1/status','staff'],
  ['POST','/api/applications/APP-1/issue','approver'],
  ['GET','/api/admin/config','staff'],['POST','/api/admin/config','admin'],
  ['GET','/api/admin/logs','staff'],['GET','/api/admin/pending','staff'],
  ['POST','/api/admin/approve-cert','approver'],['POST','/api/admin/cancel-cert','approver'],
  ['POST','/api/admin/batch-approve','approver'],
  ['GET','/api/admin/backups','admin'],['POST','/api/admin/backup','admin'],
  ['POST','/api/admin/backup/cloud-secure-export','admin'],
  ['GET','/api/admin/backup/export-secure-file','admin'],
  ['POST','/api/admin/backup/restore-secure','admin'],
  ['POST','/api/admin/backup-r2','admin'],['POST','/api/admin/restore','admin'],
  ['GET','/api/admin/project-clone/export','admin'],['POST','/api/admin/project-clone/import','admin'],
  ['GET','/api/admin/api-keys','admin'],['POST','/api/admin/api-keys','admin'],
  ['DELETE','/api/admin/api-keys/1','admin'],['GET','/api/admin/webhooks','admin'],
  ['POST','/api/admin/webhooks/test','admin'],['POST','/api/admin/webhooks','admin'],
  ['DELETE','/api/admin/webhooks/1','admin'],
  ['POST','/api/certificate/generate','approver'],['POST','/api/certificate/scan-nid','staff'],
  ['POST','/api/certificate/verify-batch','staff'],['GET','/api/citizen/search','staff'],
  ['POST','/api/ai/assistant','staff'],
  ['GET','/api/v1/certificates','staff'],['POST','/api/v1/certificates/apply','approver'],
] as const;

test('intentional public routes only; all protected routes require an access level',()=>{
  for(const [method,path,expected] of apiRoutes) {
    assert.equal(classifyApiRoute(method,path),expected,method+' '+path);
  }
});
test('method/path impersonation does not weaken policy',()=>{
  for(const [method,path] of [
    ['POST','/api/public/config'],['GET','/api/admin/config/anything'],
    ['GET','/api/certificate/generate'],['GET','/api/health/more'],
    ['POST','/api/v1/certificates/verify/SAFE-TEST'],
    ['POST','/api/admin/backup/no-such-action'],
    ['GET','/api/certificate/verify/'],
    ['GET','/api/v1/certificates/verify/'],
    ['GET','/api/surprise-unclassified'],
  ]) {
    assert.notEqual(classifyApiRoute(method,path),'public',method+' '+path);
  }
});
test('zero-role, citizen, operator, approver, admin allowlist boundaries',()=>{
  const u={uid:'cit-1',role:'citizen'};
  const op={uid:'op-1',role:'operator'};
  const approver={uid:'ap-1',roles:{approver:true}};
  const admin={uid:'ad-1',role:'admin'};
  for(const level of ['authenticated','staff','approver','admin'] as const){
    assert.equal(isAllowedAtLevel(level,null),false);
  }
  assert.equal(isAllowedAtLevel('staff',u),false);
  assert.equal(isAllowedAtLevel('staff',op),true);
  assert.equal(isAllowedAtLevel('approver',op),false);
  assert.equal(isAllowedAtLevel('admin',approver),false);
  assert.equal(isAllowedAtLevel('approver',approver),true);
  assert.equal(isAllowedAtLevel('admin',admin),true);
  assert.equal(isAllowedAtLevel('admin',{...u,email:'admin@fake.local',localStorageRole:'admin'}),false);
});
test('every Express /api route has a declared explicit policy',()=>{
  const src=readFileSync(new URL('../server.ts',import.meta.url),'utf8');
  const routes=[...src.matchAll(/app\.(get|post|delete|put|patch)\(\s*["'](\/api\/[^"']+)["']/g)];
  assert.ok(routes.length>=40,'expected route inventory');
  for(const [,method,route] of routes) {
    // Param placeholders contain no real access grants; substitute test identifier.
    const concrete=route.replace(/:[A-Za-z]+/g,'TEST-ID');
    assert.notEqual(classifyApiRoute(method.toUpperCase(),concrete),'deny',
      'unclassified route '+method+' '+route);
  }
});
