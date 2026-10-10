import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../backend/server.js';
test('bloqueio e exclusão: permissões verificadas no servidor',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-privacy-'));
 const srv=createServer({database:join(dir,'db.sqlite')});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${srv.address().port}`;
 const call=async(path,method='GET',data,cookie='')=>{
  const r=await fetch(base+path,{method,headers:{'content-type':'application/json',cookie},body:data?JSON.stringify(data):undefined});
  return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
 };
 try{
  const a=await call('/api/auth/register','POST',{username:'teste_a',name:'A',password:'uma senha segura 123'});
  const b=await call('/api/auth/register','POST',{username:'teste_b',name:'B',password:'uma senha segura 123'});
  const c=await call('/api/auth/register','POST',{username:'teste_c',name:'C',password:'uma senha segura 123'});
  const ai=a.data.user.id,bi=b.data.user.id;
  await call('/api/friends/request','POST',{userId:bi},a.cookie);
  await call(`/api/friends/requests/${ai}/accept`,'POST',null,b.cookie);
  const msg=await call(`/api/messages/${bi}`,'POST',{content:'mensagem privada'},a.cookie);
  assert.equal(msg.status,201);
  assert.equal((await call(`/api/messages/own/${msg.data.message.id}`,'DELETE',null,b.cookie)).status,404);
  assert.equal((await call(`/api/messages/own/${msg.data.message.id}`,'DELETE',null,a.cookie)).status,200);
  assert.equal((await call(`/api/messages/${ai}`,'GET',null,b.cookie)).data.messages.length,0);
  assert.equal((await call(`/api/blocks/${bi}`,'POST',null,a.cookie)).status,200);
  assert.equal((await call('/api/blocks','GET',null,a.cookie)).data.blocked.length,1);
  assert.equal((await call('/api/friends','GET',null,b.cookie)).data.friends.length,0);
  assert.equal((await call('/api/friends/request','POST',{userId:ai},b.cookie)).status,403);
  assert.equal((await call(`/api/messages/${ai}`,'GET',null,b.cookie)).status,403);
  assert.equal((await call(`/api/blocks/${bi}`,'DELETE',null,c.cookie)).status,200);
  assert.equal((await call('/api/blocks','GET',null,a.cookie)).data.blocked.length,1);
  assert.equal((await call(`/api/blocks/${bi}`,'DELETE',null,a.cookie)).status,200);
  assert.equal((await call('/api/blocks','GET',null,a.cookie)).data.blocked.length,0);
 }finally{await new Promise(r=>srv.close(r));await rm(dir,{recursive:true,force:true});}
});
