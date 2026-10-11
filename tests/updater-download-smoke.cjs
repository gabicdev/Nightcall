// Run with Electron. Uses a temporary feed/cache; never installs or restarts Windows.
const {app}=require('electron');
const {NsisUpdater}=require('electron-updater');
const {ElectronHttpExecutor}=require('electron-updater/out/electronHttpExecutor');
const {createUpdates}=require('../desktop/updates.cjs');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let server,dir;
(async()=>{
 dir=await fs.mkdtemp(path.join(os.tmpdir(),'nightcall-updater-test-'));app.setPath('userData',path.join(dir,'user-data'));await app.whenReady();
 const root=path.resolve(__dirname,'..'),release=path.join(root,'release-13.13.0');
 const config=path.join(dir,'app-update.yml');await fs.writeFile(config,'provider: generic\nurl: http://127.0.0.1\nupdaterCacheDirName: isolated-nightcall-updater\n');
 const adapter={version:'13.12.0',name:'Nightcall-test',isPackaged:true,appUpdateConfigPath:config,userDataPath:path.join(dir,'data'),baseCachePath:path.join(dir,'cache'),whenReady:()=>Promise.resolve(),onQuit(){},quit(){throw Error('Installation forbidden in this test.');},relaunch(){throw Error('Restart forbidden in this test.');}};
 const allowed=new Set(['latest.yml','Nightcall-Setup-13.13.0-x64.exe','Nightcall-Setup-13.13.0-x64.exe.blockmap']);
 server=http.createServer(async(req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1));if(!allowed.has(name)){res.writeHead(404);return res.end();}try{const file=await fs.readFile(path.join(release,name));res.setHeader('Content-Length',file.length);res.setHeader('Content-Type',name.endsWith('.yml')?'text/yaml':'application/octet-stream');res.end(req.method==='HEAD'?undefined:file);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const updater=new NsisUpdater(null,adapter);updater.httpExecutor=new ElectronHttpExecutor();updater.setFeedURL({provider:'generic',url:'http://127.0.0.1:'+server.address().port});updater.disableDifferentialDownload=true;updater.logger=console;
 const manager=createUpdates({app:{isPackaged:true,getVersion:()=>adapter.version},updater,dialog:{showMessageBox:async()=>({response:1})},getWindow:()=>null});
 let timeout;const downloaded=new Promise((resolve,reject)=>{updater.once('update-downloaded',resolve);updater.once('error',reject);timeout=setTimeout(()=>reject(Error('Download timed out.')),90000);});
 await manager.check();const result=await downloaded;clearTimeout(timeout);assert.equal(manager.status().state,'ready');assert.equal(manager.status().version,'13.13.0');
 const original=await fs.readFile(path.join(release,'Nightcall-Setup-13.13.0-x64.exe')),received=await fs.readFile(result.downloadedFile);assert.equal(crypto.createHash('sha512').update(received).digest('base64'),crypto.createHash('sha512').update(original).digest('base64'));assert.equal(updater.autoInstallOnAppQuit,false);await manager.show();
 await fs.mkdir(path.join(root,'test-results'),{recursive:true});await fs.writeFile(path.join(root,'test-results/updater-download-13.13.json'),JSON.stringify({passed:true,fromVersion:'13.12.0',toVersion:'13.13.0',provider:'generic localhost, actual electron-updater',downloadedBytes:received.length,sha512Matches:true,state:manager.status().state,installationExecuted:false,cache:'temporary isolated directory',limits:'Instalação e atualização pela release pública do GitHub ainda não executadas.'},null,2));
 console.log('PASS: atualizador real detectou, baixou e verificou o instalador 13.13; instalação não executada.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}if(dir)await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});app.exit(process.exitCode||0);});
