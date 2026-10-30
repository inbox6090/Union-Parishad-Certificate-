import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { test } from 'node:test';

const base='http://127.0.0.1:3000';
async function withLocalServer(fn) {
  const output=[];
  const p=spawn(process.execPath,['dist/server.cjs'],{
    env:{...process.env,NODE_ENV:'production',GOOGLE_API_KEY:'',GEMINI_API_KEY:'',
      FIREBASE_AUTH_EMULATOR_HOST:'',GOOGLE_APPLICATION_CREDENTIALS:'',DATABASE_URL:'',
      R2_ACCOUNT_ID:'',R2_ACCESS_KEY_ID:'',R2_SECRET_ACCESS_KEY:''},
    stdio:['ignore','pipe','pipe']
  });
  p.stdout.on('data',x=>output.push(x.toString()));
  p.stderr.on('data',x=>output.push(x.toString()));
  try {
    let ready=false;
    for(let i=0;i<75;i++){
      if(p.exitCode!==null)break;
      try {
        const r=await fetch(base+'/api/health');
        if(r.status===200){ready=true;break;}
      }catch{}
      await new Promise(resolve=>setTimeout(resolve,180));
    }
    assert.ok(ready,'localhost test server failed to start: '+output.join('').slice(-600));
    await fn();
  }finally{
    if(p.exitCode===null){
      p.kill('SIGTERM');
      await Promise.race([once(p,'exit'),new Promise(resolve=>setTimeout(resolve,2000))]);
      if(p.exitCode===null)p.kill('SIGKILL');
    }
  }
}
test('anonymous and forged API-key only clients cannot reach private/admin/write endpoints',async()=>{
  await withLocalServer(async()=>{
    const locked=[
      ['GET','/api/admin/config'],
      ['POST','/api/admin/config'],
      ['GET','/api/admin/logs'],
      ['GET','/api/admin/backups'],
      ['POST','/api/admin/backup'],
      ['POST','/api/admin/backup/cloud-secure-export'],
      ['GET','/api/admin/backup/export-secure-file'],
      ['POST','/api/admin/backup/restore-secure'],
      ['POST','/api/admin/backup-r2'],
      ['POST','/api/admin/restore'],
      ['GET','/api/admin/project-clone/export'],
      ['POST','/api/admin/project-clone/import'],
      ['POST','/api/admin/maintenance/snapshot'],
      ['GET','/api/admin/api-keys'],
      ['GET','/api/admin/webhooks'],
      ['POST','/api/admin/webhooks/test'],
      ['POST','/api/admin/approve-cert'],
      ['POST','/api/admin/batch-approve'],
      ['POST','/api/admin/apps-script-sync'],
      ['POST','/api/admin/sheets-export'],
      ['POST','/api/certificate/generate'],
      ['POST','/api/certificate/scan-nid'],
      ['POST','/api/certificate/verify-batch'],
      ['GET','/api/citizen/search?nid=1234567890'],
      ['GET','/api/v1/certificates?apiKey=untrusted'],
      ['POST','/api/v1/certificates/apply?apiKey=untrusted'],
      ['GET','/api/users']
    ];
    for(const [method,route] of locked){
      const r=await fetch(base+route,{method,headers:{
        'Content-Type':'application/json','x-api-key':'forged',
      },...(method!=='GET'?{body:'{}'}:{})});
      assert.equal(r.status,401,method+' '+route+' must reject missing Firebase ID token');
    }
    const unauthorized=await fetch(base+'/api/admin/backups',{headers:{Authorization:'Bearer definitely-invalid'}});
    assert.equal(unauthorized.status,401,'invalid Bearer tokens must be rejected');
  });
});
test('public health/catalog/config/verification remains read-only',async()=>{
  await withLocalServer(async()=>{
    for(const path of ['/api/health','/api/certificate/types','/api/public/config','/api/certificate/verify/NO-SUCH-MEMO','/api/v1/certificates/verify/NO-SUCH-MEMO']){
      const res=await fetch(base+path);
      assert.ok([200,404].includes(res.status),path+' should remain available without staff login');
    }
    const conf=await fetch(base+'/api/public/config').then(r=>r.json());
    assert.ok(conf.config && conf.config.upName,'safe public union config should exist');
    assert.deepEqual(Object.keys(conf.config).sort(),
      ['upName','address','upazila','district','chairmanName','secretaryName','sealText'].sort());
    const bad=await fetch(base+'/api/applications/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    assert.equal(bad.status,400,'legacy public application submission still validates missing required fields');
  });
});
