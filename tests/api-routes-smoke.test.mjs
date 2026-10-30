import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';

const base='http://127.0.0.1:3000';
let child;
const errors=[];
async function start() {
  child=spawn(process.execPath,['dist/server.cjs'], {
    env:{...process.env,NODE_ENV:'production',GOOGLE_API_KEY:'',GEMINI_API_KEY:''},
    stdio:['ignore','pipe','pipe'],
  });
  child.stdout.on('data',b=>errors.push(b.toString()));
  child.stderr.on('data',b=>errors.push(b.toString()));
  for(let i=0;i<60;i++){
    if(child.exitCode!==null) throw new Error('Server exited before readiness: '+errors.join('').slice(-1000));
    try { const r=await fetch(base+'/api/health');if(r.ok)return; } catch {}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw new Error('Server did not become ready: '+errors.join('').slice(-1000));
}
async function stop() {
  if(child && child.exitCode===null){
    child.kill('SIGTERM');
    await Promise.race([once(child,'exit'),new Promise(resolve=>setTimeout(resolve,2500))]);
    if(child.exitCode===null)child.kill('SIGKILL');
  }
}
test('unauthenticated request receives 401 on private application routes', async (t) => {
  await start();
  t.after(stop);
  const attempts=[
    ['/api/applications',{method:'GET'}],
    ['/api/applications/APP-2026-BUP-0104',{method:'GET'}],
    ['/api/applications/APP-2026-BUP-0104/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'approved'})}],
    ['/api/applications/APP-2026-BUP-0104/issue',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}],
  ];
  for(const [route,options] of attempts){
    const res=await fetch(base+route,options);
    assert.equal(res.status,401,route+' must require Firebase Auth ID token');
  }
});
test('public QR endpoints never reveal full certificate with admin=true', async (t)=>{
  if(!child || child.exitCode!==null) await start();
  t.after(stop);
  for(const endpoint of ['/api/certificate/verify/','/api/v1/certificates/verify/']){
    const res=await fetch(base+endpoint+'BUP-2026-1108?admin=true');
    const body=await res.json();
    const text=JSON.stringify(body);
    for(const forbidden of ['citizen','applicantNid','bodyText','extra','qrCodeUrl','attachments']){
      assert.equal(Object.hasOwn(body,forbidden),false,forbidden+' should not be in public API');
    }
    assert.ok(!text.includes('19922692015000456'),'Do not expose seeded sample NID');
    assert.equal(res.status<500,true);
  }
});
