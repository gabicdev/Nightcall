import {api} from "./api.js";
let peer=null, stream=null, screenStream=null, secondScreenStream=null, videoSender=null, secondVideoSender=null, current=null, myId=null, timer=null, disconnectTimer=null;
let screenButton, secondScreenButton, secondRemoteVideo, secondLocalPreview, muteButton, deafButton, volumeInput, microphoneSelect, pipButton, remoteVideo, localPreview;
let qualitySelect, fpsSelect, systemAudioToggle, screenAudioContext=null, mixedAudioTrack=null, microphoneSender=null;
let status, button, answerButton, rejectButton, audio;
let streamStage, preferences, audioLabel;
function syncCallLayout(){
  let showing=false;
  for(const video of [remoteVideo,secondRemoteVideo,localPreview,secondLocalPreview]){
    if(!video)continue;
    const live=video.srcObject?.getVideoTracks().some(track=>track.readyState==='live' && !track.muted);
    video.hidden=!live;showing ||= !!live;
  }
  if(streamStage)streamStage.hidden=!showing;
  if(preferences)preferences.hidden=!peer;
  if(audioLabel)audioLabel.hidden=!peer;
}
let captureSequence=0, replacingMicrophone=false;
const settingsKey="nightcall-capture-v1";
function readCaptureSettings(){
  try {const value=JSON.parse(localStorage.getItem(settingsKey)||"{}");return value&&typeof value==="object"?value:{};}catch{return {};}
}
function saveCaptureSettings(){
  try{localStorage.setItem(settingsKey,JSON.stringify({height:Number(qualitySelect?.value||720),fps:Number(fpsSelect?.value||15),systemAudio:!!systemAudioToggle?.checked,microphone:microphoneSelect?.value||""}));}catch{}
}
function resetAudioOutput(){if(audio){audio.srcObject=null;audio.muted=false;audio.volume=Number(volumeInput?.value||100)/100;}}

const fallbackRtcConfig={iceServers:[{urls:"stun:stun.l.google.com:19302"}]};
function display(message){if(status)status.textContent=message;}
async function signal(type,payload=null){
  if(!current)return;
  return api("/api/calls/signal",{method:"POST",body:JSON.stringify({to:current.id,type,callId:current.callId,payload})});
}
function cleanup(message="Chamada encerrada"){
  captureSequence++;
  if(timer)clearTimeout(timer);timer=null;
  if(disconnectTimer)clearTimeout(disconnectTimer);disconnectTimer=null;
  if(peer){peer.onicecandidate=null;peer.ontrack=null;peer.close();peer=null;}
  stopScreen();
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  videoSender=null;secondVideoSender=null;microphoneSender=null;
  resetAudioOutput();
  if(remoteVideo)remoteVideo.srcObject=null;
  if(localPreview)localPreview.srcObject=null;
  if(secondLocalPreview)secondLocalPreview.srcObject=null;
  if(secondRemoteVideo)secondRemoteVideo.srcObject=null;
  if(muteButton){muteButton.hidden=true;muteButton.textContent="Silenciar";}
  if(deafButton){deafButton.hidden=true;deafButton.textContent="Ensurdecer";}
  if(volumeInput)volumeInput.hidden=true;
  if(microphoneSelect)microphoneSelect.hidden=true;
  if(screenButton)screenButton.hidden=true;
  if(secondScreenButton)secondScreenButton.hidden=true;
  for(const control of [qualitySelect,fpsSelect,systemAudioToggle])if(control)control.hidden=true;
  if(pipButton)pipButton.hidden=true;
  current=null;
  if(button)button.textContent="Ligar";
  if(answerButton)answerButton.hidden=true;
  if(rejectButton)rejectButton.hidden=true;
  display(message);
  syncCallLayout();
}
async function hangup(){try{await signal("hangup");}catch{}cleanup();}
async function prepare(){
  if(!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection)throw Error("WebRTC indisponível neste contexto. Use HTTPS ou localhost.");
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,...(microphoneSelect?.value?{deviceId:{exact:microphoneSelect.value}}:{})},video:false});
  let rtcConfig=fallbackRtcConfig;
  try { rtcConfig=await api("/api/rtc/config"); } catch { /* Servidores antigos usam STUN padrão. */ }
  peer=new RTCPeerConnection(rtcConfig);
  stream.getTracks().forEach(track=>{const sender=peer.addTrack(track,stream);if(track.kind==="audio")microphoneSender=sender;});
  const firstVideoTransceiver=peer.addTransceiver("video",{direction:"sendrecv"});
  const secondVideoTransceiver=peer.addTransceiver("video",{direction:"sendrecv"});
  videoSender=firstVideoTransceiver.sender;secondVideoSender=secondVideoTransceiver.sender;
  peer.ontrack=event=>{
    if(event.track.kind==="video"){
      const destination=event.transceiver===secondVideoTransceiver?secondRemoteVideo:remoteVideo;
      destination.srcObject=new MediaStream([event.track]);for(const kind of ['ended','mute','unmute'])event.track.addEventListener(kind,syncCallLayout);syncCallLayout();destination.play().catch(()=>{});return;
    }
    audio.srcObject=new MediaStream([event.track]);audio.play().catch(()=>display("Clique para liberar a reprodução de áudio."));
  };
  peer.onicecandidate=event=>{if(event.candidate)signal("ice",event.candidate.toJSON()).catch(console.warn);};
  peer.onconnectionstatechange=()=>{
    if(peer?.connectionState==="connected"){if(timer)clearTimeout(timer);timer=null;display("Chamada conectada");}
    if(peer?.connectionState==="disconnected"){
      display("Conexão instável; tentando recuperar áudio…");
      if(!disconnectTimer) disconnectTimer=setTimeout(()=>cleanup("Conexão perdida. Inicie uma nova chamada."),12000);
    }
    if(peer?.connectionState==="connected" && disconnectTimer){clearTimeout(disconnectTimer);disconnectTimer=null;}
    if(["failed","closed"].includes(peer?.connectionState))cleanup("Conexão encerrada");
  };
  muteButton.hidden=false;deafButton.hidden=false;volumeInput.hidden=false;microphoneSelect.hidden=false;screenButton.hidden=false;secondScreenButton.hidden=false;pipButton.hidden=false;qualitySelect.hidden=false;fpsSelect.hidden=false;systemAudioToggle.hidden=false;
  syncCallLayout();
}
function releaseMixedAudio(){
  if(mixedAudioTrack){mixedAudioTrack.stop();mixedAudioTrack=null;}
  if(screenAudioContext){screenAudioContext.close().catch(()=>{});screenAudioContext=null;}
}
function stopSecondScreen(){
  captureSequence++;
  if(secondScreenStream){secondScreenStream.getTracks().forEach(track=>track.stop());secondScreenStream=null;}
  if(secondLocalPreview)secondLocalPreview.srcObject=null;
  if(secondScreenButton)secondScreenButton.textContent="Compartilhar segunda tela";
  syncCallLayout();
}
function stopPrimaryScreen(){
  captureSequence++;
  if(screenStream){screenStream.getTracks().forEach(track=>track.stop());screenStream=null;}
  if(localPreview)localPreview.srcObject=null;
  if(screenButton)screenButton.textContent="Compartilhar tela";
  if(microphoneSender && stream?.getAudioTracks()[0] && mixedAudioTrack){
    microphoneSender.replaceTrack(stream.getAudioTracks()[0]).catch(()=>{});
  }
  releaseMixedAudio();
  syncCallLayout();
}
function stopScreen(){stopSecondScreen();stopPrimaryScreen();}
function selectedCaptureConstraints(){
  const height=[480,720,1080].includes(Number(qualitySelect?.value))?Number(qualitySelect.value):720;
  const fps=[15,30,60].includes(Number(fpsSelect?.value))?Number(fpsSelect.value):15;
  return {video:{height:{ideal:height},frameRate:{ideal:fps,max:fps}},audio:!!systemAudioToggle?.checked};
}
async function applyVideoQuality(sender){
  if(!sender || !sender.track || sender.track.readyState!=="live")return;
  const parameters=sender.getParameters();
  if(!parameters.encodings?.length)parameters.encodings=[{}];
  const height=Number(qualitySelect?.value||720),fps=Number(fpsSelect?.value||15);
  parameters.encodings[0].maxBitrate=Math.round(Math.min(5000000,Math.max(400000,height*fps*65)));
  try{await sender.setParameters(parameters);}catch{ /* Algumas implementações não aceitam ajuste dinâmico */ }
}
async function attachSystemAudio(capture){
  const systemTrack=capture.getAudioTracks()[0];
  const micTrack=stream?.getAudioTracks()[0];
  if(!systemTrack || !micTrack || !microphoneSender)return false;
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtor)return false;
  let context=null;
  try{
    context=new AudioCtor();
    const output=context.createMediaStreamDestination();
    for(const track of [micTrack,systemTrack]){
      const source=context.createMediaStreamSource(new MediaStream([track]));
      source.connect(output);
    }
    const mixed=output.stream.getAudioTracks()[0];
    await microphoneSender.replaceTrack(mixed);
    screenAudioContext=context;mixedAudioTrack=mixed;
    return true;
  }catch(error){if(context && context!==screenAudioContext)await context.close().catch(()=>{});releaseMixedAudio();console.warn("Falha na mistura de áudio:",error);return false;}
}
async function toggleScreen(){
  if(!peer || !videoSender)return display("Inicie uma chamada primeiro.");
  if(screenButton?.disabled)return;
  if(screenStream){await videoSender.replaceTrack(null);stopPrimaryScreen();display("Compartilhamento encerrado.");return;}
  if(!navigator.mediaDevices?.getDisplayMedia)return display("Captura de tela indisponível.");
  let capture=null;
  const attempt=++captureSequence;
  screenButton.disabled=true;
  try{
    capture=await navigator.mediaDevices.getDisplayMedia(selectedCaptureConstraints());
    if(attempt!==captureSequence || !peer || !videoSender){capture.getTracks().forEach(t=>t.stop());return;}
    const track=capture.getVideoTracks()[0];
    if(!track)throw Error("Nenhuma tela selecionada.");
    await videoSender.replaceTrack(track);
    if(attempt!==captureSequence){capture.getTracks().forEach(t=>t.stop());return;}
    await applyVideoQuality(videoSender);
    screenStream=capture;localPreview.srcObject=new MediaStream([track]);
    syncCallLayout();
    localPreview.muted=true;
    screenButton.textContent="Parar transmissão";
    track.addEventListener("ended",()=>{if(screenStream===capture){videoSender?.replaceTrack(null).catch(()=>{});stopPrimaryScreen();}},{once:true});
    const audioAttached=await attachSystemAudio(capture);
    display(audioAttached?"Transmitindo tela com microfone e áudio compartilhado.":"Transmitindo tela. Áudio do sistema indisponível ou não selecionado.");
  }catch(e){
    if(capture)capture.getTracks().forEach(t=>t.stop());
    if(videoSender)await videoSender.replaceTrack(null).catch(()=>{});
    stopPrimaryScreen();display("Compartilhamento não iniciado: "+e.message);
  }finally{if(screenButton)screenButton.disabled=false;}
}

async function toggleSecondScreen(){
  if(!peer || !secondVideoSender)return display("Inicie uma chamada primeiro.");
  if(secondScreenButton?.disabled)return;
  if(secondScreenStream){await secondVideoSender.replaceTrack(null);stopSecondScreen();display("Segunda transmissão encerrada.");return;}
  if(!navigator.mediaDevices?.getDisplayMedia)return display("Captura indisponível.");
  let capture=null;
  const attempt=++captureSequence;
  secondScreenButton.disabled=true;
  try{
    capture=await navigator.mediaDevices.getDisplayMedia({video:selectedCaptureConstraints().video,audio:false});
    if(attempt!==captureSequence || !peer || !secondVideoSender){capture.getTracks().forEach(t=>t.stop());return;}
    const track=capture.getVideoTracks()[0];
    if(!track)throw Error("Nenhuma tela selecionada.");
    await secondVideoSender.replaceTrack(track);
    if(attempt!==captureSequence){capture.getTracks().forEach(t=>t.stop());return;}
    await applyVideoQuality(secondVideoSender);
    secondScreenStream=capture;
    secondLocalPreview.srcObject=new MediaStream([track]);
    syncCallLayout();
    secondScreenButton.textContent="Parar segunda tela";
    track.addEventListener("ended",()=>{if(secondScreenStream===capture){secondVideoSender?.replaceTrack(null).catch(()=>{});stopSecondScreen();}},{once:true});
    display("Segunda transmissão ativa. Áudio compartilhado apenas pela primeira tela.");
  }catch(e){
    if(capture)capture.getTracks().forEach(t=>t.stop());
    await secondVideoSender?.replaceTrack(null).catch(()=>{});
    stopSecondScreen();display("Segunda transmissão não iniciada: "+e.message);
  }finally{if(secondScreenButton)secondScreenButton.disabled=false;}
}
export async function startVoiceCall(person){
  if(!person?.id)return;
  if(current){if(current.id===person.id)return hangup();display("Encerre a chamada atual primeiro.");return;}
  current={id:person.id,callId:crypto.randomUUID(),incoming:false,candidates:[]};
  button.textContent="Desligar";
  display(`Chamando ${person.name||person.username}…`);
  try{
    await prepare();
    const offer=await peer.createOffer();await peer.setLocalDescription(offer);
    await signal("offer",{sdp:peer.localDescription.toJSON()});
    timer=setTimeout(()=>{hangup();display("Sem resposta à chamada.");},45000);
  }catch(e){cleanup(e.message);}
}
async function accept(){
  if(!current?.incoming)return;
  try{
    if(timer)clearTimeout(timer);
    await prepare();
    await peer.setRemoteDescription(current.offer);
    const answer=await peer.createAnswer();await peer.setLocalDescription(answer);
    await signal("answer",{sdp:peer.localDescription.toJSON()});
    for(const ice of current.candidates)await peer.addIceCandidate(ice);
    current.candidates=[];
    answerButton.hidden=true;rejectButton.hidden=true;button.textContent="Desligar";
    display("Conectando áudio…");
  }catch(e){try{await signal("reject");}catch{}cleanup(e.message);}
}
async function onSignal(data){
  if(data.from===myId)return;
  if(data.type==="offer"){
    if(current){
      if(current.id===data.from && current.callId===data.callId)return;
      await api("/api/calls/signal",{method:"POST",body:JSON.stringify({to:data.from,type:"busy",callId:data.callId})}).catch(()=>{});return;
    }
    if(!data.payload?.sdp)return;
    current={id:data.from,callId:data.callId,incoming:true,offer:data.payload.sdp,candidates:[]};
    answerButton.hidden=false;rejectButton.hidden=false;
    display("Chamada de voz recebida. Aceitar ou recusar?");
    window.nightcallDesktop?.notify("Chamada recebida","Abra o Nightcall para atender").catch(()=>{});
    timer=setTimeout(()=>{hangup();display("Chamada não atendida.");},45000);
    return;
  }
  if(!current || current.id!==data.from || current.callId!==data.callId)return;
  try{
    if(data.type==="answer" && peer && data.payload?.sdp){await peer.setRemoteDescription(data.payload.sdp);for(const ice of current.candidates||[])await peer.addIceCandidate(ice);current.candidates=[];if(timer)clearTimeout(timer);timer=null;display("Conectando áudio…");}
    if(data.type==="ice" && data.payload){if(peer?.remoteDescription)await peer.addIceCandidate(data.payload);else (current.candidates??=[]).push(data.payload);}
    if(["hangup","reject","busy"].includes(data.type))cleanup(data.type==="busy"?"Usuário em outra chamada.":"Chamada encerrada.");
  }catch(e){cleanup("Falha na conexão: "+e.message);}
}
export function initializeCalls(){
  const panel=document.getElementById("chatPanel");
  if(!panel)return;
  const bar=document.createElement("div");bar.className="voice-controls";
  button=document.createElement("button");button.textContent="Ligar";button.type="button";
  answerButton=document.createElement("button");answerButton.textContent="Aceitar chamada";answerButton.type="button";answerButton.hidden=true;
  rejectButton=document.createElement("button");rejectButton.textContent="Recusar";rejectButton.type="button";rejectButton.hidden=true;
  status=document.createElement("span");status.setAttribute("role","status");status.textContent="Voz disponível entre amigos conectados";
  muteButton=document.createElement("button");muteButton.textContent="Silenciar";muteButton.hidden=true;
  muteButton.addEventListener("click",()=>{const track=stream?.getAudioTracks()[0];if(!track)return;track.enabled=!track.enabled;muteButton.textContent=track.enabled?"Silenciar":"Ativar microfone";});
  deafButton=document.createElement("button");deafButton.type="button";deafButton.hidden=true;deafButton.textContent="Ensurdecer";
  deafButton.addEventListener("click",()=>{audio.muted=!audio.muted;deafButton.textContent=audio.muted?"Ouvir novamente":"Ensurdecer";});
  volumeInput=document.createElement("input");volumeInput.type="range";volumeInput.min="0";volumeInput.max="100";volumeInput.value="100";volumeInput.hidden=true;volumeInput.title="Volume da chamada";volumeInput.setAttribute("aria-label","Volume da chamada");
  volumeInput.addEventListener("input",()=>{audio.volume=Number(volumeInput.value)/100;});
  microphoneSelect=document.createElement("select");microphoneSelect.hidden=true;microphoneSelect.title="Microfone para próxima chamada";microphoneSelect.setAttribute("aria-label","Microfone para próxima chamada");
  async function microphones(){try{const previous=microphoneSelect.value||readCaptureSettings().microphone||"";const devices=await navigator.mediaDevices.enumerateDevices();microphoneSelect.replaceChildren();const standard=document.createElement("option");standard.value="";standard.textContent="Microfone padrão";microphoneSelect.append(standard);for(const d of devices.filter(x=>x.kind==="audioinput")){const opt=document.createElement("option");opt.value=d.deviceId;opt.textContent=d.label||"Microfone";microphoneSelect.append(opt)}if([...microphoneSelect.options].some(option=>option.value===previous))microphoneSelect.value=previous;else microphoneSelect.value="";}catch{}}
  microphones();microphoneSelect.addEventListener("change",saveCaptureSettings);navigator.mediaDevices?.addEventListener?.("devicechange",microphones);
  pipButton=document.createElement("button");pipButton.textContent="PiP";pipButton.type="button";pipButton.hidden=true;
  pipButton.title="Abrir vídeo recebido em janela flutuante";
  pipButton.addEventListener("click",async()=>{
    if(!remoteVideo?.srcObject?.getVideoTracks().length)return display("Não há transmissão recebida para abrir em PiP.");
    try{
      if(document.pictureInPictureElement)await document.exitPictureInPicture();
      else if(remoteVideo.requestPictureInPicture)await remoteVideo.requestPictureInPicture();
      else display("PiP indisponível neste sistema.");
    }catch(e){display("PiP: "+e.message);}
  });
  qualitySelect=document.createElement("select");qualitySelect.hidden=true;qualitySelect.title="Resolução da transmissão";qualitySelect.setAttribute("aria-label","Resolução da transmissão");
  for(const h of [480,720,1080]){const option=document.createElement("option");option.value=String(h);option.textContent=`${h}p`;qualitySelect.append(option);}qualitySelect.value="720";
  fpsSelect=document.createElement("select");fpsSelect.hidden=true;fpsSelect.title="Taxa de quadros";fpsSelect.setAttribute("aria-label","FPS da transmissão");
  for(const f of [15,30,60]){const option=document.createElement("option");option.value=String(f);option.textContent=`${f} FPS`;fpsSelect.append(option);}fpsSelect.value="15";
  systemAudioToggle=document.createElement("input");systemAudioToggle.type="checkbox";systemAudioToggle.hidden=true;systemAudioToggle.title="Solicitar áudio do sistema (se compatível)";systemAudioToggle.setAttribute("aria-label","Compartilhar áudio do sistema quando disponível");
  const savedCapture=readCaptureSettings();
  if([480,720,1080].includes(savedCapture.height))qualitySelect.value=String(savedCapture.height);
  if([15,30,60].includes(savedCapture.fps))fpsSelect.value=String(savedCapture.fps);
  systemAudioToggle.checked=savedCapture.systemAudio===true;
  for(const control of [qualitySelect,fpsSelect,systemAudioToggle])control.addEventListener("change",saveCaptureSettings);
  screenButton=document.createElement("button");screenButton.textContent="Compartilhar tela";screenButton.hidden=true;screenButton.addEventListener("click",toggleScreen);
  secondScreenButton=document.createElement("button");secondScreenButton.textContent="Compartilhar segunda tela";secondScreenButton.type="button";secondScreenButton.hidden=true;secondScreenButton.addEventListener("click",toggleSecondScreen);
  audio=document.createElement("audio");audio.autoplay=true;
  volumeInput.value="100";
  remoteVideo=document.createElement("video");remoteVideo.autoplay=true;remoteVideo.playsInline=true;remoteVideo.className="call-video";remoteVideo.setAttribute("aria-label","Tela compartilhada recebida");
  localPreview=document.createElement("video");localPreview.autoplay=true;localPreview.muted=true;localPreview.playsInline=true;localPreview.className="call-video call-preview";localPreview.setAttribute("aria-label","Prévia da minha tela");
  secondRemoteVideo=document.createElement("video");secondRemoteVideo.autoplay=true;secondRemoteVideo.playsInline=true;secondRemoteVideo.className="call-video";secondRemoteVideo.setAttribute("aria-label","Segunda tela recebida");
  secondLocalPreview=document.createElement("video");secondLocalPreview.autoplay=true;secondLocalPreview.muted=true;secondLocalPreview.playsInline=true;secondLocalPreview.className="call-video call-preview";secondLocalPreview.setAttribute("aria-label","Prévia da segunda tela");
  const videos=document.createElement("div");videos.className="call-videos";videos.append(remoteVideo,secondRemoteVideo,localPreview,secondLocalPreview);
  const actions=document.createElement("div");actions.className="nc-call-actions";actions.setAttribute("aria-label","Ações da chamada");actions.append(button,answerButton,rejectButton,muteButton,deafButton,screenButton,secondScreenButton,pipButton);
  preferences=document.createElement("div");preferences.className="nc-call-preferences";preferences.setAttribute("aria-label","Qualidade e dispositivos");
  audioLabel=document.createElement("label");audioLabel.className="nc-inline-toggle";audioLabel.append(systemAudioToggle,document.createTextNode("Áudio da tela"));
  preferences.append(microphoneSelect,volumeInput,qualitySelect,fpsSelect,audioLabel);
  streamStage=document.createElement("section");streamStage.className="nc-stream-stage";streamStage.setAttribute("aria-label","Transmissões e prévias");streamStage.append(videos);
  bar.append(status,actions,preferences,audio,streamStage);panel.querySelector('.chat-header').after(bar);syncCallLayout();
  button.addEventListener("click",()=>{
    if(current){hangup();return;}
    const selected=window.NightcallActivePerson?.();
    if(selected)startVoiceCall(selected);
    else display("Abra uma conversa antes de ligar.");
  });
  answerButton.addEventListener("click",accept);
  rejectButton.addEventListener("click",hangup);
  api("/api/auth/me").then(({user})=>{myId=user.id;}).catch(console.warn);
  const source=new EventSource("/api/events");
  source.addEventListener("call",event=>{try{onSignal(JSON.parse(event.data));}catch(e){console.warn(e);}});
  window.addEventListener("beforeunload",()=>{if(current)signal("hangup").catch(()=>{});cleanup();source.close();});
}
