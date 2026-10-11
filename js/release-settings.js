import {api} from './api.js';

export function initializeReleaseSettings(){
  const overview=document.getElementById('overviewSection');if(!overview)return;
  const card=document.createElement('section');card.className='nc-release-card';
  card.innerHTML='<div class="nc-release-heading"><div><h3>Nightcall sempre atualizado</h3><p id="ncInstalledVersion">Aplicativo e conexão</p></div><span class="nc-release-badge" id="ncUpdateBadge">Atualizações</span></div><p id="ncUpdateStatus" role="status"></p><progress id="ncUpdateProgress" max="100" hidden></progress><div class="nc-release-actions"><button type="button" id="ncCheckUpdates">Verificar atualização</button><button type="button" id="ncInstallUpdate" hidden>Reiniciar e atualizar</button><a href="https://github.com/gabicdev/Nightcall/releases" target="_blank" rel="noopener">Downloads e novidades ↗</a></div><div class="nc-network-summary"><p id="ncNetworkStatus" role="status">Confira a conexão antes de entrar em uma chamada.</p><button type="button" id="ncCheckConnection">Testar conexão</button></div>';
  overview.append(card);const get=id=>card.querySelector('#'+id),bridge=window.nightcallDesktop;
  let busy=false;
  function render(state){
    if(!state){get('ncInstalledVersion').textContent='Versão no navegador';get('ncUpdateStatus').textContent='As atualizações automáticas funcionam no Nightcall instalado para Windows.';get('ncCheckUpdates').disabled=true;return;}
    get('ncInstalledVersion').textContent=state.currentVersion?'Versão instalada '+state.currentVersion:'Aplicativo Windows';
    get('ncUpdateStatus').textContent=state.message||'Verifique se há uma versão nova.';
    get('ncUpdateBadge').textContent=({checking:'Verificando',downloading:'Baixando',ready:'Pronta para instalar',current:'Atualizado',error:'Tentar novamente'})[state.state]||'Atualizações';
    get('ncUpdateBadge').dataset.state=state.state;
    get('ncCheckUpdates').disabled=busy||!state.supported||['checking','downloading','ready'].includes(state.state);
    get('ncInstallUpdate').hidden=!state.supported||state.state!=='ready';
    get('ncUpdateProgress').hidden=state.state!=='downloading';get('ncUpdateProgress').value=state.progress||0;
  }
  async function refresh(){try{render(await bridge?.updateStatus?.());}catch{get('ncUpdateStatus').textContent='Não foi possível consultar as atualizações. Tente novamente.';}}
  get('ncCheckUpdates').onclick=async()=>{if(busy)return;busy=true;get('ncCheckUpdates').disabled=true;get('ncUpdateStatus').textContent='Procurando uma nova versão…';try{render(await bridge.checkUpdates());}catch{get('ncUpdateStatus').textContent='Não foi possível verificar. Confira sua conexão e tente novamente.';}finally{busy=false;await refresh();}};
  get('ncInstallUpdate').onclick=async()=>{get('ncInstallUpdate').disabled=true;try{await bridge.installUpdate();}finally{get('ncInstallUpdate').disabled=false;await refresh();}};
  get('ncCheckConnection').onclick=async()=>{const button=get('ncCheckConnection');button.disabled=true;get('ncNetworkStatus').textContent='Testando a conexão…';const start=performance.now();try{const result=await api('/api/network/status');const delay=Math.round(performance.now()-start);const info=await bridge?.connectionInfo?.();get('ncNetworkStatus').textContent='Servidor acessível · '+delay+' ms'+(info?.mode==='local'?' · Dados neste computador':'')+(result.turnConfigured?' · Retransmissão configurada para redes restritivas.':' · Chamadas usam conexão direta; algumas redes podem precisar de retransmissão.');}catch{get('ncNetworkStatus').textContent='Servidor indisponível. Confira sua conexão e tente novamente.';}finally{button.disabled=false;}};
  void refresh();setInterval(()=>{if(document.body.classList.contains('settings-open')&&overview.classList.contains('active'))void refresh();},1500);
}
