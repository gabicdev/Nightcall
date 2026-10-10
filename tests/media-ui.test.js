import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/calls.js',import.meta.url),'utf8');
test('controles de mídia e captura de tela disponíveis na interface',()=>{
 for(const feature of ['getDisplayMedia','replaceTrack','Compartilhar tela','Silenciar','call-videos','track.addEventListener("ended"']) assert.ok(source.includes(feature),feature);
});
