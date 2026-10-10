import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../backend/server.js';
test('presença de voz: autenticação, comunidade, entrada, leitura e saída',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nc-voice-'));
 const srv=createServer({database:join(dir,'db.sqlite')});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${srv.address().port}`;
 const call=async(path,method='GET',data,cookie='')=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',cookie},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
 try{
 const a=await call('/api/auth/register','POST',{username:'voiceowner',name:'Voice owner',password:'strong password 123'});
 const b=await call('/api/auth/register','POST',{username:'voiceother',name:'Other',password:'strong password 123'});
 const c=await call('/api/communities','POST',{name:'Voice group'},a.cookie); const id=c.data.community.id;
 const info=await call(`/api/communities/${id}`,'GET',null,a.cookie); const ch=info.data.channels.find(x=>x.kind==='voice');
 const path=`/api/channels/${ch.id}/voice`;
 assert.equal((await call(path,'POST',null,b.cookie)).status,403);
 assert.equal((await call(path,'GET',null,b.cookie)).status,403);
 assert.equal((await call(path,'GET')).status,401);
 assert.equal((await call(path,'POST',null,a.cookie)).status,200);
 let roster=await call(path,'GET',null,a.cookie);assert.deepEqual(roster.data.participants.map(x=>x.id),[a.data.user.id]);
 assert.equal((await call(path,'DELETE',null,a.cookie)).status,200);
 roster=await call(path,'GET',null,a.cookie);assert.equal(roster.data.participants.length,0);
 }finally{await new Promise(r=>srv.close(r));await rm(dir,{recursive:true,force:true});}
});
