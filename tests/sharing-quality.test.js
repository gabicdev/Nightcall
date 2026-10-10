import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const calls=readFileSync(new URL('../js/calls.js',import.meta.url),'utf8');
test('qualidade de transmissão: opções e limite de bitrate',()=>{
  assert.match(calls,/\[480,720,1080\]/);
  assert.match(calls,/\[15,30,60\]/);
  assert.match(calls,/setParameters\(parameters\)/);
  assert.match(calls,/selectedCaptureConstraints\(\)/);
});
test('áudio compartilhado opcional com restauração do microfone',()=>{
  assert.match(calls,/getDisplayMedia\(selectedCaptureConstraints\(\)\)/);
  assert.match(calls,/createMediaStreamDestination\(\)/);
  assert.match(calls,/microphoneSender\.replaceTrack\(stream\.getAudioTracks\(\)\[0\]\)/);
  assert.match(calls,/releaseMixedAudio\(\)/);
});
