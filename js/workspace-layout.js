import {showFriends} from './navigation.js';

export function initializeWorkspaceLayout(){
 const bar=document.createElement('header');bar.className='nc-workspace-bar';
 bar.innerHTML='<span class="nc-workspace-brand">nightcall</span><span class="nc-workspace-location">Início</span><button type="button" aria-label="Encontrar amigos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><span>Encontrar amigos</span></button>';
 document.getElementById('app')?.append(bar);
 // Some older documents use only the .app class.
 if(!bar.isConnected)document.querySelector('.app')?.append(bar);
 const navigation=document.querySelector('.sidebar-navigation');
 for(const label of ['Início','Mensagens','Amigos','Comunidades']){
  const link=[...navigation.querySelectorAll('.sidebar-link')].find(link=>link.querySelector('span:last-child')?.textContent.trim()===label);
  if(link)navigation.append(link);
 }
 const location=bar.querySelector('.nc-workspace-location');
 function update(){
  const community=document.getElementById('communityRoot');
  const page=document.querySelector('.page-section.active-page');
  const labels={homePage:'Início',friendsPage:'Amigos',messagesPage:'Mensagens'};
  location.textContent=!community.hidden?document.getElementById('communityTitle').textContent:labels[page?.id]||'Início';
  document.querySelectorAll('.sidebar-link').forEach(link=>{
   const section=link.querySelector('span:last-child')?.textContent.trim();
   const active=community.hidden?section===labels[page?.id]:section==='Comunidades';
   link.classList.toggle('active',active);
   if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
 }
 new MutationObserver(update).observe(document.getElementById('communityRoot'),{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(update).observe(document.getElementById('communityTitle'),{childList:true});
 document.querySelectorAll('.page-section').forEach(page=>new MutationObserver(update).observe(page,{attributes:true,attributeFilter:['class']}));
 bar.querySelector('button').onclick=()=>{showFriends();document.getElementById('friendSearch')?.focus();};
 update();
}
