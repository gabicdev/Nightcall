import { closeSettings, updateActiveNavigation, readStorage, writeStorage } from './navigation.js';
import { api } from './api.js';
import { createGroupVoice } from './group-voice.js';

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
  let voice = null;
  let selectedRole = null;
  let channelEntries = [];
  let inviteCode = '';
  let renamingChannel = null;
  let activeName = '';
  let managementBusy = false;
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
    get('communityEditName').value=activeName;
    get('communityDeleteName').value='';get('communityDelete').disabled=true;
    get('communityDeleteZone').hidden=selectedRole!=='owner';
    get('communitySettingsStatus').textContent='';get('communitySettings').showModal();
  });
  get('communitySettingsClose').addEventListener('click',()=>get('communitySettings').close());
  get('communityDeleteName').addEventListener('input',()=>{get('communityDelete').disabled=managementBusy || get('communityDeleteName').value.trim()!==activeName;});
  get('communityEditForm').addEventListener('submit',async event=>{
    event.preventDefault();if(managementBusy)return;managementBusy=true;
    const button=get('communityEditForm').querySelector('button');button.disabled=true;
    try {await api('/api/communities/'+active,{method:'PATCH',body:JSON.stringify({name:get('communityEditName').value})});await refresh();await open(active);get('communitySettings').close();info('Nome da comunidade atualizado.');}
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

  const group = createGroupVoice((text) => {
    status.textContent = text;
  });

  const setPanelOpen = (open) => {
    if(!open)get('communitySettings').close();
    if(!open){get('communityCategoryDialog').close();get('communityNotificationDialog').close();}
    root.hidden = !open;
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
      channel = entry.kind === 'text' ? entry.id : null;
      highlightChannelButtons(allChannels);
      if (entry.kind === 'voice') {
        await enterVoice(entry.id);
        return;
      }
      await exitVoice();
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
      button.setAttribute('aria-current', String(button.dataset.channelId === (channel || voice)));
    });
  };

  async function exitVoice() {
    voice = null;
    await group.leave();
  }

  async function renderVoice(participants) {
    messages.replaceChildren();
    messages.append(Object.assign(document.createElement('p'), {
      textContent: 'Canal de voz · WebRTC (máximo 5 pessoas)',
    }));

    const me = await api('/api/auth/me');
    const myId = me.user.id;

    const stage=document.createElement('div');stage.className='nc-voice-stage';
    for (const participant of participants) {
      const row = document.createElement('div');
      row.className='nc-voice-tile';
      const avatar=document.createElement('span');avatar.className='nc-voice-avatar';avatar.textContent=initials(participant.name || participant.username);
      const name=document.createElement('strong');name.textContent=participant.name || participant.username;
      row.append(avatar,name);
      if (String(participant.id) !== String(myId)) {
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.step = '5';
        slider.value = String(Math.round(group.getVolume(participant.id) * 100));
        slider.setAttribute('aria-label', 'Volume de ' + (participant.name || participant.username));
        slider.addEventListener('input', () => group.setVolume(participant.id, Number(slider.value) / 100));
        row.append(slider);
      }
      stage.append(row);
    }
    messages.append(stage);
    const mute = createButton(group.muted ? 'Ativar microfone' : 'Silenciar microfone', () => {
      mute.textContent = group.setMute(!group.muted) ? 'Ativar microfone' : 'Silenciar microfone';
    });
    const deaf = createButton(group.deaf ? 'Voltar a ouvir' : 'Ensurdecer', () => {
      deaf.textContent = group.setDeaf(!group.deaf) ? 'Voltar a ouvir' : 'Ensurdecer';
    });
    const leave = createButton('Sair do canal', async () => {
      await exitVoice();
      renderEmpty('Você saiu do canal de voz.', 'Selecione outro canal para continuar.');
    });

    const controls=document.createElement('div');controls.className='nc-voice-controls';controls.append(mute,deaf,leave);messages.append(controls);
  }

  async function enterVoice(channelId) {
    await exitVoice();
    const participants = await group.join(channelId);
    voice = channelId;
    highlightChannelButtons(channelEntries);
    await renderVoice(participants);
  }

  async function loadVoice() {
    if (!voice) return;
    const participants = await group.refresh();
    await renderVoice(participants);
  }

  async function refresh() {
    const response = await api('/api/communities');
    communities = response.communities;
    const rail=document.getElementById('communityRail');
    if(rail){rail.replaceChildren();for(const community of communities){const icon=document.createElement('button');icon.type='button';icon.className='nc-space-rail-icon';icon.dataset.communityId=community.id;icon.classList.toggle('nc-unread',unreadSpaces.has(community.id));icon.textContent=initials(community.name);icon.title=community.name;icon.setAttribute('aria-label','Abrir comunidade '+community.name);icon.setAttribute('aria-current',String(community.id===active && !root.hidden));icon.addEventListener('click',()=>{setPanelOpen(true);open(community.id).catch(fail);});rail.append(icon);}}
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
    active = id;
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

    members.replaceChildren();
    get('communityRoles').replaceChildren();get('communityRolesSection').hidden=selectedRole!=='owner';
    for (const member of data.members) {
      const row = document.createElement('div');
      row.className = 'nc-member-row';
      const name = document.createElement('span');
      name.textContent = member.name || member.username;
      const badge=document.createElement('span');badge.className='nc-member-avatar';badge.textContent=initials(member.name || member.username);
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

    if (voice && data.channels.some(entry => entry.id === voice)) {
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
      const avatar=document.createElement('span');avatar.className='nc-message-avatar';avatar.textContent=initials(message.senderName);
      const copy=document.createElement('div'),meta=document.createElement('header'),content=document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = message.senderName;
      const time=document.createElement('time');time.dateTime=new Date(message.createdAt).toISOString();time.textContent=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(message.createdAt);time.title=new Date(message.createdAt).toLocaleString('pt-BR');
      meta.append(strong,time);content.textContent=message.content;copy.append(meta,content);line.append(avatar,copy);
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
      field.value = '';
      closeForms();
      setPanelOpen(true);
      createCommunityForm.hidden = true;
      await refresh();
      await open(response.community.id);
      info('Comunidade criada com sucesso.');
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
      field.value = '';
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
      field.value = '';
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
      await api('/api/channels/' + channel + '/messages', {
        method:'POST',
        body: JSON.stringify({ content: field.value }),
      });
      field.value = '';
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

  window.addEventListener('beforeunload', () => {
    group.leave().catch(() => {});
  });

  const events = new EventSource('/api/events');
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
  refresh().catch(fail);
}
