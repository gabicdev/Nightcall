import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const desktop=readFileSync(new URL('../desktop/main.cjs',import.meta.url),'utf8');
const script=readFileSync(new URL('../GERAR-EXE-WINDOWS.cmd',import.meta.url),'utf8');
test('desktop oferece reconexão após falha do servidor',()=>{
  assert.match(desktop,/Tentar reconectar/);
  assert.match(desktop,/await loadApp\(\)/);
  assert.match(desktop,/Sem conexão com o Nightcall/);
});
test('compilação exige NSIS e executável portátil',()=>{
  assert.match(script,/GERAR-EXE-WINDOWS\.ps1/);
  assert.match(readFileSync(new URL('../GERAR-EXE-WINDOWS.ps1',import.meta.url),'utf8'),/check:release/);
  const validator=readFileSync(new URL('../scripts/validate-release.cjs',import.meta.url),'utf8');
  assert.match(validator,/nsis/);assert.match(validator,/portable/);
});
