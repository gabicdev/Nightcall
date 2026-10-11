import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createServer} from '../backend/server.js';

test('sinalização de voz é autenticada, privada e encaminhada só a amigos conectados', async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-calls-'));
 const srv=createServer({database:join(dir,'test.sqlite')});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${srv.address().port}`;
 const post=async(path,body,cookie='')=>{
  const r=await fetch(url+path,{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});
  return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
 };
 let reader;
 try{
  const a=await post('/api/auth/register',{username:'caller1',name:'Caller',password:'test-password-123'});
  const b=await post('/api/auth/register',{username:'callee1',name:'Callee',password:'test-password-123'});
  const c=await post('/api/auth/register',{username:'outsidr',name:'Outsider',password:'test-password-123'});
  const msg={to:b.data.user.id,type:'offer',callId:'call-test-12345',payload:{sdp:{type:'offer',sdp:'mock'}}};
  assert.equal((await post('/api/calls/signal',msg)).status,401);
  assert.equal((await post('/api/calls/signal',msg,a.cookie)).status,403);
  await post('/api/friends/request',{userId:b.data.user.id},a.cookie);
  await post(`/api/friends/requests/${a.data.user.id}/accept`,{},b.cookie);
  assert.equal((await post('/api/calls/signal',msg,a.cookie)).status,409);
  const controller=new AbortController();
  const connected=await fetch(url+'/api/events',{headers:{cookie:b.cookie},signal:controller.signal});
  reader=connected.body.getReader();await reader.read();
  assert.equal((await post('/api/calls/signal',{...msg,type:'hack'},a.cookie)).status,400);
  assert.equal((await post('/api/calls/signal',msg,c.cookie)).status,403);
  assert.equal((await post('/api/calls/signal',msg,a.cookie)).status,200);
  const event=await reader.read();
  assert.match(new TextDecoder().decode(event.value),/event: call/);
  assert.match(new TextDecoder().decode(event.value),/call-test-12345/);
  for(const type of ['hangup','reject','busy'])assert.equal((await post('/api/calls/signal',{...msg,type,payload:null},a.cookie)).status,200);
  assert.equal((await post('/api/calls/signal',{...msg,payload:{sdp:{type:'offer',sdp:'x'.repeat(16000)}}},a.cookie)).status,200);
  assert.equal((await post('/api/calls/signal',{...msg,payload:null},a.cookie)).status,400);
  controller.abort();
 }finally{
  try{await reader?.cancel();}catch{}
  await new Promise(r=>srv.close(r));await rm(dir,{force:true,recursive:true});
 }
});
