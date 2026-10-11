// Atualizações do instalador Windows. O portátil não tem instalação para substituir.
function createUpdates({app, updater, dialog, getWindow, portable=false, enabled=true, onInstall=()=>{}}) {
  let state='idle', version='', progress=0, busy=false, errorKind='',checkedAt=null;
  const supported=enabled && app.isPackaged && process.platform==='win32' && !portable;
  updater.autoDownload=true;
  updater.autoInstallOnAppQuit=false;
  updater.on('checking-for-update',()=>{state='checking';errorKind='';});
  updater.on('update-available',info=>{state='downloading';version=info.version;progress=0;});
  updater.on('download-progress',info=>{progress=Math.floor(info.percent);});
  updater.on('update-not-available',()=>{state='current';});
  updater.on('update-downloaded',info=>{state='ready';version=info.version;});
  updater.on('error',error=>{if(state==='ready')return;state='error';errorKind=/404|No published versions|latest.yml|ERR_UPDATER_NO_PUBLISHED_VERSIONS/i.test(String(error?.message||error))?'unpublished':'network';});
  const message=()=>!supported ? (portable?'Para atualizar esta versão portátil, use o instalador Nightcall.':'Atualizações disponíveis no aplicativo instalado para Windows.') : ({idle:'Ainda não foi verificada uma nova versão.',checking:'Procurando atualizações…',downloading:`Baixando Nightcall ${version} (${progress}%). Você pode continuar usando o aplicativo.`,ready:`Nightcall ${version} está pronto. Reinicie para atualizar. Salve sua atividade e encerre chamadas antes de continuar.`,current:'Você está usando a versão mais recente publicada.',error:'Não foi possível verificar ou baixar a atualização. Confira sua conexão e tente novamente.'}[state]);
  async function check(manual=false) {
    if(!supported || busy || state==='downloading' || state==='ready') {if(manual)await show();return;}
    busy=true;
    try {await updater.checkForUpdates();checkedAt=new Date().toISOString();} catch(error) {state='error';errorKind=/404|No published versions|latest.yml|ERR_UPDATER_NO_PUBLISHED_VERSIONS/i.test(String(error?.message||error))?'unpublished':'network';} finally {busy=false;}
    if(manual)await show();
  }
  async function show() {
    const ready=supported && state==='ready';
    const options={type:'info',title:'Atualizações do Nightcall',message:message(),buttons:ready?['Reiniciar e atualizar','Agora não']:['OK'],defaultId:ready?1:0,cancelId:ready?1:0};
    const win=getWindow();
    const result=await (win?dialog.showMessageBox(win,options):dialog.showMessageBox(options));
    if(ready && result.response===0){onInstall();updater.quitAndInstall(false,true);}
  }
  let timer;
  function start(){if(!supported)return;check().catch(()=>{});timer=setInterval(()=>check().catch(()=>{}),4*60*60*1000);timer.unref?.();}
  return {start,check,show,status:()=>({state,version,progress,supported,currentVersion:app.getVersion?.()||'',portable,errorKind,checkedAt,message:errorKind==='unpublished'?'Ainda não há uma atualização disponível para baixar neste canal.':message()}),stop:()=>clearInterval(timer)};
}
module.exports={createUpdates};
