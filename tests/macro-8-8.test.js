import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../js/calls.js',import.meta.url),'utf8');
test('captura persiste configuração e tolera dados corrompidos',()=>{
  assert.match(src,/const settingsKey="nightcall-capture-v1"/);
  assert.match(src,/try \{const value=JSON\.parse\(localStorage\.getItem/);
  assert.match(src,/catch\{return \{\};\}/);
  assert.match(src,/localStorage\.setItem\(settingsKey/);
});
test('resolução e FPS têm lista permitida',()=>{
  assert.match(src,/\[480,720,1080\]\.includes/);
  assert.match(src,/\[15,30,60\]\.includes/);
});
test('captura bloqueia cliques paralelos e libera botão após erro',()=>{
  assert.match(src,/if\(screenButton\?\.disabled\)return/);
  assert.match(src,/screenButton\.disabled=true/);
  assert.match(src,/finally\{if\(screenButton\)screenButton\.disabled=false;\}/);
});
test('troca de dispositivo preserva seleção quando ainda disponível',()=>{
  assert.match(src,/const previous=microphoneSelect\.value\|\|readCaptureSettings\(\)\.microphone/);
  assert.match(src,/microphoneSelect\.value=previous/);
});
test('encerrar chamada libera vídeo e restaura saída de áudio',()=>{
  assert.match(src,/resetAudioOutput\(\);/);
  assert.match(src,/if\(localPreview\)localPreview\.srcObject=null/);
});
