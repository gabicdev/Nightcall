import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../backend/server.js';
test('SSE notifica uma mensagem somente às contas participantes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-sse-'));
 const srv=createServer({database:join(dir,'db.sqlite')});
 await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${srv.address().port}`;
 const request=async(path,method='GET',payload,cookie='')=>{
  const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',cookie},body:payload?JSON.stringify(payload):undefined});
  return {status:res.status,cookie:res.headers.get('set-cookie')?.split(';')[0],data:await res.json()};
 };
 let reader;
 try {
  const a=await request('/api/auth/register','POST',{username:'streama',name:'A',password:'senha-segura-123'});
  const b=await request('/api/auth/register','POST',{username:'streamb',name:'B',password:'senha-segura-123'});
  assert.equal((await request('/api/events')).status,401);
  await request('/api/friends/request','POST',{userId:b.data.user.id},a.cookie);
  await request(`/api/friends/requests/${a.data.user.id}/accept`,'POST',null,b.cookie);
  const stream=await fetch(base+'/api/events',{headers:{cookie:b.cookie},signal:AbortSignal.timeout(4000)});
  assert.equal(stream.status,200);
  assert.match(stream.headers.get('content-type'),/text\/event-stream/);
  reader=stream.body.getReader();
  await reader.read();
  assert.deepEqual((await request('/api/presence','GET',null,a.cookie)).data.online,[b.data.user.id]);
  const sent=await request(`/api/messages/${b.data.user.id}`,'POST',{content:'testando eventos'},a.cookie);
  assert.equal(sent.status,201);
  const next=await reader.read();
  assert.match(new TextDecoder().decode(next.value),/event: message/);
 } finally {
  try {await reader?.cancel();} catch {}
  await new Promise(resolve=>srv.close(resolve));
  await rm(dir,{recursive:true,force:true});
 }
});
