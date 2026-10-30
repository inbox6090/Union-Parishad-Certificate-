import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {test} from 'node:test';

const base='http://127.0.0.1:3000';
const privateRoutes=[
  ['GET','/api/users'],
  ['POST','/api/users/sync'],
  ['GET','/api/admin/config'],['POST','/api/admin/config'],
  ['GET','/api/admin/logs'],['GET','/api/admin/stats'],['GET','/api/admin/trends-30days'],
  ['GET','/api/admin/pending'],['POST','/api/admin/approve-cert'],
  ['POST','/api/admin/cancel-cert'],['POST','/api/admin/batch-approve'],
  ['GET','/api/admin/export'],['POST','/api/admin/apps-script-sync'],
  ['POST','/api/admin/sheets-export'],['GET','/api/admin/backups'],
  ['POST','/api/admin/backup'],['POST','/api/admin/backup/cloud-secure-export'],
  ['GET','/api/admin/backup/export-secure-file'],['POST','/api/admin/backup/restore-secure'],
  ['POST','/api/admin/backup-r2'],['GET','/api/admin/project-clone/export'],
  ['POST','/api/admin/project-clone/import'],['POST','/api/admin/restore'],
  ['GET','/api/admin/maintenance/status'],['POST','/api/admin/maintenance/snapshot'],
  ['POST','/api/admin/maintenance/clear-cache'],
  ['GET','/api/admin/api-keys'],['POST','/api/admin/api-keys'],
  ['DELETE','/api/admin/api-keys/any'],['GET','/api/admin/webhooks'],
  ['POST','/api/admin/webhooks'],['DELETE','/api/admin/webhooks/any'],
  ['POST','/api/admin/webhooks/test'],
  ['POST','/api/certificate/generate'],['POST','/api/certificate/scan-nid'],
  ['POST','/api/certificate/verify-batch'],['GET','/api/citizen/search?nid=123'],
  ['POST','/api/ai/assistant'],
  ['GET','/api/v1/certificates'],['POST','/api/v1/certificates/apply'],
];
let proc;
async function start() {
  proc=spawn(process.execPath,['dist/server.cjs'],{
    env:{...process.env,NODE_ENV:'production',GEMINI_API_KEY:'',GOOGLE_API_KEY:'',
      FIREBASE_AUTH_EMULATOR_HOST:'',CLOUDFLARE_R2_ACCESS_KEY_ID:'',CLOUDFLARE_R2_SECRET_ACCESS_KEY:''},
    stdio:['ignore','pipe','pipe'],
  });
  const logs=[];proc.stderr.on('data',b=>logs.push(b.toString()));
  for(let i=0;i<100;i++){
    if(proc.exitCode!==null)throw Error('Local server stopped: '+logs.join('').slice(-500));
    try{const res=await fetch(base+'/api/health');if(res.ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  throw Error('Server not ready: '+logs.join('').slice(-500));
}
async function stop(){
  if(proc && proc.exitCode===null){
    proc.kill('SIGTERM');
    await Promise.race([once(proc,'exit'),new Promise(resolve=>setTimeout(resolve,2000))]);
    if(proc.exitCode===null)proc.kill('SIGKILL');
  }
}
test('no anonymous/private route access, including backup and default API key bypass',async t=>{
  await start();t.after(stop);
  for(const [method,path] of privateRoutes){
    const res=await fetch(base+path,{
      method,headers:{'Content-Type':'application/json','x-api-key':'up_live_7a8f9021b453e18c90'},
      ...(method==='GET'?{}:{body:'{}'})
    });
    assert.equal(res.status,401,method+' '+path+' leaked unauthorized access (got '+res.status+')');
  }
});
test('public certificate types, narrow QR and public-config remain available',async t=>{
  await start();t.after(stop);
  const types=await fetch(base+'/api/certificate/types');
  assert.equal(types.status,200);
  const verify=await fetch(base+'/api/certificate/verify/nonexistent?admin=true');
  assert.equal(verify.status,200);
  const config=await fetch(base+'/api/public/config');
  assert.equal(config.status,200);
  const body=await config.json();
  assert.equal(typeof body.config.upName,'string');
  for(const key of ['webhookSecret','apiKey','geminiApiKey','appsScriptUrl','sheetId','backupData']){
    assert.equal(Object.hasOwn(body.config,key),false,'public config must not contain '+key);
  }
});
