import {api} from './api.js';
import {createGroupVoice} from './group-voice.js';
export function initializeCommunities(){
 const root=document.querySelector('#communityRoot');if(!root)return;
 const get=id=>root.querySelector('#'+id), status=get('communityStatus');
 const list=get('communityList'),channels=get('communityChannels'),messages=get('communityMessages'),members=get('communityMembers');
 let active=null,channel=null,voice=null,selectedRole=null;
 const group=createGroupVoice(t=>{status.textContent=t});
 async function exitVoice(){voice=null;await group.leave();}
 async function enterVoice(id){await exitVoice();const participants=await group.join(id);voice=id;await renderVoice(participants);}
 async function renderVoice(participants){messages.replaceChildren();messages.append(Object.assign(document.createElement('p'),{textContent:'Canal de voz · WebRTC (máximo 5 pessoas)'}));
  const myId=(await api('/api/auth/me')).user.id;
  for(const m of participants){const line=document.createElement('div');line.className='nc-voice-participant';const name=document.createElement('span');name.textContent='🎧 '+(m.name||m.username);line.append(name);
   const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='100';slider.step='5';slider.value=String(Math.round(group.getVolume(m.id)*100));slider.setAttribute('aria-label','Volume de '+(m.name||m.username));slider.addEventListener('input',()=>group.setVolume(m.id,Number(slider.value)/100));
   if(String(m.id)!==String(myId))line.append(slider);messages.append(line)}
  const mute=button(group.muted?'Ativar microfone':'Silenciar microfone',()=>{mute.textContent=group.setMute(!group.muted)?'Ativar microfone':'Silenciar microfone'});messages.append(mute);
  const deaf=button(group.deaf?'Voltar a ouvir':'Ensurdecer',()=>{deaf.textContent=group.setDeaf(!group.deaf)?'Voltar a ouvir':'Ensurdecer'});messages.append(deaf);
  messages.append(button('Sair do canal',async()=>{await exitVoice();messages.textContent='Você saiu do canal.'}));
 }
 async function loadVoice(){if(!voice)return;const d=await group.refresh();await renderVoice(d)}
 const fail=e=>{status.textContent=e?.message||String(e)};
 const info=t=>{status.textContent=t};
 root.querySelector('#communityClose').addEventListener('click',()=>{exitVoice().catch(fail);root.hidden=true});
 function button(text,action,current=false){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-current',String(current));b.addEventListener('click',()=>Promise.resolve(action()).catch(fail));return b}
 async function refresh(){const d=await api('/api/communities');list.replaceChildren();for(const c of d.communities)list.append(button(c.name,()=>open(c.id),c.id===active));if(!d.communities.length)list.textContent='Nenhuma comunidade';}
 async function open(id){await exitVoice();const d=await api('/api/communities/'+id);active=id;selectedRole=d.community.role;channel=null;messages.replaceChildren();get('communityTitle').textContent=d.community.name;get('communityInvite').textContent=d.community.inviteCode?'Convite: '+d.community.inviteCode:'';channels.replaceChildren();
 for(const c of d.channels)channels.append(button((c.kind==='voice'?'🔊 ':'# ')+c.name,()=>{channel=c.kind==='text'?c.id:null;highlightChannels();if(c.kind==='voice')return enterVoice(c.id);return exitVoice().then(load)},false));
 function highlightChannels(){Array.from(channels.children).forEach((b,i)=>b.setAttribute('aria-current',String(d.channels[i].id===channel)))}
 members.replaceChildren();for(const m of d.members){const row=document.createElement('div');row.className='nc-member-row';const name=document.createElement('span');name.textContent=(m.name||m.username)+' · '+m.role;row.append(name);if(selectedRole==='owner'&&m.role!=='owner'){const sel=document.createElement('select');sel.setAttribute('aria-label','Cargo de '+m.username);for(const r of ['member','admin']){const opt=document.createElement('option');opt.value=r;opt.textContent=r==='admin'?'Administrador':'Membro';sel.append(opt)}sel.value=m.role;sel.addEventListener('change',async()=>{try{await api('/api/communities/'+id+'/members/'+m.id,{method:'PATCH',body:JSON.stringify({role:sel.value})});await open(id);info('Cargo atualizado.')}catch(e){fail(e);sel.value=m.role}});row.append(sel)}members.append(row)}
 get('communityChannelCreate').hidden=!['admin','owner'].includes(selectedRole);get('communitySend').hidden=true;messages.textContent='Selecione um canal de texto.';await refresh();info('');}
 async function load(){messages.replaceChildren();get('communitySend').hidden=!channel;if(!channel){messages.textContent='Selecione um canal de voz para conversar.';return}const d=await api('/api/channels/'+channel+'/messages');for(const m of d.messages){const line=document.createElement('p'),strong=document.createElement('strong');strong.textContent=m.senderName+': ';line.append(strong,document.createTextNode(m.content));messages.append(line)}messages.scrollTop=messages.scrollHeight;}
 get('communityCreate').addEventListener('submit',async e=>{e.preventDefault();try{const n=get('communityName');const d=await api('/api/communities',{method:'POST',body:JSON.stringify({name:n.value})});n.value='';await refresh();await open(d.community.id)}catch(e){fail(e)}});
 get('communityJoin').addEventListener('submit',async e=>{e.preventDefault();try{const n=get('communityCode');const d=await api('/api/communities/join',{method:'POST',body:JSON.stringify({code:n.value.trim()})});n.value='';await refresh();await open(d.communityId)}catch(e){fail(e)}});
 get('communityChannelCreate').addEventListener('submit',async e=>{e.preventDefault();if(!active)return;try{const n=get('communityChannelName'),kind=get('communityChannelKind').value;await api('/api/communities/'+active+'/channels',{method:'POST',body:JSON.stringify({name:n.value,kind})});n.value='';await open(active);info('Canal criado.')}catch(e){fail(e)}});
 get('communitySend').addEventListener('submit',async e=>{e.preventDefault();if(!channel)return;try{const n=get('communityText');await api('/api/channels/'+channel+'/messages',{method:'POST',body:JSON.stringify({content:n.value})});n.value='';await load()}catch(e){fail(e)}});
 document.querySelector('#communityToggle')?.addEventListener('click',()=>{root.hidden=!root.hidden;if(!root.hidden)refresh().catch(fail)});
 window.addEventListener('beforeunload',()=>{group.leave().catch(()=>{})});
 const events=new EventSource('/api/events');events.addEventListener('community',()=>{if(!root.hidden){refresh().catch(fail);if(channel)load().catch(fail);if(voice)loadVoice().catch(fail)}});
}
