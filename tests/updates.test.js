import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
const {createUpdates}=createRequire(import.meta.url)('../desktop/updates.cjs');
function setup(extra={}) {
  const updater=new EventEmitter();let checks=0,installed=0,quitting=0,response=1;const prompts=[];
  updater.checkForUpdates=async()=>{checks++;updater.emit('checking-for-update');updater.emit('update-not-available');};
  updater.quitAndInstall=()=>installed++;
  const manager=createUpdates({app:{isPackaged:true},updater,dialog:{showMessageBox:async options=>{prompts.push(options);return {response};}},getWindow:()=>null,onInstall:()=>quitting++,...extra});
  return {manager,updater,prompts,counts:()=>({checks,installed,quitting}),answer:value=>response=value};
}
test('portátil e desenvolvimento não procuram nem instalam atualizações',async()=>{
  for(const extra of [{portable:true},{app:{isPackaged:false}},{enabled:false}]) {const t=setup(extra);await t.manager.check(true);assert.equal(t.counts().checks,0);assert.equal(t.manager.status().supported,false);assert.equal(t.counts().installed,0);}
});
test('atualização pronta só instala com escolha explícita e fecha sem esconder na bandeja',async()=>{
  const t=setup();if(process.platform!=='win32')return;
  t.updater.emit('update-downloaded',{version:'14.0.0'});await t.manager.show();assert.equal(t.counts().installed,0);
  assert.equal(t.updater.autoInstallOnAppQuit,false);assert.equal(t.prompts[0].defaultId,1);
  t.answer(0);await t.manager.show();assert.equal(t.counts().installed,1);assert.equal(t.counts().quitting,1);
});
test('verificação concorrente não duplica downloads e erros permitem nova tentativa',async()=>{
  const t=setup();if(process.platform!=='win32')return;
  let done;t.updater.checkForUpdates=()=>new Promise(resolve=>done=resolve);
  const first=t.manager.check();await t.manager.check();done();await first;
  t.updater.checkForUpdates=async()=>{throw Error('offline');};await t.manager.check();assert.equal(t.manager.status().state,'error');
  t.updater.checkForUpdates=async()=>t.updater.emit('update-not-available');await t.manager.check();assert.equal(t.manager.status().state,'current');
  t.updater.emit('update-available',{version:'14.0.0'});t.updater.emit('download-progress',{percent:42.7});await t.manager.show();assert.match(t.prompts.at(-1).message,/42%/);
});
