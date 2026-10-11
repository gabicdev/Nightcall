import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase} from '../backend/database.js';
import {createServer} from '../backend/server.js';
test('migração aditiva mantém contas e sessões antigas e pode ser repetida',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'nightcall-migration-')); const file=join(dir,'old.sqlite');
  try {
    const old=new DatabaseSync(file);
    old.exec("CREATE TABLE users(id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,password TEXT NOT NULL,name TEXT NOT NULL,bio TEXT NOT NULL DEFAULT '',avatar TEXT NOT NULL DEFAULT ''); CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);");
    old.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run('old-user','old_user','unchanged-secret','Antigo','Bio antiga','https://example.com/avatar.png');
    old.prepare('INSERT INTO sessions VALUES(?,?,?)').run('old-session','old-user',Date.now()+60000); old.close();
    for(let i=0;i<2;i++) {
      const db=openDatabase(file); const user=db.prepare('SELECT * FROM users').get();
      assert.equal(user.password,'unchanged-secret'); assert.equal(user.avatar,'https://example.com/avatar.png'); assert.equal(user.banner,'');
      assert.equal(db.prepare('SELECT count(*) n FROM sessions').get().n,1); db.close();
    }
  } finally {await rm(dir,{recursive:true,force:true});}
});
test('banner é persistente, isolado por conta e rejeita protocolos perigosos',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'nightcall-banner-')); let srv; let base;
  const start=async()=>{srv=createServer({database:join(dir,'db.sqlite')});await new Promise(r=>srv.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+srv.address().port;};
  const call=async(path,method='GET',body,cookie='')=>{const r=await fetch(base+path,{method,headers:{cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
  try {
    await start(); const a=await call('/api/auth/register','POST',{name:'Alice',username:'alice',password:'strong password 123'});const b=await call('/api/auth/register','POST',{name:'Bob',username:'bob',password:'strong password 123'});
    const profile={name:'Alice',username:'alice',banner:'https://example.com/banner.png'};
    assert.equal((await call('/api/profile','PUT',profile,a.cookie)).status,200);
    assert.equal((await call('/api/profile','PUT',{...profile,banner:'javascript:alert(1)'},a.cookie)).status,400);
    assert.equal((await call('/api/profile','PUT',{name:'Alice',username:'alice',bio:'Alteração antiga sem banner'},a.cookie)).data.user.banner,profile.banner);
    assert.equal((await call('/api/auth/me','GET',null,b.cookie)).data.user.banner,'');
    await new Promise(r=>srv.close(r));await start();
    assert.equal((await call('/api/auth/me','GET',null,a.cookie)).data.user.banner,profile.banner);
    assert.equal((await call('/api/profile','PUT',{...profile,banner:''},a.cookie)).data.user.banner,'');
  } finally {await new Promise(r=>srv.close(r));await rm(dir,{recursive:true,force:true});}
});
