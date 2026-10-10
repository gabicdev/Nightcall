import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url);
const {readRemoteConfig,saveRemoteConfig}=require('../desktop/runtime-config.cjs');
test('configuração desktop: local, remoto e variável de ambiente',()=>{
 const dir=mkdtempSync(join(tmpdir(),'nightcall-config-'));
 try {
  assert.equal(readRemoteConfig(dir,{}).mode,'local');
  saveRemoteConfig(dir,'https://example.com/');
  assert.equal(readRemoteConfig(dir,{}).remote,'https://example.com');
  assert.equal(readRemoteConfig(dir,{NIGHTCALL_SERVER_URL:'https://override.example'}).remote,'https://override.example');
  assert.equal(JSON.parse(readFileSync(join(dir,'server-config.json'),'utf8')).serverUrl,'https://example.com');
 } finally {rmSync(dir,{recursive:true,force:true});}
});
test('configuração desktop: URL insegura e arquivo quebrado rejeitados',()=>{
 const dir=mkdtempSync(join(tmpdir(),'nightcall-config-'));
 try {
  assert.throws(()=>saveRemoteConfig(dir,'http://example.com'));
  writeFileSync(join(dir,'server-config.json'),'{quebrado');
  assert.throws(()=>readRemoteConfig(dir,{}),/Configuração inválida/);
 } finally {rmSync(dir,{recursive:true,force:true});}
});
