const {app,BrowserWindow,shell,dialog,Tray,Menu,nativeImage,ipcMain,Notification} = require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const {readRemoteConfig}=require('./runtime-config.cjs');
const {autoUpdater}=require('electron-updater');
const {createUpdates}=require('./updates.cjs');
let updates;
let server;
let mainWindow;
let tray;
let quitting=false;
let unread=0;
let activeUrl='';
let startupError='';
let lastNotifyAt=0;
// Os testes usam uma pasta temporária e não acessam os dados do usuário.
const testing=process.env.NIGHTCALL_TEST_MODE === '1' && !!process.env.NIGHTCALL_TEST_DATA;
if(testing) app.setPath('userData',path.resolve(process.env.NIGHTCALL_TEST_DATA));
// IPC só é permitido a partir da janela principal no endereço esperado.
function trustedSender(event){
  if(!mainWindow || event.sender!==mainWindow.webContents || !activeUrl)return false;
  try {return new URL(event.senderFrame.url).origin===new URL(activeUrl).origin;}catch{return false;}
}


// Uma instalação, uma instância: evita servidores/ícones duplicados.
const singleInstance=app.requestSingleInstanceLock();
if(!singleInstance) app.quit();
else app.on('second-instance',()=>{mainWindow?.show();mainWindow?.focus();});
ipcMain.handle('nightcall:notify',(event,data)=>{
  if(!trustedSender(event))return false;
  const now=Date.now();
  if(now-lastNotifyAt<1200)return false;
  if(!mainWindow || mainWindow.isFocused() || !Notification.isSupported())return false;
  const title=String(data?.title||'Nightcall').slice(0,80);
  const body=String(data?.body||'Nova atividade').slice(0,180);
  lastNotifyAt=now;
  new Notification({title,body,silent:false}).show();
  unread=Math.min(999,unread+1);
  tray?.setToolTip(`Nightcall — ${unread} notificações`);
  return true;
});
ipcMain.handle('nightcall:open',(event)=>{if(!trustedSender(event))return false;mainWindow?.show();mainWindow?.focus();return true;});

const start=async()=>{
  const root=path.resolve(__dirname,'..');
  const {remote}=readRemoteConfig(app.getPath('userData'));
  let url;
  if(remote) {
    url=remote;
  } else {
    const {createServer}=await import(pathToFileURL(path.join(__dirname,'../backend/server.js')).href);
    const database=path.join(app.getPath('userData'),'nightcall.sqlite');
    server=createServer({root,database});
    await new Promise((resolve,reject)=>{
      server.once('error',reject);
      server.listen(0,'127.0.0.1',resolve);
    });
    url=`http://127.0.0.1:${server.address().port}`;
  }
  activeUrl=url;
  const win=new BrowserWindow({show:!testing,icon:path.join(root,'assets/nightcall-mark.png'),width:1250,height:800,minWidth:850,minHeight:560,backgroundColor:'#101018',title:'Nightcall',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(__dirname,'preload.cjs')}});
  win.webContents.setWindowOpenHandler(({url:external})=>{
    try {const parsed=new URL(external);if(parsed.protocol==='https:' && !parsed.username && !parsed.password)shell.openExternal(parsed.toString()).catch(()=>{});} catch {}
    return {action:'deny'};
  });
  win.webContents.on('will-navigate',(event,target)=>{
    try {if(new URL(target).origin!==new URL(url).origin)event.preventDefault();}
    catch {event.preventDefault();}
  });
  win.webContents.on('will-redirect',(event,target)=>{
    try {if(new URL(target).origin!==new URL(url).origin)event.preventDefault();}
    catch {event.preventDefault();}
  });
  mainWindow=win;
  win.on('focus',()=>{unread=0;tray?.setToolTip('Nightcall');});
  win.on('close', event=>{if(!quitting){event.preventDefault();win.hide();}});
  const icon=nativeImage.createFromPath(path.join(root,'assets/nightcall-mark.png'));
  try {
    tray=new Tray(icon);
    tray.setToolTip('Nightcall');
    tray.setContextMenu(Menu.buildFromTemplate([
      {label:'Abrir Nightcall',click:()=>{win.show();win.focus();}},
      {label:'Minimizar',click:()=>win.hide()},
      {label:'Sair',click:()=>{quitting=true;app.quit();}}
    ]));
    tray.on('double-click',()=>win.show());
  } catch(err) {console.warn('Bandeja indisponível:',err.message);}
  // Não encerra todo o aplicativo quando a conexão remota falha.
  // O usuário pode tentar novamente pela bandeja, sem perder a sessão.
  const loadApp=async()=>{
    if(win.isDestroyed())return false;
    try {await win.loadURL(url);return true;}
    catch(error){
      const message=String(error?.message||error).slice(0,400);
      await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(`<!doctype html><html lang="pt-br"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Nightcall offline</title><style>body{background:#101018;color:#eee;font:16px system-ui;padding:4rem;max-width:700px;margin:auto}p{color:#bbb}code{color:#c9a4ff}</style><h1>Sem conexão com o Nightcall</h1><p>Não foi possível carregar o servidor. Verifique sua conexão ou a configuração do servidor.</p><p>Use <b>Tentar reconectar</b> no ícone da bandeja.</p><code>${message.replace(/[&<>"']/g,'')}</code></html>`));
      return false;
    }
  };
  win.webContents.on('did-fail-load',(_event,code,desc,validatedUrl,isMainFrame)=>{
    if(isMainFrame && validatedUrl===url) console.warn('Falha de carregamento:',code,desc);
  });
  updates=createUpdates({app,updater:autoUpdater,dialog,getWindow:()=>mainWindow,portable:!!process.env.PORTABLE_EXECUTABLE_FILE,enabled:!testing,onInstall:()=>{quitting=true;}});
  autoUpdater.on('update-downloaded',()=>{if(Notification.isSupported()) {const notice=new Notification({title:'Nightcall — atualização pronta',body:'Use Atualizações no ícone da bandeja para reiniciar quando quiser.'});notice.on('click',()=>updates.show().catch(console.error));notice.show();}});
  const originalMenu=()=>Menu.buildFromTemplate([
    {label:'Abrir Nightcall',click:()=>{win.show();win.focus();}},
    {label:`Nightcall ${app.getVersion()}`,enabled:false},
    {label:'Atualizações — verificar / instalar',click:()=>updates.check(true).catch(console.error)},
    {label:'Tentar reconectar',click:()=>{loadApp().catch(console.error);win.show();}},
    {label:'Minimizar',click:()=>win.hide()},
    {label:'Sair',click:()=>{quitting=true;app.quit();}}
  ]);
  tray?.setContextMenu(originalMenu());
  await loadApp();
  updates.start();
};
ipcMain.handle('nightcall:connection-info',(event)=>trustedSender(event)?({mode:activeUrl.startsWith('https:')?'remote':'local',origin:activeUrl||'',hasError:!!startupError}):null);
if(singleInstance) app.whenReady().then(start).catch(error=>{
  startupError=String(error?.stack||error);
  try {
    const file=path.join(app.getPath('userData'),'startup-error.log');
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,`${new Date().toISOString()}\n${startupError}\n`,'utf8');
  } catch {}
  dialog.showErrorBox('Nightcall — Falha na inicialização',`${String(error?.message||error)}\n\nConfira server-config.json na pasta de dados do Nightcall.`);
  app.quit();
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{quitting=true;updates?.stop();if(server)server.close();});
