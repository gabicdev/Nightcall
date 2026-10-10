import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../backend/server.js';
test('comunidades: convites, canais, isolamento e cargos',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-communities-')); const srv=createServer({database:join(dir,'db.sqlite')});await new Promise(r=>srv.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${srv.address().port}`;
 const call=async(path,method='GET',data,cookie='')=>{const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',cookie},body:data?JSON.stringify(data):undefined});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]}};
 try{
 const users=[];for(const username of ['owner','member','outsider']){const r=await call('/api/auth/register','POST',{username,name:username,password:'strong password 123'});users.push({id:r.data.user.id,cookie:r.cookie})}const [a,b,c]=users;
 const create=await call('/api/communities','POST',{name:'Equipe Noturna'},a.cookie);assert.equal(create.status,201);const id=create.data.community.id,code=create.data.community.inviteCode;
 assert.equal((await call('/api/communities/'+id,'GET',null,c.cookie)).status,404);
 assert.equal((await call('/api/communities/'+id+'/channels','POST',{name:'privado'},b.cookie)).status,403);
 assert.equal((await call('/api/communities/join','POST',{code},b.cookie)).status,200);
 const info=await call('/api/communities/'+id,'GET',null,b.cookie);assert.equal(info.data.members.length,2);assert.equal(info.data.community.inviteCode,null);
 const channel=info.data.channels.find(x=>x.kind==='text');assert.ok(channel);
 assert.equal((await call(`/api/channels/${channel.id}/messages`,'POST',{content:'secreto'},c.cookie)).status,403);
 assert.equal((await call(`/api/channels/${channel.id}/messages`,'POST',{content:'oi'},b.cookie)).status,201);
 assert.equal((await call(`/api/channels/${channel.id}/messages`,'GET',null,a.cookie)).data.messages[0].content,'oi');
 assert.equal((await call('/api/communities/'+id+'/members/'+b.id,'PATCH',{role:'admin'},b.cookie)).status,403);
 assert.equal((await call('/api/communities/'+id+'/members/'+b.id,'PATCH',{role:'admin'},a.cookie)).status,200);
 assert.equal((await call('/api/communities/'+id+'/channels','POST',{name:'novidades',kind:'text'},b.cookie)).status,201);
 assert.equal((await call('/api/communities/'+id+'/channels','POST',{name:'no spaces'},a.cookie)).status,400);
 }finally{await new Promise(r=>srv.close(r));await rm(dir,{recursive:true,force:true})}
});
