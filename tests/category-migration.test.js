import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {openDatabase} from '../backend/database.js';
test('migração de categorias mantém comunidades, canais e mensagens anteriores',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightcall-category-migration-'));const file=join(dir,'old.sqlite');
 try{let db=new DatabaseSync(file);db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT UNIQUE,password TEXT,name TEXT,bio TEXT DEFAULT '',avatar TEXT DEFAULT '');
 CREATE TABLE communities(id TEXT PRIMARY KEY,name TEXT,owner_id TEXT,invite_code TEXT,created_at INTEGER);
 CREATE TABLE community_channels(id TEXT PRIMARY KEY,community_id TEXT,name TEXT,kind TEXT,created_at INTEGER);
 CREATE TABLE channel_messages(id TEXT PRIMARY KEY,channel_id TEXT,sender_id TEXT,content TEXT,created_at INTEGER);
 INSERT INTO users(id,username,password,name) VALUES('u','owner','hash','Luna');
 INSERT INTO communities VALUES('c','Antiga','u','code',1);
 INSERT INTO community_channels VALUES('ch','c','geral','text',1);
 INSERT INTO channel_messages VALUES('msg','ch','u','Não perder histórico',2);`);db.close();
 for(let attempt=0;attempt<2;attempt++){db=openDatabase(file);assert.equal(db.prepare('SELECT name FROM communities').get().name,'Antiga');assert.equal(db.prepare('SELECT category_id FROM community_channels').get().category_id,null);assert.equal(db.prepare('SELECT content FROM channel_messages').get().content,'Não perder histórico');assert.equal(db.prepare('SELECT count(*) total FROM community_categories').get().total,0);db.close();}
 }finally{await rm(dir,{recursive:true,force:true});}
});
