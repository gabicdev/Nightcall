import {mkdtemp,rm,mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
const {_electron}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const dir=await mkdtemp(join(tmpdir(),'nightcall-electron-'));
let app;
try {
  app=await _electron.launch({executablePath:process.env.NIGHTCALL_TEST_EXE || resolve('node_modules/electron/dist/electron.exe'),args:process.env.NIGHTCALL_TEST_EXE?[]:['.'],env:{...process.env,NIGHTCALL_TEST_MODE:'1',NIGHTCALL_TEST_DATA:dir,NIGHTCALL_SERVER_URL:''},timeout:30000});
  app.process().stderr.on('data',data=>console.log(String(data)));
  const page=await app.firstWindow(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.locator('#authSwitch').click();
  await page.locator('#registerForm [name=name]').fill('Teste Electron');
  await page.locator('#registerForm [name=username]').fill('desktop_test');
  await page.locator('#registerForm [name=password]').fill('strong password 123');
  await page.locator('#registerForm button').click(); await page.waitForFunction(()=>!!window.Nightcall);
  const updateState=await page.evaluate(async()=>({status:await nightcallDesktop.updateStatus(),install:await nightcallDesktop.installUpdate()}));
  assert.equal(updateState.status.currentVersion,JSON.parse(await readFile('package.json','utf8')).version);assert.equal(updateState.status.supported,false);assert.equal(updateState.install,false);
  await page.locator('#settingsButton').click();await page.getByText('Nightcall sempre atualizado',{exact:true}).waitFor();await page.locator('#ncCheckConnection').click();await page.getByText('Servidor acessível',{exact:false}).waitFor();await page.locator('#closeSettingsButton').click();
  await page.locator('#ownProfileButton').click(); assert.equal(await page.locator('#ownProfile').evaluate(e=>e.open),true);await page.locator('#ownProfileClose').click();
  await page.locator('.add-button').click();await page.locator('[data-community-template=games]').click();await page.locator('#communityName').fill('Jogos no Electron');await page.locator('#communityStepNext').click();await page.locator('#communityCreateSubmit').click();await page.waitForFunction(()=>document.getElementById('communityTitle').textContent==='Jogos no Electron');
  assert.equal(await page.locator('.nc-channel-item').count(),3);
  await page.locator('#communityText').fill('Mensagem no aplicativo');await page.locator('#communitySend button:not([type=button])').click();await page.getByText('Mensagem no aplicativo',{exact:false}).waitFor();
  await page.locator('.nav-button[title="Início"]').click();await page.locator('#settingsButton').click();await page.locator('[data-settings-open=profile]').click();
  const banner=new URL('/assets/nightcall-official.png',page.url()).href;
  await page.locator('#profileAvatarFile').setInputFiles('assets/nightcall-mark.png');await page.getByText('Imagem pronta. Salve para aplicar ao perfil.',{exact:true}).waitFor();
  await page.locator('#profileBanner').fill(banner);await page.locator('#saveProfile').click();await page.waitForFunction(value=>JSON.parse(localStorage.getItem('nightcallProfile')).banner===value,banner);await page.locator('#closeSettingsButton').click();
  await page.reload();await page.waitForFunction(()=>!!window.Nightcall);await page.locator('#ownProfileButton').click();await page.locator('#ownProfileBanner').waitFor({state:'visible'});await page.locator('#ownProfileClose').click();
  await page.locator('.add-button').click();await page.locator('#communityBrowse').click();await page.getByText('Mensagem no aplicativo',{exact:false}).waitFor();
  assert.deepEqual(errors,[]);await mkdir('test-results',{recursive:true});
  let screenshotCaptured=false;
  try {await page.screenshot({path:'test-results/electron-13.13.png',timeout:5000}); screenshotCaptured=true;} catch {}
  await writeFile('test-results/electron.json',JSON.stringify({passed:true,packaged:!!process.env.NIGHTCALL_TEST_EXE,screenshotCaptured,version:JSON.parse(await readFile('package.json','utf8')).version,flows:['upload de avatar','cadastro','perfil separado','modelo Jogos com 3 canais','mensagem','banner','recarregamento'],errors},null,2));
  console.log('PASS: Electron com dados isolados; cadastro, modelo, mensagem, perfil e banner.');
} catch(error) {
  await mkdir('test-results',{recursive:true});
  const windows=app?await app.windows():[];
  const state=[];
  for(const page of windows) state.push({url:page.url(),text:await page.locator('body').innerText().catch(()=>'' )});
  const startup=await readFile(join(dir,'startup-error.log'),'utf8').catch(()=>'');
  await writeFile('test-results/electron-failure.json',JSON.stringify({message:error.message,state,startup},null,2));
  console.log(JSON.stringify({message:error.message,state,startup}));
  throw error;
} finally {await app?.close();await rm(dir,{recursive:true,force:true});}
