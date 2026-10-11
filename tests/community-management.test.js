import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../backend/server.js';
test('edição preserva histórico; exclusão exige dono e nome, isola a comunidade e invalida convites',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-manage-'));const server=createServer({database:join(dir,'db.sqlite')});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port;
 const call=async(path,method='GET',data,cookie='')=>{const res=await fetch(url+path,{method,headers:{cookie,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};};
 try{
  const users=[];for(const username of ['owner','member','outside']){const r=await call('/api/auth/register','POST',{name:username,username,password:'strong password 123'});users.push({id:r.data.user.id,cookie:r.cookie});}const [owner,member,outside]=users;
  const first=(await call('/api/communities','POST',{name:'Espaço original'},owner.cookie)).data.community;
  const second=(await call('/api/communities','POST',{name:'Espaço preservado'},owner.cookie)).data.community;
  const category=(await call('/api/communities/'+second.id+'/categories','POST',{name:'Categoria isolada'},owner.cookie)).data.category;
  assert.equal((await call('/api/communities/'+first.id+'/channels','POST',{name:'invalid-category',categoryId:category.id},owner.cookie)).status,400);
  const ownCategory=(await call('/api/communities/'+first.id+'/categories','POST',{name:'Conversas'},owner.cookie)).data.category;
  assert.equal((await call('/api/communities/'+first.id+'/channels','POST',{name:'organizado',categoryId:ownCategory.id},owner.cookie)).status,201);
  await call('/api/communities/join','POST',{code:first.inviteCode},member.cookie);
  const detail=(await call('/api/communities/'+first.id,'GET',null,owner.cookie)).data;const channel=detail.channels.find(c=>c.kind==='text');
  await call('/api/channels/'+channel.id+'/messages','POST',{content:'Histórico importante'},member.cookie);
  assert.equal((await call('/api/communities/'+first.id,'PATCH',{name:'Proibido'},member.cookie)).status,403);
  assert.equal((await call('/api/communities/'+first.id,'DELETE',{confirmName:first.name},outside.cookie)).status,404);
  assert.equal((await call('/api/communities/'+first.id,'DELETE',{confirmName:first.name},member.cookie)).status,403);
  await call('/api/communities/'+first.id+'/members/'+member.id,'PATCH',{role:'admin'},owner.cookie);
  assert.equal((await call('/api/communities/'+first.id,'PATCH',{name:'x'},owner.cookie)).status,400);
  assert.equal((await call('/api/communities/'+first.id,'PATCH',{name:'Nome atualizado'},member.cookie)).status,200);
  assert.equal((await call('/api/channels/'+channel.id+'/messages','GET',null,owner.cookie)).data.messages[0].content,'Histórico importante');
  assert.equal((await call('/api/communities/'+first.id,'DELETE',{confirmName:'Nome atualizado'},member.cookie)).status,403);
  assert.equal((await call('/api/communities/'+first.id,'DELETE',{confirmName:first.name},owner.cookie)).status,400);
  assert.equal((await call('/api/communities/'+first.id,'DELETE',{confirmName:'Nome atualizado'},owner.cookie)).status,200);
  assert.equal((await call('/api/channels/'+channel.id+'/messages','GET',null,owner.cookie)).status,403);
  assert.equal((await call('/api/communities/join','POST',{code:first.inviteCode},outside.cookie)).status,404);
  assert.equal((await call('/api/communities/'+second.id,'GET',null,owner.cookie)).status,200);
  assert.equal((await call('/api/communities/'+second.id,'GET',null,owner.cookie)).data.categories[0].id,category.id);
  for(const u of users)assert.equal((await call('/api/auth/me','GET',null,u.cookie)).status,200);
  assert.deepEqual((await call('/api/communities','GET',null,member.cookie)).data.communities,[]);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
