import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('SSE protege buffers e limpa estados temporários ao encerrar',()=>{
  const code=readFileSync(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(code,/res\.writableLength > 256 \* 1024/);
  assert.match(code,/clearInterval\(cleanupTimer\)/);
  assert.match(code,/signalingRate\.delete\(key\)/);
});
test('Electron impede duas instâncias e build valida desktop',()=>{
  const desktop=readFileSync(new URL('../desktop/main.cjs',import.meta.url),'utf8');
  const builder=readFileSync(new URL('../GERAR-EXE-WINDOWS.ps1',import.meta.url),'utf8');
  assert.match(desktop,/requestSingleInstanceLock\(\)/);
  assert.match(desktop,/second-instance/);
  assert.match(builder,/check:desktop/);
  assert.match(builder,/Build frontend/);
});
