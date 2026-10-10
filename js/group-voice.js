import {api} from './api.js';
// Malha WebRTC para salas pequenas: até cinco participantes.
export function createGroupVoice(onUpdate=()=>{}){
 let channel=null,self=null,microphone=null,source=null,ticker=null,muted=false,deaf=false,joining=false;
 const peers=new Map(),pending=new Map(),volumes=new Map(),retryAt=new Map();
 const MAX_PEERS=4;
 const signal=(to,type,payload)=>api(`/api/channels/${channel}/voice/signal`,{method:'POST',body:JSON.stringify({to,type,payload})});
 async function rtcConfig(){try{return await api('/api/rtc/config')}catch{return {iceServers:[]}}}
 function audioFor(id){return [...document.querySelectorAll('audio[data-group-peer]')].find(e=>e.dataset.groupPeer===String(id))}
 function applyVolume(id){const audio=audioFor(id);if(audio)audio.volume=deaf?0:(volumes.get(String(id))??1)}
 function drop(id){const key=String(id),pc=peers.get(key);peers.delete(key);if(pc&&pc.signalingState!=='closed')pc.close();pending.delete(key);const audio=audioFor(key);if(audio){audio.srcObject=null;audio.remove()}}
 async function connect(id,initiator=false){
  const key=String(id);if(peers.has(key)||!channel||!microphone)return peers.get(key);
  if(peers.size>=MAX_PEERS)throw Error("Limite de conexões de voz alcançado.");
  const generation=channel,pc=new RTCPeerConnection(await rtcConfig());if(channel!==generation){pc.close();return}
  peers.set(key,pc);
  const el=document.createElement('audio');el.autoplay=true;el.dataset.groupPeer=key;document.body.append(el);applyVolume(key);
  pc.ontrack=e=>{el.srcObject=e.streams[0]||new MediaStream([e.track]);el.play().catch(()=>onUpdate('Clique no aplicativo para permitir o áudio.'))};
  pc.onicecandidate=e=>{if(e.candidate&&channel===generation)signal(id,'ice',e.candidate.toJSON()).catch(()=>{})};
  pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'){retryAt.set(key,Date.now()+5000);drop(key);onUpdate('Conexão de voz interrompida; tentando recuperar.')}else if(pc.connectionState==='closed')drop(key)};
  microphone.getTracks().forEach(track=>pc.addTrack(track,microphone));
  if(initiator){const offer=await pc.createOffer();await pc.setLocalDescription(offer);await signal(id,'offer',{sdp:pc.localDescription.toJSON()})}
  return pc;
 }
 async function receive(data){if(!channel||String(data.channelId)!==String(channel)||String(data.from)===String(self))return;
  const key=String(data.from);
  try{if(data.type==='leave'){drop(key);return}
   // Em caso de nova oferta, descartar sessão antiga que falhou.
   if(data.type==='offer'&&peers.get(key)?.signalingState==='closed')drop(key);
   const pc=await connect(key,false);if(!pc)return;
   if(data.type==='offer'&&data.payload?.sdp){
    if(pc.signalingState!=='stable')await pc.setLocalDescription({type:'rollback'});
    await pc.setRemoteDescription(data.payload.sdp);
    const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await signal(data.from,'answer',{sdp:pc.localDescription.toJSON()});
   }
   if(data.type==='answer'&&data.payload?.sdp&&pc.signalingState==='have-local-offer')await pc.setRemoteDescription(data.payload.sdp);
   if(pc.remoteDescription){for(const candidate of pending.get(key)||[])await pc.addIceCandidate(candidate);pending.delete(key)}
   if(data.type==='ice'&&data.payload){if(pc.remoteDescription)await pc.addIceCandidate(data.payload);else pending.set(key,[...(pending.get(key)||[]),data.payload].slice(-30))}
  }catch(e){onUpdate(`Erro na voz: ${e.message}`);retryAt.set(key,Date.now()+5000);drop(key)}
 }
 async function refresh(){if(!channel)return [];
  const current=channel,{participants}=await api(`/api/channels/${current}/voice`);if(channel!==current)return [];
  const ids=new Set(participants.map(p=>String(p.id)));
  if(participants.length>5)onUpdate("Canal acima do limite recomendado de cinco pessoas.");
  for(const id of [...peers.keys()])if(!ids.has(id))drop(id);
  for(const p of participants){const id=String(p.id);if(id!==String(self)&&String(self)<id&&!peers.has(id)&&Date.now()>=(retryAt.get(id)||0)){
    await connect(id,true).catch(e=>{retryAt.set(id,Date.now()+5000);drop(id);onUpdate(e.message)});
  }}
  return participants;
 }
 async function leave(){const old=channel;channel=null;clearInterval(ticker);ticker=null;source?.close();source=null;
  for(const id of [...peers.keys()])drop(id);pending.clear();retryAt.clear();
  if(microphone){microphone.getTracks().forEach(t=>t.stop());microphone=null}
  if(old)await api(`/api/channels/${old}/voice`,{method:'DELETE'}).catch(()=>{});
 }
 async function join(id){if(joining)throw Error("Entrada no canal em andamento.");joining=true;try{await leave();if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection)throw Error('WebRTC exige HTTPS ou localhost.');
  microphone=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
  microphone.getAudioTracks().forEach(t=>t.enabled=!muted);
  try{const me=await api('/api/auth/me');self=me.user.id;await api(`/api/channels/${id}/voice`,{method:'POST'});channel=id;
   source=new EventSource('/api/events');source.addEventListener('voice-signal',event=>{try{void receive(JSON.parse(event.data))}catch{}});
   source.addEventListener('open',()=>{void refresh().catch(()=>{})});
   ticker=setInterval(()=>refresh().catch(e=>onUpdate(e.message)),4000);
   return await refresh();
  }catch(e){await leave();throw e}
  }finally{joining=false}
 }
 function setMute(v){muted=!!v;microphone?.getAudioTracks().forEach(t=>t.enabled=!muted);return muted}
 function setDeaf(v){deaf=!!v;for(const id of peers.keys())applyVolume(id);return deaf}
 function setVolume(id,value){const volume=Math.max(0,Math.min(1,Number(value)||0));volumes.set(String(id),volume);applyVolume(String(id));return volume}
 function getVolume(id){return volumes.get(String(id))??1}
 return {join,leave,refresh,setMute,setDeaf,setVolume,getVolume,get muted(){return muted},get deaf(){return deaf},get active(){return !!channel}};
}
