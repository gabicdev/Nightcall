import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../backend/server.js';
test('RTC autenticado, cookie seguro e proteção de origem em HTTPS',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-remote-'));
 const iceServers=[{urls:'turn:relay.test:3478',username:'short-lived',credential:'temporary'}];
 const server=createServer({database:join(dir,'db.sqlite'),secure:true,publicOrigin:'https://chat.example.test',iceServers});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 try {
  assert.equal((await fetch(base+'/api/rtc/config')).status,401);
  const credentials={username:'user100',name:'Usuário',password:'my long password'};
  const registered=await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json',origin:'https://chat.example.test'},body:JSON.stringify(credentials)});
  assert.equal(registered.status,201);
  assert.match(registered.headers.get('set-cookie'),/Secure/);
  const cookie=registered.headers.get('set-cookie').split(';')[0];
  const rtc=await fetch(base+'/api/rtc/config',{headers:{cookie}});
  assert.equal(rtc.status,200);
  assert.deepEqual((await rtc.json()).iceServers,iceServers);
  const denied=await fetch(base+'/api/auth/logout',{method:'POST',headers:{cookie,origin:'https://evil.example.test'}});
  assert.equal(denied.status,403);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
