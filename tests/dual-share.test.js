import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const calls=readFileSync(new URL('../js/calls.js',import.meta.url),'utf8');
test('duas faixas de video WebRTC com remetentes independentes',()=>{
  assert.match(calls,/firstVideoTransceiver=offered\[0\]\|\|peer\.addTransceiver\('video'/);
  assert.match(calls,/secondVideoTransceiver=offered\[1\]\|\|peer\.addTransceiver\('video'/);
  assert.match(calls,/secondVideoSender=secondVideoTransceiver\.sender/);
  assert.match(calls,/event\.transceiver===videos\[1\]\?secondRemoteVideo:remoteVideo/);
});
test('segunda transmissão possui captura, preview e encerramento próprios',()=>{
  assert.match(calls,/async function toggleSecondScreen\(/);
  assert.match(calls,/secondVideoSender\.replaceTrack\(track\)/);
  assert.match(calls,/secondLocalPreview\.srcObject=new MediaStream\(\[track\]\)/);
  assert.match(calls,/secondVideoSender\.replaceTrack\(null\)/);
  assert.match(calls,/stopSecondScreen\(\)/);
});
