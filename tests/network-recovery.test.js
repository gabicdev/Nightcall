import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../backend/server.js';
test('diagnóstico privado, configuração TURN sem expor segredo',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-status-'));
 const server=createServer({database:join(dir,'db.sqlite'),iceServers:[{urls:'turn:relay.test',username:'user',credential:'SECRET_TURN'}]});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  assert.equal((await fetch(base+'/api/network/status')).status,401);
  const reg=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'nettest123',name:'Rede',password:'verylongpassword'})});
  assert.equal(reg.status,201);
  const cookie=reg.headers.get('set-cookie').split(';')[0];
  const response=await fetch(base+'/api/network/status',{headers:{cookie}});
  assert.equal(response.status,200);
  const raw=await response.text();
  assert.equal(raw.includes('SECRET_TURN'),false);
  assert.equal(JSON.parse(raw).turnConfigured,true);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
test('interface informa reconexão e chamada tolera perda breve',async()=>{
 const messages=await readFile(new URL('../js/messages.js',import.meta.url),'utf8');
 const calls=await readFile(new URL('../js/calls.js',import.meta.url),'utf8');
 assert.match(messages,/stream\.addEventListener\("open"/);
 assert.match(messages,/stream\.addEventListener\("error"/);
 assert.match(calls,/connectionState==="disconnected"/);
 assert.match(calls,/35000/);
 assert.match(calls,/createOffer\(\{iceRestart:true\}\)/);
});
