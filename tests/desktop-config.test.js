import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {normalizeRemoteUrl}=require('../desktop/remote-config.cjs');
test('modo local preservado por padrão',()=>assert.equal(normalizeRemoteUrl(''),''));
test('servidor HTTPS válido',()=>assert.equal(normalizeRemoteUrl('https://nightcall.example/'),'https://nightcall.example'));
test('bloqueia HTTP, credenciais e paths',()=>{
  for(const v of ['http://nightcall.example','https://x:y@nightcall.example','https://nightcall.example/path','https://nightcall.example/?token=a','file:///tmp/x'])
    assert.throws(()=>normalizeRemoteUrl(v));
});
