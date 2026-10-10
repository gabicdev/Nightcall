import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createServer} from '../backend/server.js';
test('sinalização de grupo exige associação e presença no mesmo canal',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nc-group-'));const server=createServer({database:join(dir,'db.sqlite')});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(path,method='GET',data,cookie='')=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',cookie},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
 let reader,controller;try{
 const a=await call('/api/auth/register','POST',{username:'groupowner',name:'Owner',password:'strong-password123'});
 const b=await call('/api/auth/register','POST',{username:'groupguest',name:'Guest',password:'strong-password123'});
 const c=await call('/api/auth/register','POST',{username:'groupalien',name:'Alien',password:'strong-password123'});
 const cm=await call('/api/communities','POST',{name:'Test'},a.cookie);const id=cm.data.community.id;
 const ch=(await call(`/api/communities/${id}`,'GET',null,a.cookie)).data.channels.find(x=>x.kind==='voice').id;
 const path=`/api/channels/${ch}/voice/signal`,msg={to:b.data.user.id,type:'offer',payload:{sdp:{type:'offer',sdp:'test'}}};
 assert.equal((await call(path,'POST',msg,a.cookie)).status,403);
 await call('/api/communities/join','POST',{code:cm.data.community.inviteCode},b.cookie);
 await call(`/api/channels/${ch}/voice`,'POST',null,a.cookie);
 assert.equal((await call(path,'POST',msg,a.cookie)).status,403);
 await call(`/api/channels/${ch}/voice`,'POST',null,b.cookie);
 assert.equal((await call(path,'POST',msg,c.cookie)).status,403);
 controller=new AbortController();const opened=await fetch(base+'/api/events',{headers:{cookie:b.cookie},signal:controller.signal});reader=opened.body.getReader();await reader.read();
 assert.equal((await call(path,'POST',{...msg,type:'inject'},a.cookie)).status,400);
 assert.equal((await call(path,'POST',msg,a.cookie)).status,200);
 const event=await reader.read();assert.match(new TextDecoder().decode(event.value),/event: voice-signal/);
 await call(`/api/channels/${ch}/voice`,'DELETE',null,b.cookie);
 assert.equal((await call(path,'POST',msg,a.cookie)).status,403);
 }finally{controller?.abort();try{await reader?.cancel()}catch{}await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true})}
});
