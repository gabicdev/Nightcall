import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('captura descarta selecao obsoleta depois de encerrar chamada',()=>{
 const calls=file('js/calls.js');
 assert.match(calls,/captureSequence\+\+/);
 assert.match(calls,/attempt!==captureSequence/);
 assert.match(calls,/capture\.getTracks\(\)\.forEach\(t=>t\.stop\(\)\)/);
});
test('audio mixer libera contexto ao falhar',()=>{
 const calls=file('js/calls.js');
 assert.match(calls,/context && context!==screenAudioContext/);
 assert.match(calls,/await context\.close\(\)/);
});
test('diagnostico nao promete medir o jogo ou gerar executavel',()=>{
 assert.ok(existsSync(new URL('../DIAGNOSTICO-WINDOWS.cmd',import.meta.url)));
 const script=file('scripts/resources.mjs');
 assert.match(script,/node-diagnostic-process-only/);
});
