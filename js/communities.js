import { api } from './api.js';
import { createGroupVoice } from './group-voice.js';

export function initializeCommunities() {
  const root = document.querySelector('#communityRoot');
  if (!root) return;

  const get = (id) => root.querySelector('#' + id);
  const status = get('communityStatus');
  const list = get('communityList');
  const channels = get('communityChannels');
  const messages = get('communityMessages');
  const members = get('communityMembers');
  const title = get('communityTitle');
  const invite = get('communityInvite');
  const sendForm = get('communitySend');

  let communities = [];
  let active = null;
  let channel = null;
  let voice = null;
  let selectedRole = null;

  const group = createGroupVoice((text) => {
    status.textContent = text;
  });

  const setPanelOpen = (open) => {
    root.hidden = !open;
    if (open) {
      document.body.classList.add('nc-community-open');
    } else {
      document.body.classList.remove('nc-community-open');
    }
    document.querySelector('#communityToggle')?.classList.toggle('active', open);
  };

  const fail = (error) => {
    status.textContent = error?.message || String(error);
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

  const createServerButton = (community) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nc-community-server';
    button.setAttribute('aria-current', String(community.id === active));
    button.innerHTML = `
      <span class="nc-community-server-badge" aria-hidden="true">${initials(community.name)}</span>
      <span class="nc-community-server-copy">
        <strong>${community.name}</strong>
        <small>${community.role === 'owner' ? 'Você é o dono' : community.role === 'admin' ? 'Administrador' : 'Membro'}</small>
      </span>`;
    button.addEventListener('click', () => open(community.id).catch(fail));
    return button;
  };

  const createChannelButton = (entry, allChannels) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nc-channel-item';
    button.setAttribute('aria-current', String(entry.id === channel));
    const glyph = entry.kind === 'voice' ? '🔊' : '#';
    const subtitle = entry.kind === 'voice' ? 'Canal de voz' : 'Canal de texto';
    button.innerHTML = `
      <span class="nc-channel-glyph" aria-hidden="true">${glyph}</span>
      <span class="nc-channel-copy">
        <strong>${entry.name}</strong>
        <small>${subtitle}</small>
      </span>`;
    button.addEventListener('click', async () => {
      channel = entry.kind === 'text' ? entry.id : null;
      highlightChannelButtons(allChannels);
      if (entry.kind === 'voice') {
        await enterVoice(entry.id);
        return;
      }
      await exitVoice();
      await load();
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
    Array.from(channels.children).forEach((button, index) => {
      button.setAttribute('aria-current', String(allChannels[index]?.id === channel));
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

    for (const participant of participants) {
      const row = document.createElement('div');
      row.className = 'nc-member-row';
      const name = document.createElement('span');
      name.textContent = '🎧 ' + (participant.name || participant.username);
      row.append(name);
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
      messages.append(row);
    }

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

    messages.append(mute, deaf, leave);
  }

  async function enterVoice(channelId) {
    await exitVoice();
    const participants = await group.join(channelId);
    voice = channelId;
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
    list.replaceChildren();

    if (!communities.length) {
      const empty = document.createElement('div');
      empty.className = 'nc-community-empty';
      empty.innerHTML = '<div><strong>Nenhuma comunidade ainda</strong><span>Crie a primeira comunidade com um nome decente e chame seus amigos.</span></div>';
      list.append(empty);
      title.textContent = 'Selecione uma comunidade';
      invite.textContent = '';
      channels.replaceChildren();
      members.replaceChildren();
      renderEmpty('Sem comunidades.', 'Crie uma comunidade ou use um código de convite para entrar em uma existente.');
      sendForm.hidden = true;
      return;
    }

    for (const community of communities) {
      list.append(createServerButton(community));
    }

    if (!active || !communities.some((item) => item.id === active)) {
      await open(communities[0].id);
    }
  }

  async function open(id) {
    await exitVoice();
    const data = await api('/api/communities/' + id);
    active = id;
    selectedRole = data.community.role;
    title.textContent = data.community.name;
    invite.textContent = data.community.inviteCode ? 'Convite: ' + data.community.inviteCode : 'Você está participando desta comunidade.';
    channel = null;

    list.replaceChildren();
    for (const community of communities) {
      list.append(createServerButton(community));
    }

    channels.replaceChildren();
    for (const entry of data.channels) {
      channels.append(createChannelButton(entry, data.channels));
    }

    members.replaceChildren();
    for (const member of data.members) {
      const row = document.createElement('div');
      row.className = 'nc-member-row';
      const name = document.createElement('span');
      name.textContent = (member.name || member.username) + ' · ' + member.role;
      row.append(name);
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
        row.append(select);
      }
      members.append(row);
    }

    get('communityChannelCreate').hidden = !['admin', 'owner'].includes(selectedRole);

    const firstTextChannel = data.channels.find((entry) => entry.kind === 'text');
    if (firstTextChannel) {
      channel = firstTextChannel.id;
      highlightChannelButtons(data.channels);
      await load();
    } else {
      sendForm.hidden = true;
      renderEmpty('Nenhum canal de texto.', 'Crie um canal de texto para começar a conversar por aqui.');
    }

    info('');
  }

  async function load() {
    messages.replaceChildren();
    sendForm.hidden = !channel;
    if (!channel) {
      renderEmpty('Selecione um canal.', 'Escolha um canal de texto ou um canal de voz na coluna ao lado.');
      return;
    }
    const data = await api('/api/channels/' + channel + '/messages');
    if (!data.messages.length) {
      renderEmpty('Ainda não há mensagens.', 'Seja a primeira pessoa a escrever neste canal.');
      return;
    }
    for (const message of data.messages) {
      const line = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = message.senderName + ': ';
      line.append(strong, document.createTextNode(message.content));
      messages.append(line);
    }
    messages.scrollTop = messages.scrollHeight;
  }

  get('communityClose').addEventListener('click', () => {
    exitVoice().catch(fail);
    setPanelOpen(false);
  });

  get('communityCreate').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const field = get('communityName');
      const name = field.value.trim().replace(/\s+/g, ' ');
      if (name.length < 3) {
        throw new Error('Use pelo menos 3 caracteres para o nome da comunidade.');
      }
      const response = await api('/api/communities', {
        method:'POST',
        body: JSON.stringify({ name }),
      });
      field.value = '';
      await refresh();
      await open(response.community.id);
      info('Comunidade criada com sucesso.');
    } catch (error) {
      fail(error);
    }
  });

  get('communityJoin').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const field = get('communityCode');
      const response = await api('/api/communities/join', {
        method:'POST',
        body: JSON.stringify({ code: field.value.trim() }),
      });
      field.value = '';
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
        body: JSON.stringify({ name, kind: get('communityChannelKind').value }),
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
  events.addEventListener('community', () => {
    if (!root.hidden) {
      refresh().catch(fail);
      if (channel) load().catch(fail);
      if (voice) loadVoice().catch(fail);
    }
  });
}
