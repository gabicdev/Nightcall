import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../backend/server.js';
test('duas contas: convite, aceite, mensagens, privacidade e persistência',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-social-'));
 let srv=createServer({database:join(dir,'db.sqlite')});
 const start=async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${srv.address().port}`};
 let base=await start();
 const call=async(path,method='GET',data,cookie='')=>{const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',cookie},body:data?JSON.stringify(data):undefined});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]}};
 try {
  const users=[];
  for(const name of ['alice','bruna','carol']) {const r=await call('/api/auth/register','POST',{username:name,name,password:'super safe password'});assert.equal(r.status,201);users.push({id:r.data.user.id,cookie:r.cookie});}
  const [a,b,c]=users;
  assert.equal((await call(`/api/messages/${b.id}`,'GET',null,a.cookie)).status,403);
  assert.equal((await call('/api/users/search?username=@bruna','GET',null,a.cookie)).data.user.id,b.id);
  assert.equal((await call('/api/friends/request','POST',{userId:b.id},a.cookie)).status,200);
  assert.equal((await call('/api/friends','GET',null,b.cookie)).data.incoming.length,1);
  assert.equal((await call(`/api/friends/requests/${a.id}/accept`,'POST',null,c.cookie)).status,404);
  assert.equal((await call(`/api/friends/requests/${a.id}/accept`,'POST',null,b.cookie)).status,200);
  assert.equal((await call('/api/friends','GET',null,a.cookie)).data.friends.length,1);
  const sent=await call(`/api/messages/${b.id}`,'POST',{content:'Olá, tudo certo?'},a.cookie);
  assert.equal(sent.status,201);
  assert.equal((await call(`/api/messages/${a.id}`,'GET',null,b.cookie)).data.messages[0].content,'Olá, tudo certo?');
  assert.equal((await call(`/api/messages/${a.id}`,'GET',null,c.cookie)).status,403);
  assert.equal((await call(`/api/messages/${b.id}`,'POST',{content:' '},a.cookie)).status,400);
  assert.equal((await call('/api/conversations','GET',null,b.cookie)).data.conversations.length,1);
  await new Promise(r=>srv.close(r));srv=createServer({database:join(dir,'db.sqlite')});base=await start();
  assert.equal((await call(`/api/messages/${a.id}`,'GET',null,b.cookie)).data.messages.length,1);
  assert.equal((await call(`/api/friends/${b.id}`,'DELETE',null,a.cookie)).status,200);
  assert.equal((await call(`/api/messages/${a.id}`,'GET',null,b.cookie)).status,403);
 } finally {await new Promise(r=>srv.close(r));await rm(dir,{recursive:true,force:true});}
});
