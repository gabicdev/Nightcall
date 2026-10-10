import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
test('gerador windows abre a pasta release corretamente',()=>{
 const bat=read('GERAR-EXE-WINDOWS.ps1');
 assert.match(bat,/Start-Process explorer\.exe/);
 assert.doesNotMatch(bat,/releaseexplorer/);
});
test('voz em grupo restringe paralelismo e tamanho de malha',()=>{
 const src=read('js/group-voice.js');
 assert.match(src,/if\(joining\)throw Error/);
 assert.match(src,/finally\{joining=false\}/);
 assert.match(src,/peers\.size>=MAX_PEERS/);
});
test('captura limita eco e preview nao toca audio local',()=>{
 assert.match(read('js/calls.js'),/autoGainControl:true/);
 assert.match(read('js/calls.js'),/localPreview\.muted=true/);
});
