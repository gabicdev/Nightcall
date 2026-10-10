import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from '../backend/server.js';
import {spawnSync} from 'node:child_process';
test('endpoint público de saúde sem dados privados e HEAD',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'nightcall-health-'));
 const server=createServer({root:process.cwd(),database:path.join(dir,'db.sqlite')});
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const response=await fetch(base+'/api/health');
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{status:'ok',service:'nightcall'});
  const head=await fetch(base+'/api/health',{method:'HEAD'});
  assert.equal(head.status,200);assert.equal(await head.text(),'');
 }finally{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});}
});
test('diagnóstico não aceita redirecionamentos nem dados de URL',()=>{
 const script=readFileSync(new URL('../scripts/healthcheck.mjs',import.meta.url),'utf8');
 assert.match(script,/redirect:'manual'/);
 assert.match(script,/json\?\.service==='nightcall'/);
 assert.match(script,/base\.username \|\| base\.password/);
});
test('build limpa executáveis antigos, teste portátil tem timeout',()=>{
 const bat=readFileSync(new URL('../GERAR-EXE-WINDOWS.ps1',import.meta.url),'utf8');
 const smoke=readFileSync(new URL('../TESTAR-EXECUTAVEL-WINDOWS.ps1',import.meta.url),'utf8');
 assert.match(bat,/Remove-Item -Force/);
 assert.match(smoke,/Start-Sleep -Seconds 12/);
});
