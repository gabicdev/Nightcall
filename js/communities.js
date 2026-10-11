import {renderAvatar,renderAttachments,attachComposer,uploadFile} from './media.js';
import { closeSettings, updateActiveNavigation, readStorage, writeStorage } from './navigation.js';
import { api } from './api.js';
import { createGroupVoice } from './group-voice.js';
import {connectionDescription} from './call-health.js';

export function initializeCommunities() {
  const root = document.querySelector('#communityRoot');
  if (!root) return;

  const get = (id) => document.getElementById(id);
  const status = get('communityStatus');
  const channels = get('communityChannels');
  const messages = get('communityMessages');
  const members = get('communityMembers');
  const title = get('communityTitle');
  const invite = get('communityInvite');
  const sendForm = get('communitySend');
  const composer=attachComposer(sendForm,{onError:message=>fail(Error(message))});
  const formContainer = get('ncCommunityActions');
  const createCommunityForm = get('communityCreate');
  const joinCommunityForm = get('communityJoin');
  const templates = {
    custom: ['geral','voz-geral'], friends: ['geral','voz-geral'],
    games: ['geral','clipes','equipe'], study: ['geral','materiais','estudo'],
    school: ['geral','avisos','encontro'], local: ['geral','eventos','encontro'],
    creators: ['geral','portfolio','feedback','estudio']
  };
  let selectedTemplate = 'custom';
  get('communityChooserJoin').addEventListener('click', () => toggleCommunityForm('join'));
  formContainer.querySelectorAll('[data-community-template]').forEach(button => button.addEventListener('click', () => {
    selectedTemplate = button.dataset.communityTemplate;
    get('communityChooser').hidden = true;
    createCommunityForm.hidden = false; joinCommunityForm.hidden = true;
    showCreateStep(2);
  }));
  let createStep = 1;
  let creating = false;
  function showCreateStep(step) {
    createStep = step;
    formContainer.querySelectorAll('[data-create-step]').forEach(el => el.hidden = Number(el.dataset.createStep) !== step);
    get('communityStepLabel').textContent = 'ETAPA ' + step + ' DE 3';
    get('communityStepBack').hidden = step === 1;
    get('communityStepNext').hidden = step === 3;
    get('communityCreateSubmit').hidden = step !== 3;
    get('communityName').required = step === 2;
    if (step === 2) get('communityName').focus();
    if (step === 3) {
      get('communityReviewName').textContent = get('communityName').value.trim();
      get('communityReviewChannels').replaceChildren(...templates[selectedTemplate].map((name,index,all) => Object.assign(document.createElement('li'),{textContent:(index === all.length - 1 ? 'Voz · ' : '# ') + name})));
    }
  }
  get('communityStepNext').addEventListener('click', () => {
    if (createStep === 2 && !get('communityName').reportValidity()) return;
    showCreateStep(createStep + 1);
  });
  get('communityStepBack').addEventListener('click', () => {if(createStep === 2) toggleCommunityForm('create'); else showCreateStep(2);});
  function toggleCommunityForm(which) {
    get('communityDirectory').hidden=true;
    const isCreate = which === 'create';
    get('communityChooser').hidden = !isCreate;
    get('communityWizardStatus').textContent = '';
    if (isCreate) showCreateStep(1);
    closeSettings(); document.getElementById('ownProfile')?.close();
    if (!formContainer.open) formContainer.showModal();
    createCommunityForm.hidden = true;
    joinCommunityForm.hidden = isCreate;

    if (!isCreate) get('communityCode').focus();
  }

  function closeForms() {
    if (formContainer.open) formContainer.close();
    createCommunityForm.hidden = true;
    joinCommunityForm.hidden = true;
    root.classList.remove('nc-community-setup');
  }
  get('communityActionCancel').addEventListener('click', closeForms);
  get('communityChannelManage').addEventListener('click', () => {get('communityChannelCreate').hidden = false; get('communityChannelName').focus();});
  get('communityChannelCancel').addEventListener('click', () => {get('communityChannelCreate').hidden = true;});
  document.addEventListener('nightcallWorkspace', () => setPanelOpen(false));
  document.addEventListener('nightcallCommunityAdd', () => toggleCommunityForm('create'));
  let communities = [];
  let active = null;
  let channel = null;
  let voice = null,voiceView=false;
  let selectedRole = null;
  let channelEntries = [];
  let inviteCode = '';
  let renamingChannel = null;
  let activeName = '';
  let managementBusy = false,activeIcon='';
  get('communityIconChoose').onclick=()=>get('communityIconFile').click();
  get('communityIconRemove').onclick=()=>{get('communityIconValue').value='';renderAvatar(get('communityIconPreview'),'',activeName);};
  get('communityIconFile').onchange=async()=>{const file=get('communityIconFile').files[0];if(!file)return;get('communityIconChoose').disabled=true;get('communityEditSubmit').disabled=true;try{const media=await uploadFile(file,'profile');get('communityIconValue').value=media.url;renderAvatar(get('communityIconPreview'),media.url,activeName);get('communitySettingsStatus').textContent='Imagem pronta. Salve para aplicar.';}catch(error){get('communitySettingsStatus').textContent=error.message;}finally{get('communityIconFile').value='';get('communityIconChoose').disabled=false;get('communityEditSubmit').disabled=false;}};
  const unreadSpaces=new Set();
  const notificationKey=()=>`nightcallCommunityNotifications:${readStorage('nightcallProfile',{}).id}:${active}`;
  const closeDirectory=()=>{get('communityDirectory').hidden=true;get('communitySwitch').setAttribute('aria-expanded','false');};
  get('communityMenuChannel').addEventListener('click',()=>{closeDirectory();get('communityChannelManage').click();});
  get('communityMenuCategory').addEventListener('click',()=>{closeDirectory();get('communityCategoryName').value='';get('communityCategoryStatus').textContent='';get('communityCategoryDialog').showModal();get('communityCategoryName').focus();});
  get('communityCategoryClose').addEventListener('click',()=>get('communityCategoryDialog').close());
  get('communityCategoryForm').addEventListener('submit',async event=>{
    event.preventDefault();const button=event.currentTarget.querySelector('button');if(button.disabled)return;button.disabled=true;
    try{await api('/api/communities/'+active+'/categories',{method:'POST',body:JSON.stringify({name:get('communityCategoryName').value})});await open(active);get('communityCategoryDialog').close();info('Categoria criada. Escolha-a ao criar um canal.');}catch(error){get('communityCategoryStatus').textContent=error.message;}finally{button.disabled=false;}
  });
  get('communityCopyId').addEventListener('click',async()=>{closeDirectory();try{await navigator.clipboard.writeText(active);info('ID da comunidade copiado.');}catch{info('ID da comunidade: '+active);}});
  get('communityMenuNotifications').addEventListener('click',()=>{closeDirectory();get('communityNotificationMode').value=readStorage(notificationKey(),'all');get('communityNotificationDialog').showModal();});
  get('communityNotificationClose').addEventListener('click',()=>get('communityNotificationDialog').close());
  get('communityNotificationForm').addEventListener('submit',event=>{event.preventDefault();writeStorage(notificationKey(),get('communityNotificationMode').value);get('communityNotificationDialog').close();info('Preferência de notificações salva.');});
  get('communitySwitch').addEventListener('click',()=>{const directory=get('communityDirectory');directory.hidden=!directory.hidden;get('communitySwitch').setAttribute('aria-expanded',String(!directory.hidden));});
  document.addEventListener('click',event=>{if(!event.target.closest('.nc-channel-panel-header')){get('communityDirectory').hidden=true;get('communitySwitch').setAttribute('aria-expanded','false');}});
  get('communityBrowse').addEventListener('click',()=>{closeForms();setPanelOpen(true);refresh().catch(fail);});
  get('communityManage').addEventListener('click',()=>{
    closeDirectory();
    get('communityEditName').value=activeName;get('communityIconValue').value=activeIcon;renderAvatar(get('communityIconPreview'),activeIcon,activeName);
    get('communityDeleteName').value='';get('communityDelete').disabled=true;
    get('communityDeleteZone').hidden=selectedRole!=='owner';
    get('communitySettingsStatus').textContent='';get('communitySettings').showModal();
  });
  get('communitySettingsClose').addEventListener('click',()=>get('communitySettings').close());
  get('communityDeleteName').addEventListener('input',()=>{get('communityDelete').disabled=managementBusy || get('communityDeleteName').value.trim()!==activeName;});
  get('communityEditForm').addEventListener('submit',async event=>{
    event.preventDefault();if(managementBusy)return;managementBusy=true;
    const button=get('communityEditSubmit');button.disabled=true;
    try {await api('/api/communities/'+active,{method:'PATCH',body:JSON.stringify({name:get('communityEditName').value,icon:get('communityIconValue').value})});await refresh();await open(active);get('communitySettings').close();info('Nome da comunidade atualizado.');}
    catch(error){get('communitySettingsStatus').textContent=error.message;}finally{managementBusy=false;button.disabled=false;}
  });
  get('communityDelete').addEventListener('click',async()=>{
    if(managementBusy)return;managementBusy=true;get('communityDelete').disabled=true;
    try {await api('/api/communities/'+active,{method:'DELETE',body:JSON.stringify({confirmName:get('communityDeleteName').value})});await exitVoice();active=null;channel=null;get('communitySettings').close();await refresh();info('Comunidade excluída.');}
    catch(error){get('communitySettingsStatus').textContent=error.message;}
    finally{managementBusy=false;get('communityDelete').disabled=get('communityDeleteName').value.trim()!==activeName;}
  });
  get('communityCopyInvite').addEventListener('click', async () => {closeDirectory();try {await navigator.clipboard.writeText(inviteCode); info('Convite copiado.');} catch {info('Convite: '+inviteCode);}});
  get('channelRename').addEventListener('click', () => {
    renamingChannel = channel || voice;
    get('channelRenameName').value = channelEntries.find(x => x.id === renamingChannel)?.name || '';
    get('channelRenameForm').hidden = false; get('channelRenameName').focus();
  });
  get('channelRenameCancel').addEventListener('click', () => {get('channelRenameForm').hidden = true;});
  get('channelRenameForm').addEventListener('submit', async event => {
    event.preventDefault();
    try {await api('/api/channels/' + renamingChannel, {method:'PATCH', body:JSON.stringify({name:get('channelRenameName').value.trim()})}); get('channelRenameForm').hidden = true; await open(active); info('Canal atualizado.');} catch(error) {fail(error);}
  });

  let voiceParticipants=[],voiceStarted=0,voiceSignature='';
  let roomPresenceBusy=false;
  function renderRoomParticipants(id, people) {
    const button=[...channels.querySelectorAll('.nc-channel-item')].find(item=>item.dataset.channelId===id);
    if(!button)return;
    let list=button.nextElementSibling;
    if(!list?.classList.contains('nc-room-participants')){list=document.createElement('div');list.className='nc-room-participants';list.dataset.roomId=id;button.after(list);}
    const profile=readStorage('nightcallProfile',{});
    const signature=JSON.stringify(people.map(p=>[p.id,p.name,p.avatar,p.muted,p.deaf,p.camera,p.screen]));
    if(list.dataset.signature===signature)return;
    list.dataset.signature=signature;list.replaceChildren();list.hidden=!people.length;
    for(const person of people){
      const row=document.createElement('div');row.className='nc-room-person';row.dataset.personId=person.id;
      const avatar=document.createElement('span');avatar.className='nc-room-avatar';renderAvatar(avatar,person.id===profile.id?profile.avatar:person.avatar,person.name);
      const name=document.createElement('span');name.className='nc-room-name';name.textContent=person.name||person.username;
      row.append(avatar,name);
      for(const [enabled,icon,label] of [[person.muted,'mic','Microfone silenciado'],[person.deaf,'headphones','Áudio desativado'],[person.screen,'screen','Transmitindo tela'],[person.camera,'camera','Câmera ligada']]){
        if(enabled){const flag=document.createElement('span');flag.className='nc-room-flag';flag.title=label;flag.setAttribute('aria-label',label);flag.innerHTML=iconMarkup(icon);row.append(flag);}
      }
      list.append(row);
    }
  }
  async function refreshRoomPresence(){
    if(!active||root.hidden||roomPresenceBusy)return;
    roomPresenceBusy=true;const community=active;
    try {await Promise.all(channelEntries.filter(c=>c.kind==='voice').map(async c=>{
      const {participants}=await api('/api/channels/'+c.id+'/voice');
      if(active===community)renderRoomParticipants(c.id,participants);
    }));} finally {roomPresenceBusy=false;}
  }
  function updateCallClock(){
    const elapsed=Math.max(0,Math.floor((Date.now()-voiceStarted)/1000));
    const time=[Math.floor(elapsed/3600),Math.floor(elapsed%3600/60),elapsed%60].map(n=>String(n).padStart(2,'0')).join(':');
    root.querySelectorAll('.nc-call-clock').forEach(clock=>{clock.textContent=time;clock.setAttribute('aria-label','Tempo na chamada: '+time);});
  }
  setInterval(()=>{if(voice)updateCallClock();},1000);
  function updateVoiceIndicators(){
    if(!voice)return;
    for(const participant of voiceParticipants){
      const speaking=group.isSpeaking(participant.id);
      root.querySelectorAll('[data-participant-id],[data-person-id]').forEach(row=>{
        if((row.dataset.participantId||row.dataset.personId)===participant.id)row.classList.toggle('nc-speaking',speaking);
      });
      const row=[...messages.querySelectorAll('[data-participant-id]')].find(row=>row.dataset.participantId===participant.id);
      const state=row?.querySelector('.nc-voice-state');const quality=group.health(participant.id);
      if(state&&!participant.muted&&!participant.deaf&&participant.id!==group.self){state.textContent=connectionDescription(group.connectionState(participant.id),quality);state.dataset.quality=quality?.grade||'unknown';}
    }
  }
  setInterval(()=>{if(voice&&!root.hidden)updateVoiceIndicators();},220);
  const voiceDock=document.createElement('div');voiceDock.className='nc-voice-dock';voiceDock.hidden=true;
  function updateVoiceDock(){voiceDock.hidden=!voice||voiceView&&!root.hidden;if(!voice)return;voiceDock.classList.toggle('nc-detached',root.hidden);if(root.hidden)document.body.append(voiceDock);else document.querySelector('.nc-community-account').before(voiceDock);voiceDock.replaceChildren();const go=document.createElement('button');go.type='button';go.className='nc-voice-dock-room';go.innerHTML='<span>Voz conectada</span><strong></strong>';go.querySelector('strong').textContent=channelEntries.find(c=>c.id===voice)?.name||'Sua sala';go.onclick=async()=>{setPanelOpen(true);channel=null;voiceView=true;sendForm.hidden=true;get('communityChannelTitle').textContent='Voz · '+(channelEntries.find(c=>c.id===voice)?.name||'Sua sala');highlightChannelButtons(channelEntries);await loadVoice();};const mute=document.createElement('button');mute.type='button';mute.textContent=group.muted?'Ativar microfone':'Silenciar';mute.setAttribute('aria-label',group.muted?'Ativar microfone da sala':'Silenciar microfone da sala');mute.onclick=()=>{group.setMute(!group.muted);updateVoiceDock();};const leave=document.createElement('button');leave.type='button';leave.textContent='Sair';leave.setAttribute('aria-label','Sair da sala de voz');leave.onclick=async()=>{await exitVoice();if(!root.hidden&&!channel)renderEmpty('Você saiu da chamada.','Escolha um canal para continuar.');};voiceDock.append(go,mute,leave);}

  const group = createGroupVoice((text) => {
    if(text)status.textContent=text;
    if(voice&&voiceView)renderVoice(voiceParticipants);updateVoiceDock();
  });

  const setPanelOpen = (open) => {
    if(!open)get('communitySettings').close();
    if(!open){get('communityCategoryDialog').close();get('communityNotificationDialog').close();}
    root.hidden = !open;updateVoiceDock();
    if (open) {closeSettings(); document.getElementById("ownProfile")?.close();} else closeForms();
    if (open) {
      document.body.classList.add('nc-community-open');
      document.querySelectorAll('.nav-button.active').forEach(button=>button.classList.remove('active'));
    } else {
      document.body.classList.remove('nc-community-open');
      updateActiveNavigation();
    }
    document.querySelector('#communityToggle')?.classList.toggle('active', open);
  };

  const fail = (error) => {
    status.textContent = error?.message || String(error);
    if (formContainer.open) get('communityWizardStatus').textContent = status.textContent;
    status.dataset.state = 'error';
    console.error('Comunidades:', error);
  };

  const info = (text = '') => {
    status.textContent = text;
    status.dataset.state = text ? 'success' : '';
  };

  const initials = (value) => {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 'N';
    return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  };

  const createButton = (text, action, current = false) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.setAttribute('aria-current', String(current));
    button.addEventListener('click', () => Promise.resolve(action()).catch(fail));
    return button;
  };

  const createChannelButton = (entry, allChannels) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nc-channel-item';
    button.dataset.channelId=entry.id;
    button.setAttribute('aria-current', String(entry.id === channel));
    const glyph = entry.kind === 'voice' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 9 4 0 5-5v16l-5-5H4ZM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14"/></svg>' : '#';
    const subtitle = entry.kind === 'voice' ? 'Canal de voz' : 'Canal de texto';
    button.innerHTML = `
      <span class="nc-channel-glyph" aria-hidden="true">${glyph}</span>
      <span class="nc-channel-copy">
        <strong></strong>
        <small>${subtitle}</small>
      </span>`;
    button.querySelector('strong').textContent=entry.name;
    button.addEventListener('click', async () => {
      try {
      get('communityChannelTitle').textContent = (entry.kind === 'text' ? '# ' : 'Voz · ') + entry.name;
      sendForm.hidden = entry.kind !== 'text';
      get('channelRenameForm').hidden = true;
      composer.reset();channel = entry.kind === 'text' ? entry.id : null;
      highlightChannelButtons(allChannels);
      if (entry.kind === 'voice') {
        await enterVoice(entry.id);
        return;
      }
      voiceView=false;updateVoiceDock();
      await load();
      } catch(error) {fail(error);}
    });
    return button;
  };

  const renderEmpty = (heading, text) => {
    messages.replaceChildren();
    const wrapper = document.createElement('div');
    wrapper.className = 'nc-community-empty';
    wrapper.innerHTML = `<div><strong>${heading}</strong><span>${text}</span></div>`;
    messages.append(wrapper);
  };

  const highlightChannelButtons = (allChannels) => {
    channels.querySelectorAll('.nc-channel-item').forEach((button) => {
      button.setAttribute('aria-current', String(button.dataset.channelId === (channel || voice)));button.classList.toggle('nc-channel-connected',button.dataset.channelId===voice);
    });
  };

  async function exitVoice() {
    const old=voice;
    const remaining=voiceParticipants.filter(p=>p.id!==group.self);
    if(document.fullscreenElement===messages)await document.exitFullscreen().catch(()=>{});
    voice = null;voiceView=false;voiceDock.hidden=true;voiceParticipants=[];voiceSignature='';messages.classList.remove('nc-voice-view');root.classList.remove('nc-call-stage');
    await group.leave();
    if(old)renderRoomParticipants(old,remaining);
  }

  const voiceIcons={mic:'<path d="M9 4a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',headphones:'<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 13h4v8H4ZM16 13h4v8h-4Z"/>',camera:'<rect x="3" y="5" width="12" height="14" rx="3"/><path d="m15 9 6-3v12l-6-3Z"/>',screen:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 22h8M12 17v5"/>',leave:'<path d="M3 16v-4q9-7 18 0v4h-5v-4H8v4Z"/>'};
  const iconMarkup=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+voiceIcons[name]+'</svg>';
  async function renderVoice(participants) {
    if(!voice||!voiceView)return;voiceParticipants=participants;renderRoomParticipants(voice,participants);updateVoiceDock();root.classList.add('nc-call-stage');
    const profile=readStorage('nightcallProfile',{}),all=[...participants];
    if(!all.some(p=>p.id===profile.id))all.unshift(profile);
    const signature=JSON.stringify([all,group.muted,group.deaf,group.cameraActive,group.screenActive,all.map(p=>[group.connectionState(p.id),...Object.values(group.participantMedia(p.id)).map(stream=>stream?.getVideoTracks().map(t=>[t.id,t.readyState,t.muted]))])]);
    if(signature===voiceSignature&&messages.querySelector('.nc-voice-stage'))return;voiceSignature=signature;
    messages.replaceChildren();messages.classList.add('nc-voice-view');
    const heading=document.createElement('div');heading.className='nc-voice-heading';
    const identity=document.createElement('div');identity.className='nc-call-identity';const label=document.createElement('strong');label.textContent=channelEntries.find(c=>c.id===voice)?.name||'Sala de voz';
    const summary=document.createElement('span');summary.textContent=all.length+' '+(all.length===1?'pessoa na chamada':'pessoas na chamada');identity.append(label,summary);
    const utilities=document.createElement('div');utilities.className='nc-call-utilities';const clock=document.createElement('span');clock.className='nc-call-clock';
    const fullscreen=document.createElement('button');fullscreen.type='button';fullscreen.setAttribute('aria-label','Alternar tela cheia da chamada');fullscreen.title='Tela cheia';fullscreen.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>';fullscreen.onclick=async()=>{try{if(document.fullscreenElement===messages)await document.exitFullscreen();else await messages.requestFullscreen();}catch{info('A tela cheia não está disponível neste dispositivo.');}};
    utilities.append(clock,fullscreen);heading.append(identity,utilities);messages.append(heading);updateCallClock();
    const stage=document.createElement('div');stage.className='nc-voice-stage';
    stage.dataset.count=String(all.length);
    for(const participant of all){
      const own=participant.id===profile.id,row=document.createElement('article');row.className='nc-voice-tile';row.dataset.participantId=participant.id;
      const avatar=document.createElement('div');avatar.className='nc-voice-avatar';renderAvatar(avatar,own?profile.avatar:participant.avatar,participant.name);row.append(avatar);
      const media=group.participantMedia(participant.id);
      for(const kind of ['camera','screen']){const stream=media[kind];if(!stream?.getVideoTracks().some(t=>t.readyState==='live'&&!t.muted))continue;const video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.muted=true;video.srcObject=stream;video.dataset.voiceMedia=kind;video.setAttribute('aria-label',(kind==='camera'?'Câmera de ':'Tela de ')+participant.name);row.append(video);row.classList.add('nc-has-video');if(kind==='camera')avatar.hidden=true;video.play().catch(()=>{});}
      const caption=document.createElement('div');caption.className='nc-voice-caption';const name=document.createElement('strong');name.textContent=(participant.name||participant.username)+(own?' · Você':'');const state=document.createElement('span');state.className='nc-voice-state';state.textContent=!own&&participant.deaf?'Áudio desativado':!own&&participant.muted?'Microfone silenciado':own?(group.deaf?'Áudio desativado':group.muted?'Microfone silenciado':'Conectado'):{connected:'Conectado',connecting:'Conectando…',new:'Conectando…',disconnected:'Reconectando…',failed:'Conexão interrompida'}[group.connectionState(participant.id)]||'Conectando…';caption.append(name,state);row.append(caption);
      if(!own){const volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='100';volume.value=String(Math.round(group.getVolume(participant.id)*100));volume.setAttribute('aria-label','Volume de '+participant.name);volume.oninput=()=>group.setVolume(participant.id,Number(volume.value)/100);row.append(volume);}stage.append(row);
    }messages.append(stage);
    const controls=document.createElement('div');controls.className='nc-voice-controls';
    function control(icon,text,active,action){const button=document.createElement('button');button.type='button';button.innerHTML=iconMarkup(icon)+'<span></span>';button.querySelector('span').textContent=text;button.title=text;button.setAttribute('aria-label',text);button.setAttribute('aria-pressed',String(active));button.onclick=async()=>{button.disabled=true;try{await action();voiceSignature='';await renderVoice(voiceParticipants);}catch(error){fail(error);}finally{button.disabled=false;}};controls.append(button);return button;}
    control('mic',group.muted?'Ativar microfone':'Silenciar microfone',group.muted,()=>{if(group.deaf)group.setDeaf(false);group.setMute(!group.muted);});
    control('headphones',group.deaf?'Voltar a ouvir':'Ensurdecer',group.deaf,()=>group.setDeaf(!group.deaf));
    control('camera',group.cameraActive?'Desligar câmera':'Ativar câmera',group.cameraActive,()=>group.toggleCamera());
    control('screen',group.screenActive?'Parar transmissão':'Compartilhar tela',group.screenActive,()=>group.toggleScreen());
    control('leave','Sair do canal',false,async()=>{await exitVoice();renderEmpty('Você saiu da chamada.','Selecione uma sala de voz para entrar novamente.');});
    const audioSettings=document.createElement('details');audioSettings.className='nc-call-audio-settings';
    const settingsLabel=document.createElement('summary');settingsLabel.textContent='Áudio e conexão';
    const microphoneLabel=document.createElement('label');microphoneLabel.textContent='Microfone';const microphone=document.createElement('select');microphone.setAttribute('aria-label','Microfone da sala');
    const defaultDevice=document.createElement('option');defaultDevice.value='';defaultDevice.textContent='Dispositivo padrão';microphone.append(defaultDevice);microphoneLabel.append(microphone);
    microphone.onchange=async()=>{microphone.disabled=true;try{await group.setMicrophone(microphone.value);}catch(error){microphone.value=group.microphoneId;fail(error);}finally{microphone.disabled=false;}};
    navigator.mediaDevices.enumerateDevices().then(devices=>{for(const device of devices.filter(d=>d.kind==='audioinput'))microphone.append(Object.assign(document.createElement('option'),{value:device.deviceId,textContent:device.label||'Microfone'}));microphone.value=group.microphoneId;}).catch(()=>{});
    const reconnect=document.createElement('button');reconnect.type='button';reconnect.textContent='Recuperar conexão';reconnect.onclick=async()=>{reconnect.disabled=true;try{await group.reconnect();}finally{reconnect.disabled=false;}};
    audioSettings.append(settingsLabel,microphoneLabel,reconnect);messages.append(audioSettings,controls);updateVoiceIndicators();
    stage.querySelectorAll('video').forEach(video=>{video.tabIndex=0;video.title='Clique para ampliar';video.onclick=()=>{const row=video.closest('.nc-voice-tile');const focused=row.classList.contains('nc-focused-tile');stage.querySelectorAll('.nc-focused-tile').forEach(tile=>tile.classList.remove('nc-focused-tile'));stage.classList.toggle('nc-focus-mode',!focused);if(!focused)row.classList.add('nc-focused-tile');};video.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();video.click();}};});
  }

  async function enterVoice(channelId) {
    if(voice===channelId){voiceView=true;channel=null;sendForm.hidden=true;await loadVoice();return;}
    await exitVoice();
    document.dispatchEvent(new CustomEvent('nightcallGroupCallStarted'));
    renderEmpty('Entrando na chamada…','Permita o acesso ao microfone para continuar.');
    const participants = await group.join(channelId);
    voice = channelId;channel=null;sendForm.hidden=true;voiceView=true;voiceStarted=Date.now();info('');
    highlightChannelButtons(channelEntries);
    await renderVoice(participants);
  }

  async function loadVoice() {
    if (!voice) return;
    const participants = await group.refresh();
    voiceParticipants=participants;renderRoomParticipants(voice,participants);if(voiceView)await renderVoice(participants);else updateVoiceDock();
  }

  async function refresh() {
    const response = await api('/api/communities');
    communities = response.communities;
    const rail=document.getElementById('communityRail');
    if(rail){rail.replaceChildren();for(const community of communities){const icon=document.createElement('button');icon.type='button';icon.className='nc-space-rail-icon';icon.dataset.communityId=community.id;icon.classList.toggle('nc-unread',unreadSpaces.has(community.id));renderAvatar(icon,community.icon,initials(community.name));icon.title=community.name;icon.setAttribute('aria-label','Abrir comunidade '+community.name);icon.setAttribute('aria-current',String(community.id===active && !root.hidden));icon.addEventListener('click',()=>{setPanelOpen(true);open(community.id).catch(fail);});rail.append(icon);}}
    if(active && !communities.some(item=>item.id===active)){await exitVoice();active=null;channel=null;get('communitySettings').close();}

    get('communitySwitch').disabled=!communities.length;
    if (!communities.length) {
      get('communityMenuChannel').hidden=true;get('communityMenuCategory').hidden=true;get('communityMenuNotifications').hidden=true;get('communityCopyId').hidden=true;
      get('communityManage').hidden=true;get('communityCopyInvite').hidden=true;get('communityChannelManage').hidden=true;get('channelRename').hidden=true;get('communityChannelCreate').hidden=true;get('channelRenameForm').hidden=true;inviteCode='';activeName='';
      title.textContent = 'Selecione uma comunidade';
      invite.textContent = '';
      channels.replaceChildren();
      members.replaceChildren();
      renderEmpty('Sem comunidades.', 'Crie uma comunidade ou use um código de convite para entrar em uma existente.');
      sendForm.hidden = true;
      return;
    }


    if (!active || !communities.some((item) => item.id === active)) {
      await open(communities[0].id);
    } else {
      const current=communities.find(item=>item.id===active);activeName=current.name;title.textContent=activeName;
    }
  }

  async function open(id) {
    get('communityDirectory').hidden=true;get('communitySwitch').setAttribute('aria-expanded','false');
    if (id !== active) await exitVoice();
    const data = await api('/api/communities/' + id);
    active = id;activeIcon=data.community.icon||'';
    unreadSpaces.delete(id);document.querySelectorAll('#communityRail button').forEach(icon=>{if(icon.dataset.communityId===id)icon.classList.remove('nc-unread');});
    document.querySelectorAll('#communityRail button').forEach(icon=>icon.setAttribute('aria-current',String(icon.title===data.community.name && !root.hidden)));
    selectedRole = data.community.role;
    activeName=data.community.name;
    get('communityManage').hidden=!['owner','admin'].includes(selectedRole);
    get('communityMenuChannel').hidden=!['owner','admin'].includes(selectedRole);get('communityMenuCategory').hidden=!['owner','admin'].includes(selectedRole);get('communityMenuNotifications').hidden=false;get('communityCopyId').hidden=false;
    get('communityChannelCategory').replaceChildren(Object.assign(document.createElement('option'),{value:'',textContent:'Sem categoria'}),...(data.categories||[]).map(category=>Object.assign(document.createElement('option'),{value:category.id,textContent:category.name})));
    channelEntries = data.channels;
    inviteCode = data.community.inviteCode || '';
    get('communityCopyInvite').hidden = !inviteCode;
    get('channelRename').hidden = !['owner','admin'].includes(selectedRole);
    get('channelRenameForm').hidden = true;
    title.textContent = data.community.name;
    invite.textContent = data.community.inviteCode ? 'Convite: ' + data.community.inviteCode : 'Você está participando desta comunidade.';
    const previousChannel = channel;
    channel = null;


    channels.replaceChildren();
    for (const entry of data.channels.filter(entry=>entry.kind==='text' && !entry.categoryId)) {
      channels.append(createChannelButton(entry, data.channels));
    }
    const voiceChannels=data.channels.filter(entry=>entry.kind==='voice' && !entry.categoryId);
    if(voiceChannels.length){const label=document.createElement('p');label.className='nc-channel-section-label';label.textContent='SALAS DE VOZ';channels.append(label);for(const entry of voiceChannels)channels.append(createChannelButton(entry,data.channels));}
    for(const category of data.categories||[]){const label=document.createElement('p');label.className='nc-channel-section-label';label.textContent=category.name;channels.append(label);const entries=data.channels.filter(entry=>entry.categoryId===category.id);for(const entry of entries)channels.append(createChannelButton(entry,data.channels));if(!entries.length){const empty=document.createElement('small');empty.className='nc-muted';empty.textContent='Sem canais';channels.append(empty);}}
    await refreshRoomPresence();

    members.replaceChildren();
    get('communityRoles').replaceChildren();get('communityRolesSection').hidden=selectedRole!=='owner';
    for (const member of data.members) {
      const row = document.createElement('div');
      row.className = 'nc-member-row';
      const name = document.createElement('span');
      name.textContent = member.name || member.username;
      const badge=document.createElement('span');badge.className='nc-member-avatar';renderAvatar(badge,member.avatar,member.name);
      const identity=document.createElement('span');identity.className='nc-member-identity';
      const role=document.createElement('small');role.textContent={owner:'Dono',admin:'Administrador',member:'Membro'}[member.role];identity.append(name,role);row.append(badge,identity);
      if (selectedRole === 'owner' && member.role !== 'owner') {
        const select = document.createElement('select');
        select.setAttribute('aria-label', 'Cargo de ' + member.username);
        for (const role of ['member', 'admin']) {
          const option = document.createElement('option');
          option.value = role;
          option.textContent = role === 'admin' ? 'Administrador' : 'Membro';
          select.append(option);
        }
        select.value = member.role;
        select.addEventListener('change', async () => {
          try {
            await api('/api/communities/' + id + '/members/' + member.id, {
              method:'PATCH',
              body: JSON.stringify({ role: select.value }),
            });
            await open(id);
            info('Cargo atualizado.');
          } catch (error) {
            fail(error);
            select.value = member.role;
          }
        });
        const editor=document.createElement('div');editor.className='nc-role-editor';
        const person=document.createElement('span');person.textContent=member.name || member.username;editor.append(person,select);get('communityRoles').append(editor);
      }
      members.append(row);
    }

    get('communityChannelCreate').hidden = true;
    get('communityChannelManage').hidden = !['admin', 'owner'].includes(selectedRole);

    if (voice && voiceView && data.channels.some(entry => entry.id === voice)) {
      sendForm.hidden = true;
      get('communityChannelTitle').textContent = 'Voz · ' + data.channels.find(entry => entry.id === voice).name;
      await loadVoice();
      return;
    }
    const firstTextChannel = data.channels.find(entry => entry.id === previousChannel && entry.kind === 'text') || data.channels.find((entry) => entry.kind === 'text');
    if (firstTextChannel) {
      channel = firstTextChannel.id;
      get('communityChannelTitle').textContent = '# ' + firstTextChannel.name;
      highlightChannelButtons(data.channels);
      await load();
    } else {
      sendForm.hidden = true;
      renderEmpty('Nenhum canal de texto.', 'Crie um canal de texto para começar a conversar por aqui.');
    }

    info('');
  }

  async function load() {
    root.classList.remove('nc-call-stage');
    messages.classList.remove('nc-voice-view');
    sendForm.hidden = !channel;
    if (!channel) {
      renderEmpty('Selecione um canal.', 'Escolha um canal de texto ou um canal de voz na coluna ao lado.');
      return;
    }
    const data = await api('/api/channels/' + channel + '/messages');
    messages.replaceChildren();
    if (!data.messages.length) {
      renderEmpty('Ainda não há mensagens.', 'Seja a primeira pessoa a escrever neste canal.');
      return;
    }
    for (const message of data.messages) {
      const line = document.createElement('article');line.className='nc-channel-message';
      const avatar=document.createElement('span');avatar.className='nc-message-avatar';renderAvatar(avatar,message.senderAvatar,message.senderName);
      const copy=document.createElement('div'),meta=document.createElement('header'),content=document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = message.senderName;
      const time=document.createElement('time');time.dateTime=new Date(message.createdAt).toISOString();time.textContent=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(message.createdAt);time.title=new Date(message.createdAt).toLocaleString('pt-BR');
      meta.append(strong,time);content.textContent=message.content;copy.append(meta,content);renderAttachments(copy,message.attachments);line.append(avatar,copy);
      messages.append(line);
    }
    messages.scrollTop = messages.scrollHeight;
  }

  get('communityClose').addEventListener('click', () => {
    setPanelOpen(false);
  });

  get('communityCreate').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (createStep === 2) {if(get('communityName').reportValidity()) showCreateStep(3); return;}
    if (createStep !== 3 || creating) return;
    creating = true; get('communityCreateSubmit').disabled = true;
    try {
      const field = get('communityName');
      const name = field.value.trim().replace(/\s+/g, ' ');
      if (name.length < 3) {
        throw new Error('Use pelo menos 3 caracteres para o nome da comunidade.');
      }
      const response = await api('/api/communities', {
        method:'POST',
        body: JSON.stringify({ name, template: selectedTemplate }),
      });
      field.value = '';composer.reset();
      closeForms();
      setPanelOpen(true);
      createCommunityForm.hidden = true;
      await refresh();
      await open(response.community.id);
      info('');
    } catch (error) {
      fail(error);
    } finally {creating = false; get('communityCreateSubmit').disabled = false;}
  });

  get('communityJoin').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const field = get('communityCode');
      const response = await api('/api/communities/join', {
        method:'POST',
        body: JSON.stringify({ code: field.value.trim().toLowerCase() }),
      });
      field.value = '';composer.reset();
      closeForms();
      joinCommunityForm.hidden = true;
      setPanelOpen(true);
      await refresh();
      await open(response.communityId);
      info('Você entrou na comunidade.');
    } catch (error) {
      fail(error);
    }
  });

  get('communityChannelCreate').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!active) return;
    try {
      const field = get('communityChannelName');
      const name = field.value.trim();
      await api('/api/communities/' + active + '/channels', {
        method:'POST',
        body: JSON.stringify({ name, kind: get('communityChannelKind').value,categoryId:get('communityChannelCategory').value || null }),
      });
      field.value = '';composer.reset();
      await open(active);
      info('Canal criado.');
    } catch (error) {
      fail(error);
    }
  });

  sendForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!channel) return;
    try {
      const field = get('communityText');
      if(composer.busy)throw Error('Aguarde o envio do arquivo.');
      if(!field.value.trim()&&!composer.ids.length)return;
      await api('/api/channels/' + channel + '/messages', {
        method:'POST',
        body: JSON.stringify({ content: field.value,attachments:composer.ids }),
      });
      field.value = '';composer.reset();
      await load();
    } catch (error) {
      fail(error);
    }
  });

  document.querySelector('#communityToggle')?.addEventListener('click', () => {
    const open = root.hidden;
    setPanelOpen(open);
    if (open) {
      refresh().catch(fail);
    }
  });

  document.querySelectorAll('[data-quick-open="communities"]').forEach((button) => {
    button.addEventListener('click', () => {
      setPanelOpen(true);
      refresh().catch(fail);
    });
  });

  document.addEventListener('nightcallPrivateCallStarted',()=>{if(voice)exitVoice().then(()=>renderEmpty('Você entrou em uma chamada privada.','Selecione uma sala de voz para voltar.')).catch(fail);});
  window.addEventListener('beforeunload', () => {
    group.leave().catch(() => {});
  });

  const events = new EventSource('/api/events');
  events.addEventListener('profile',()=>{if(!root.hidden){refresh().then(()=>voice?loadVoice():load()).catch(fail);}});
  document.addEventListener('nightcallProfileSaved',()=>{if(voice)loadVoice().catch(fail);});
  events.addEventListener('community', async event => {
    try {
      const details=JSON.parse(event.data);
      const profile=readStorage('nightcallProfile',{}),mode=readStorage(`nightcallCommunityNotifications:${profile.id}:${details.communityId}`,'all');
      if(details.hasMessage && details.from!==profile.id && mode!=='muted' && (root.hidden || active!==details.communityId)){
        unreadSpaces.add(details.communityId);
        document.querySelectorAll('#communityRail button').forEach(icon=>{if(icon.dataset.communityId===details.communityId)icon.classList.add('nc-unread');});
        if(readStorage('nightcallNotifications',{messages:true}).messages)window.nightcallDesktop?.notify('Nightcall — mensagem na comunidade','Abra sua comunidade para continuar a conversa.').catch(()=>{});
      }
      if(details.deleted && details.communityId===active){await exitVoice();active=null;channel=null;get('communitySettings').close();if(!root.hidden)await refresh();return;}
      if(!root.hidden){await refresh();if(channel)await load();if(voice)await loadVoice();}
    }catch(error){fail(error);}
  });
  setInterval(()=>{if(voice&&!root.hidden)loadVoice().catch(fail);},4000);
  setInterval(()=>refreshRoomPresence().catch(fail),4000);
  refresh().catch(fail);
}
