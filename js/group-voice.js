import {captureError} from './media.js';
import {api} from './api.js';
import {createAudioActivity,summarizeConnection} from './call-health.js';
// Malha WebRTC para salas pequenas: até cinco participantes.
export function createGroupVoice(onUpdate=()=>{}){
 let channel=null,self=null,microphone=null,source=null,ticker=null,muted=false,deaf=false,joining=false;
 let camera=null,screen=null,mediaBusy=false,mutingBeforeDeaf=false;
 const remoteState=new Map(),remoteMedia=new Map(),videoSenders=new Map(),connecting=new Map();let refreshing=null,stateQueue=Promise.resolve(),epoch=0;
 const peers=new Map(),pending=new Map(),volumes=new Map(),retryAt=new Map();
 const activities=new Map(),health=new Map(),recovery=new Map(),signalQueue=new Map();
 let selectedMicrophone='',replacingMicrophone=false,statsBusy=false;
 const MAX_PEERS=4;
 const signal=(to,type,payload)=>api(`/api/channels/${channel}/voice/signal`,{method:'POST',body:JSON.stringify({to,type,payload})});
 async function rtcConfig(){try{return await api('/api/rtc/config')}catch{return {iceServers:[]}}}
 function audioFor(id){return [...document.querySelectorAll('audio[data-group-peer]')].find(e=>e.dataset.groupPeer===String(id))}
 function applyVolume(id){const audio=audioFor(id);if(audio)audio.volume=deaf?0:(volumes.get(String(id))??1)}
 function drop(id){const key=String(id),pc=peers.get(key);activities.get(key)?.close();activities.delete(key);health.delete(key);recovery.delete(key);remoteMedia.delete(key);videoSenders.delete(key);peers.delete(key);if(pc&&pc.signalingState!=='closed')pc.close();pending.delete(key);const audio=audioFor(key);if(audio){audio.srcObject=null;audio.remove()}}
 async function recover(id,manual=false){
  const key=String(id),pc=peers.get(key);if(!channel||!pc||pc.signalingState==='closed')return;
  const state=recovery.get(key)||{attempts:0,last:0,busy:false};recovery.set(key,state);
  if(manual)state.attempts=0;
  if(state.busy||!manual&&Date.now()-state.last<8000||state.attempts>=3)return;
  state.busy=true;state.last=Date.now();state.attempts++;
  try{
    if(String(self)<key){
      if(pc.signalingState==='stable'){const offer=await pc.createOffer({iceRestart:true});if(peers.get(key)!==pc)return;await pc.setLocalDescription(offer);}
      if(pc.localDescription?.type==='offer')await signal(key,'offer',{sdp:pc.localDescription.toJSON()});
    }else await signal(key,'reconnect',{});
    onUpdate('Recuperando a conexão de voz…');
  }catch(error){onUpdate('Reconexão pendente. Confira sua conexão.');}finally{state.busy=false;}
 }
 async function sampleHealth(){
  if(statsBusy||!channel)return;statsBusy=true;
  try{await Promise.all([...peers].map(async([id,pc])=>{try{const report=await pc.getStats();if(peers.get(id)===pc)health.set(id,summarizeConnection(report,health.get(id)));}catch{}}));}finally{statsBusy=false;}
 }
 async function connect(id,initiator=false,offer=null){const key=String(id);if(connecting.has(key))return connecting.get(key);const task=establish(id,initiator,offer);connecting.set(key,task);try{return await task;}finally{if(connecting.get(key)===task)connecting.delete(key);}}
 async function establish(id,initiator=false,offer=null){
  const key=String(id);if(peers.has(key)||!channel||!microphone)return peers.get(key);
  if(peers.size>=MAX_PEERS)throw Error("Limite de conexões de voz alcançado.");
  const generation=channel,version=epoch,pc=new RTCPeerConnection(await rtcConfig());if(channel!==generation||epoch!==version){pc.close();return}
  peers.set(key,pc);
  const el=document.createElement('audio');el.autoplay=true;el.dataset.groupPeer=key;document.body.append(el);applyVolume(key);
  pc.ontrack=e=>{if(peers.get(key)!==pc)return;if(e.track.kind==='video'){const videos=pc.getTransceivers().filter(t=>t.receiver.track.kind==='video');const media=remoteMedia.get(key)||{};media[e.transceiver===videos[1]?'screen':'camera']=new MediaStream([e.track]);remoteMedia.set(key,media);for(const event of ['unmute','mute','ended'])e.track.addEventListener(event,()=>onUpdate(''));onUpdate('');return;}el.srcObject=e.streams[0]||new MediaStream([e.track]);activities.get(key)?.close();activities.set(key,createAudioActivity(el.srcObject));el.play().catch(()=>onUpdate('Clique no aplicativo para permitir o áudio.'))};
  if(offer)await pc.setRemoteDescription(offer);
  microphone.getTracks().forEach(track=>pc.addTrack(track,microphone));
  const offered=pc.getTransceivers().filter(t=>t.receiver.track.kind==='video');
  const cameraTransceiver=offered[0]||pc.addTransceiver('video',{direction:'sendrecv'}),screenTransceiver=offered[1]||pc.addTransceiver('video',{direction:'sendrecv'});
  cameraTransceiver.direction='sendrecv';screenTransceiver.direction='sendrecv';
  videoSenders.set(key,[cameraTransceiver.sender,screenTransceiver.sender]);
  await cameraTransceiver.sender.replaceTrack(camera?.getVideoTracks()[0]||null);await screenTransceiver.sender.replaceTrack(screen?.getVideoTracks()[0]||null);
  pc.onicecandidate=e=>{if(e.candidate&&channel===generation)signal(id,'ice',e.candidate.toJSON()).catch(()=>{})};
  pc.onconnectionstatechange=()=>{if(peers.get(key)!==pc)return;if(pc.connectionState==='connected'){recovery.delete(key);onUpdate('');}else if(pc.connectionState==='failed'||pc.connectionState==='disconnected'){void recover(key);onUpdate('Conexão instável; tentando recuperar.');}else if(pc.connectionState==='closed')drop(key)};
  recovery.set(key,{attempts:0,last:Date.now(),busy:false});
  if(initiator){const offer=await pc.createOffer();await pc.setLocalDescription(offer);await signal(id,'offer',{sdp:pc.localDescription.toJSON()})}
  return pc;
 }
 function receive(data){const key=String(data.from),version=epoch;const task=(signalQueue.get(key)||Promise.resolve()).catch(()=>{}).then(()=>{if(epoch===version)return processSignal(data);});signalQueue.set(key,task);void task.finally(()=>{if(signalQueue.get(key)===task)signalQueue.delete(key);}).catch(()=>{});return task;}
 async function processSignal(data){if(!channel||String(data.channelId)!==String(channel)||String(data.from)===String(self))return;
  const key=String(data.from);
  try{if(data.type==='leave'){drop(key);return}if(data.type==='reconnect'){await recover(key);return;}
   // Em caso de nova oferta, descartar sessão antiga que falhou.
   if(data.type==='offer'&&peers.get(key)?.signalingState==='closed')drop(key);
   if(data.type==='ice'&&!peers.has(key)){pending.set(key,[...(pending.get(key)||[]),data.payload].slice(-30));return;}
   const pc=await connect(key,false,data.type==='offer'?data.payload?.sdp:null);if(!pc)return;
   if(data.type==='offer'&&data.payload?.sdp){
    if(pc.signalingState==='have-local-offer')await pc.setLocalDescription({type:'rollback'});
    if(pc.remoteDescription?.sdp!==data.payload.sdp.sdp)await pc.setRemoteDescription(data.payload.sdp);
    const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await signal(data.from,'answer',{sdp:pc.localDescription.toJSON()});
   }
   if(data.type==='answer'&&data.payload?.sdp&&pc.signalingState==='have-local-offer')await pc.setRemoteDescription(data.payload.sdp);
   if(pc.remoteDescription){for(const candidate of pending.get(key)||[])await pc.addIceCandidate(candidate);pending.delete(key)}
   if(data.type==='ice'&&data.payload){if(pc.remoteDescription)await pc.addIceCandidate(data.payload);else pending.set(key,[...(pending.get(key)||[]),data.payload].slice(-30))}
  }catch(e){onUpdate(`Erro na voz: ${e.message}`);retryAt.set(key,Date.now()+5000);drop(key)}
 }
 async function refresh(){if(refreshing)return refreshing;const task=refreshPeers();refreshing=task;try{return await task;}finally{if(refreshing===task)refreshing=null;}}
 async function refreshPeers(){if(!channel)return [];
  const current=channel,{participants}=await api(`/api/channels/${current}/voice`);if(channel!==current)return [];
  if(!participants.some(p=>String(p.id)===String(self))){await api(`/api/channels/${current}/voice`,{method:'POST'});await publishState();}
  for(const p of participants)remoteState.set(String(p.id),p);
  const ids=new Set(participants.map(p=>String(p.id)));
  if(participants.length>5)onUpdate("Canal acima do limite recomendado de cinco pessoas.");
  for(const id of [...peers.keys()])if(!ids.has(id))drop(id);
  for(const [id,pc] of peers)if(pc.connectionState!=='connected')await recover(id);
  for(const p of participants){const id=String(p.id);if(id!==String(self)&&String(self)<id&&!peers.has(id)&&Date.now()>=(retryAt.get(id)||0)){
    await connect(id,true).catch(e=>{retryAt.set(id,Date.now()+5000);drop(id);onUpdate(e.message)});
  }}
  void sampleHealth();return participants;
 }
 async function leave(){const old=channel;epoch++;channel=null;connecting.clear();refreshing=null;clearInterval(ticker);ticker=null;source?.close();source=null;
  for(const id of [...peers.keys()])drop(id);pending.clear();retryAt.clear();signalQueue.clear();activities.get(String(self))?.close();activities.clear();health.clear();recovery.clear();
  for(const media of [camera,screen])media?.getTracks().forEach(t=>t.stop());camera=null;screen=null;videoSenders.clear();remoteMedia.clear();remoteState.clear();
  if(microphone){microphone.getTracks().forEach(t=>t.stop());microphone=null}
  if(old)await api(`/api/channels/${old}/voice`,{method:'DELETE'}).catch(()=>{});
 }
 async function join(id){if(joining)throw Error("Entrada no canal em andamento.");joining=true;try{await leave();const attempt=epoch;if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection)throw Error('Chamadas precisam de uma conexão segura. Abra o Nightcall por HTTPS ou pelo aplicativo.');
  microphone=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,...(selectedMicrophone?{deviceId:{exact:selectedMicrophone}}:{})},video:false}).catch(error=>{throw captureError(error,'microfone');});
  if(epoch!==attempt){microphone.getTracks().forEach(t=>t.stop());microphone=null;throw Error('Entrada na chamada cancelada.');}
  microphone.getAudioTracks().forEach(t=>t.enabled=!muted);
  try{const me=await api('/api/auth/me');self=me.user.id;activities.set(String(self),createAudioActivity(microphone));await api(`/api/channels/${id}/voice`,{method:'POST'});channel=id;
   source=new EventSource('/api/events');source.addEventListener('voice-signal',event=>{try{void receive(JSON.parse(event.data))}catch{}});
   source.addEventListener('open',()=>{void refresh().catch(()=>{})});
   ticker=setInterval(()=>refresh().catch(e=>onUpdate(e.message)),4000);
   await publishState();return await refresh();
  }catch(e){await leave();throw e}
  }finally{joining=false}
 }
 function publishState(){const id=channel,version=epoch,flags={muted,deaf,camera:!!camera,screen:!!screen};if(!id)return Promise.resolve();const task=stateQueue.catch(()=>{}).then(async()=>{if(channel!==id||epoch!==version)return;try{await api(`/api/channels/${id}/voice`,{method:'PATCH',body:JSON.stringify(flags)});}catch(e){if(channel===id&&epoch===version)onUpdate(e.message);}});stateQueue=task;return task;}
 function setMute(v){muted=!!v;microphone?.getAudioTracks().forEach(t=>t.enabled=!muted);void publishState();onUpdate('');return muted}
 function setDeaf(v){deaf=!!v;if(deaf){mutingBeforeDeaf=muted;setMute(true);}else setMute(mutingBeforeDeaf);for(const id of peers.keys())applyVolume(id);onUpdate('');return deaf}
 function setVolume(id,value){const volume=Math.max(0,Math.min(1,Number(value)||0));volumes.set(String(id),volume);applyVolume(String(id));return volume}
 function getVolume(id){return volumes.get(String(id))??1}
 async function setMicrophone(deviceId){
  if(replacingMicrophone)throw Error('Troca de microfone em andamento.');
  if(!channel){selectedMicrophone=deviceId||'';return;}
  replacingMicrophone=true;let capture;const version=epoch;
  try{
    capture=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,...(deviceId?{deviceId:{exact:deviceId}}:{})},video:false}).catch(error=>{throw captureError(error,'microfone');});
    if(epoch!==version){capture.getTracks().forEach(t=>t.stop());return;}
    const track=capture.getAudioTracks()[0];track.enabled=!muted;const old=microphone;
    const senders=[...peers.values()].flatMap(pc=>pc.getSenders().filter(s=>s.track?.kind==='audio'));
    try{await Promise.all(senders.map(sender=>sender.replaceTrack(track)));}catch(error){await Promise.all(senders.map(sender=>sender.replaceTrack(old.getAudioTracks()[0]).catch(()=>{})));throw error;}
    if(epoch!==version){capture.getTracks().forEach(t=>t.stop());return;}
    microphone=capture;selectedMicrophone=deviceId||'';old?.getTracks().forEach(t=>t.stop());activities.get(String(self))?.close();activities.set(String(self),createAudioActivity(capture));onUpdate('Microfone atualizado.');
  }catch(error){capture?.getTracks().forEach(t=>t.stop());throw error;}finally{replacingMicrophone=false;}
 }
 window.addEventListener('online',()=>{if(channel){void refresh().catch(()=>{});for(const id of peers.keys())void recover(id,true);}});
 navigator.mediaDevices?.addEventListener?.('devicechange',async()=>{if(!channel||!selectedMicrophone)return;try{const devices=await navigator.mediaDevices.enumerateDevices();if(!devices.some(d=>d.kind==='audioinput'&&d.deviceId===selectedMicrophone)){await setMicrophone('');onUpdate('Microfone desconectado. Usando o dispositivo padrão.');}}catch(error){onUpdate(error.message);}});
 async function toggleVideo(kind){
  if(!channel||mediaBusy)return;mediaBusy=true;const index=kind==='camera'?0:1,previous=kind==='camera'?camera:screen,generation=channel,version=epoch;
  try{
   if(previous){await Promise.all([...videoSenders.values()].map(s=>s[index].replaceTrack(null)));previous.getTracks().forEach(t=>t.stop());if(kind==='camera')camera=null;else screen=null;await publishState();onUpdate('');return;}
   const capture=kind==='camera'?await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720}},audio:false}).catch(error=>{throw captureError(error,'câmera');}):await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:15,max:30}},audio:false}).catch(error=>{throw captureError(error,'tela');});
   if(channel!==generation||epoch!==version){capture.getTracks().forEach(t=>t.stop());return;}
   try{await Promise.all([...videoSenders.values()].map(s=>s[index].replaceTrack(capture.getVideoTracks()[0])));}catch(error){capture.getTracks().forEach(t=>t.stop());throw error;}
   if(kind==='camera')camera=capture;else screen=capture;
   capture.getVideoTracks()[0].addEventListener('ended',()=>{if((kind==='camera'?camera:screen)===capture){for(const sender of videoSenders.values())sender[index].replaceTrack(null).catch(()=>{});if(kind==='camera')camera=null;else screen=null;void publishState();onUpdate('');}});
   await publishState();onUpdate('');
  }finally{mediaBusy=false;}
 }
 function participantMedia(id){if(String(id)===String(self))return {camera,screen};const media={...remoteMedia.get(String(id))},state=remoteState.get(String(id));if(state?.camera===false)delete media.camera;if(state?.screen===false)delete media.screen;return media;}
 function connectionState(id){return String(id)===String(self)?'connected':peers.get(String(id))?.connectionState||'connecting';}
 function isSpeaking(id){const key=String(id);return !(key===String(self)?muted:remoteState.get(key)?.muted)&&!!activities.get(key)?.active();}
 return {diagnostics:()=>[...peers.entries()].map(([id,pc])=>({id,state:pc.connectionState,transceivers:pc.getTransceivers().map(t=>({mid:t.mid,direction:t.currentDirection,sender:t.sender.track?.readyState,receiver:t.receiver.track?.readyState,muted:t.receiver.track?.muted}))})),join,leave,refresh,setMicrophone,isSpeaking,health:id=>health.get(String(id)),reconnect:()=>Promise.all([...peers.keys()].map(id=>recover(id,true))),get microphoneId(){return selectedMicrophone;},toggleCamera:()=>toggleVideo('camera'),toggleScreen:()=>toggleVideo('screen'),participantMedia,connectionState,get cameraActive(){return !!camera},get screenActive(){return !!screen},setMute,setDeaf,setVolume,getVolume,get self(){return self},get muted(){return muted},get deaf(){return deaf},get active(){return !!channel}};
}
