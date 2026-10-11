import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createServer} from '../backend/server.js';import {decodeUpload} from '../backend/media.js';
test('arquivos: tipo real, limites e imagens de perfil',()=>{
 assert.throws(()=>decodeUpload({name:'x.png',type:'image/png',data:Buffer.from('<script>alert(1)</script>').toString('base64')}),/Use PNG/);
 assert.throws(()=>decodeUpload({name:'x.svg',type:'image/svg+xml',data:Buffer.from('<svg/>').toString('base64')}),/Use PNG/);
 assert.throws(()=>decodeUpload({name:'x.gif',type:'image/gif',data:'a'.repeat(12*1024*1024)}),/8 MB/);
 assert.throws(()=>decodeUpload({name:'x.mp4',type:'video/mp4',purpose:'profile',data:Buffer.from([0,0,0,0,102,116,121,112]).toString('base64')}),/Use PNG/);
});
test('uploads autenticados persistem; anexos privados só chegam aos participantes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-uploads-'));let server=createServer({database:join(dir,'db.sqlite')});await new Promise(r=>server.listen(0,'127.0.0.1',r));let base='http://127.0.0.1:'+server.address().port;
 const call=async(path,method='GET',data,cookie='')=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',cookie},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 try{
  const users=[];for(const name of ['luna','dante','outsider'])users.push(await call('/api/auth/register','POST',{username:name,name,password:'strong password 123'}));const [a,b,c]=users;
  const image=await readFile('assets/nightcall-mark.png'),input={name:'nightcall.png',type:'image/png',data:image.toString('base64'),purpose:'chat'};
  assert.equal((await call('/api/media','POST',input)).status,401);
  const m=(await call('/api/media','POST',input,a.cookie)).data.media;assert.equal(m.size,image.length);
  assert.equal((await fetch(base+m.url,{headers:{cookie:b.cookie}})).status,403);
  await call('/api/friends/request','POST',{userId:b.data.user.id},a.cookie);await call('/api/friends/requests/'+a.data.user.id+'/accept','POST',{},b.cookie);
  assert.equal((await call('/api/messages/'+b.data.user.id,'POST',{attachments:[m.id]},c.cookie)).status,403);
  assert.equal((await call('/api/messages/'+a.data.user.id,'POST',{attachments:[m.id]},b.cookie)).status,403);
  const message=await call('/api/messages/'+b.data.user.id,'POST',{attachments:[m.id]},a.cookie);assert.equal(message.status,201);
  const received=await fetch(base+m.url,{headers:{cookie:b.cookie}});assert.equal(received.status,200);assert.equal(received.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await received.arrayBuffer()),image);
  assert.equal((await fetch(base+m.url,{headers:{cookie:c.cookie}})).status,403);
  const part=await fetch(base+m.url,{headers:{cookie:b.cookie,range:'bytes=0-7'}});assert.equal(part.status,206);assert.deepEqual(Buffer.from(await part.arrayBuffer()),image.subarray(0,8));assert.equal((await fetch(base+m.url,{headers:{cookie:b.cookie,range:'bytes=999999999-'}})).status,416);
  const profile=(await call('/api/media','POST',{...input,purpose:'profile'},a.cookie)).data.media;
  assert.equal((await call('/api/profile','PUT',{username:'luna',name:'Luna',avatar:profile.url,banner:profile.url},a.cookie)).status,200);
  assert.equal((await fetch(base+profile.url,{headers:{cookie:b.cookie}})).status,200);
  assert.equal((await call('/api/profile','PUT',{username:'dante',name:'Dante',avatar:profile.url},b.cookie)).status,403);
  const sticker=(await call('/api/media','POST',{...input,purpose:'sticker'},a.cookie)).data.media;
  assert.equal((await call('/api/stickers','GET',null,a.cookie)).data.stickers[0].id,sticker.id);assert.equal((await call('/api/stickers','GET',null,b.cookie)).data.stickers.length,0);
  const space=(await call('/api/communities','POST',{name:'Media club'},a.cookie)).data.community;await call('/api/communities/join','POST',{code:space.inviteCode},b.cookie);
  assert.equal((await call('/api/communities/'+space.id,'PATCH',{name:'Media club',icon:profile.url},a.cookie)).status,200);
  assert.equal((await call('/api/communities','GET',null,a.cookie)).data.communities[0].icon,profile.url);
  const channel=(await call('/api/communities/'+space.id,'GET',null,a.cookie)).data.channels.find(c=>c.kind==='text');
  assert.equal((await call('/api/channels/'+channel.id+'/messages','POST',{attachments:[sticker.id]},a.cookie)).status,201);
  assert.equal((await fetch(base+sticker.url,{headers:{cookie:b.cookie}})).status,200);assert.equal((await fetch(base+sticker.url,{headers:{cookie:c.cookie}})).status,403);
  await new Promise(r=>server.close(r));server=createServer({database:join(dir,'db.sqlite')});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
  assert.equal((await call('/api/auth/me','GET',null,a.cookie)).data.user.banner,profile.url);
  assert.equal((await call('/api/messages/'+a.data.user.id,'GET',null,b.cookie)).data.messages[0].attachments[0].id,m.id);
  assert.equal((await fetch(base+m.url,{headers:{cookie:b.cookie}})).status,200);
  await call('/api/messages/own/'+message.data.message.id,'DELETE',null,a.cookie);assert.equal((await fetch(base+m.url,{headers:{cookie:b.cookie}})).status,403);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
test('presença da própria sala é renovada durante consultas periódicas',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-heartbeat-'));const server=createServer({database:join(dir,'db.sqlite')});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let clock=Date.now();t.mock.method(Date,'now',()=>clock);
 const call=async(path,method='GET',data,cookie='')=>{const r=await fetch(base+path,{method,headers:{cookie,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 try{const a=await call('/api/auth/register','POST',{username:'voiceuser',name:'Voice',password:'strong password 123'});const c=(await call('/api/communities','POST',{name:'Voice room'},a.cookie)).data.community;const ch=(await call('/api/communities/'+c.id,'GET',null,a.cookie)).data.channels.find(c=>c.kind==='voice');await call('/api/channels/'+ch.id+'/voice','POST',{},a.cookie);for(let i=0;i<4;i++){clock+=30000;assert.equal((await call('/api/channels/'+ch.id+'/voice','GET',null,a.cookie)).data.participants.length,1);}await call('/api/channels/'+ch.id+'/voice','DELETE',null,a.cookie);assert.equal((await call('/api/channels/'+ch.id+'/voice','GET',null,a.cookie)).data.participants.length,0);}finally{t.mock.restoreAll();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
