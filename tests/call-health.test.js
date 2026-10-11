import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeConnection,connectionDescription} from '../js/call-health.js';

function report({rtt=.06,received=1000,lost=0,relay=false}={}){return new Map([
 ['transport',{type:'transport',selectedCandidatePairId:'pair'}],
 ['pair',{type:'candidate-pair',currentRoundTripTime:rtt,localCandidateId:'local',remoteCandidateId:'remote'}],
 ['local',{type:'local-candidate',candidateType:relay?'relay':'host'}],
 ['remote',{type:'remote-candidate',candidateType:'srflx'}],
 ['audio',{type:'inbound-rtp',kind:'audio',packetsReceived:received,packetsLost:lost}]
]);}
test('qualidade usa a conexão selecionada e perda recente, sem carregar endereços',()=>{
 const first=summarizeConnection(report({received:1000,lost:100}));
 const next=summarizeConnection(report({received:1100,lost:100,relay:true}),first);
 assert.equal(next.rttMs,60);assert.equal(next.loss,0);assert.equal(next.grade,'good');assert.equal(next.relay,true);
 assert.equal('address' in next,false);assert.equal('credential' in next,false);
});
test('latência ou perda elevada degradam o indicador e estatísticas ausentes ficam desconhecidas',()=>{
 assert.equal(summarizeConnection(report({rtt:.4})).grade,'fair');
 assert.equal(summarizeConnection(report({rtt:.8})).grade,'poor');
 assert.equal(summarizeConnection(report({received:50,lost:20})).grade,'poor');
 assert.equal(summarizeConnection(new Map()).grade,'unknown');
 assert.equal(connectionDescription('disconnected',{grade:'good',rttMs:10}),'Reconectando…');
 assert.equal(connectionDescription('connected',{grade:'good',rttMs:60}),'Boa conexão · 60 ms');
});
