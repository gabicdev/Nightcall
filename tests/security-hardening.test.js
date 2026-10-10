import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from '../backend/server.js';

test('arquivos estáticos: métodos, tipos e cabeçalhos seguros', async () => {
  const dir = await mkdtemp(join(tmpdir(),'nightcall-hardening-'));
  const server = createServer({root:resolve('.'), database:join(dir,'db.sqlite')});
  await new Promise(r => server.listen(0,'127.0.0.1',r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const home = await fetch(base+'/');
    assert.equal(home.status,200);
    assert.equal(home.headers.get('x-frame-options'),'DENY');
    assert.equal(home.headers.get('referrer-policy'),'no-referrer');
    assert.equal((await fetch(base+'/package.json')).status,404);
    assert.equal((await fetch(base+'/index.html',{method:'POST'})).status,405);
    assert.equal((await fetch(base+'/css/layout.css')).status,200);
    assert.notEqual((await fetch(base+'/..%5c..%5csecret.txt')).status,200);
  } finally {
    await new Promise(r=>server.close(r));
    await rm(dir,{recursive:true,force:true});
  }
});
