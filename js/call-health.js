export function createAudioActivity(stream) {
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context||!stream?.getAudioTracks().length)return {active:()=>false,close(){}};
  let context,source,analyser,buffer,until=0,closed=false;
  try{
    context=new Context();source=context.createMediaStreamSource(stream);analyser=context.createAnalyser();analyser.fftSize=512;
    source.connect(analyser);buffer=new Float32Array(analyser.fftSize);void context.resume().catch(()=>{});
  }catch{void context?.close().catch(()=>{});return {active:()=>false,close(){}};}
  return {
    active(){
      if(closed||context.state!=='running'||!stream.getAudioTracks().some(t=>t.readyState==='live'&&t.enabled))return false;
      analyser.getFloatTimeDomainData(buffer);let sum=0;for(const sample of buffer)sum+=sample*sample;
      if(Math.sqrt(sum/buffer.length)>.025)until=performance.now()+260;
      return performance.now()<until;
    },
    close(){if(closed)return;closed=true;source.disconnect();analyser.disconnect();void context.close().catch(()=>{});}
  };
}

export function summarizeConnection(report,previous=null) {
  let pair,rttMs=null,received=0,lost=0,relay=false;
  const values=[...report.values()];
  const transport=values.find(x=>x.type==='transport'&&x.selectedCandidatePairId);
  pair=transport?report.get(transport.selectedCandidatePairId):values.find(x=>x.type==='candidate-pair'&&x.state==='succeeded'&&(x.nominated||x.selected));
  if(pair){
    if(Number.isFinite(pair.currentRoundTripTime))rttMs=Math.round(pair.currentRoundTripTime*1000);
    relay=[report.get(pair.localCandidateId),report.get(pair.remoteCandidateId)].some(x=>x?.candidateType==='relay');
  }
  for(const stat of values)if(stat.type==='inbound-rtp'&&(stat.kind==='audio'||stat.mediaType==='audio')){
    received+=Math.max(0,stat.packetsReceived||0);lost+=Math.max(0,stat.packetsLost||0);
  }
  const deltaReceived=previous?Math.max(0,received-previous.received):received;
  const deltaLost=previous?Math.max(0,lost-previous.lost):lost;
  const loss=deltaReceived+deltaLost?deltaLost/(deltaReceived+deltaLost):null;
  const known=rttMs!==null||loss!==null;
  const grade=!known?'unknown':(rttMs!==null&&rttMs>600)||(loss!==null&&loss>.1)?'poor':(rttMs!==null&&rttMs>300)||(loss!==null&&loss>.03)?'fair':'good';
  return {rttMs,loss,relay,received,lost,grade};
}

export function connectionDescription(state,health) {
  if(state!=='connected')return {connecting:'Conectando…',new:'Conectando…',disconnected:'Reconectando…',failed:'Recuperando conexão…',closed:'Desconectado'}[state]||'Conectando…';
  const label={good:'Boa conexão',fair:'Conexão instável',poor:'Conexão fraca',unknown:'Conectado'}[health?.grade]||'Conectado';
  return label+(health?.rttMs!==null&&health?.rttMs!==undefined?' · '+health.rttMs+' ms':'');
}
