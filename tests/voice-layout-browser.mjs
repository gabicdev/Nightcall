import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createServer} from '../backend/server.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const dir=await mkdtemp(join(tmpdir(),'nightcall-voice-layout-')),server=createServer({database:join(dir,'db.sqlite')});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
try{
 const a=await browser.newContext({permissions:['microphone']}),b=await browser.newContext({permissions:['microphone']}),users=[];
 for(const [context,username] of [[a,'caller'],[b,'answerer']])users.push((await (await context.request.post(url+'/api/auth/register',{data:{username,name:username,password:'strong password 123'}})).json()).user);
 await a.request.post(url+'/api/friends/request',{data:{userId:users[1].id}});await b.request.post(url+'/api/friends/requests/'+users[0].id+'/accept');
 const p=await a.newPage(),q=await b.newPage();const errors=[];for(const page of [p,q]){page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>!!window.Nightcall);}
 await p.evaluate(person=>Nightcall.openConversation(person),users[1]);await q.evaluate(person=>Nightcall.openConversation(person),users[0]);
 assert.equal(await p.locator('.nc-stream-stage').isVisible(),false);
 await p.getByRole('button',{name:'Ligar',exact:true}).click();try{await q.getByRole('button',{name:'Atender',exact:true}).click();}catch(e){console.log('CALL FAILURE',await p.locator('.voice-controls').innerText(),await q.locator('.voice-controls').innerText(),errors);throw e;}
 await p.getByText('Chamada conectada',{exact:true}).waitFor();await q.getByText('Chamada conectada',{exact:true}).waitFor();
 assert.equal(await p.locator('.nc-call-preferences').isVisible(),true);assert.equal(await p.locator('.nc-stream-stage').isVisible(),false);assert.equal(await q.locator('.call-video:visible').count(),0);
 await p.getByRole('button',{name:'Silenciar',exact:true}).click();await p.getByRole('button',{name:'Ativar microfone',exact:true}).waitFor();
 await p.getByRole('button',{name:'Desligar',exact:true}).click();await q.getByRole('button',{name:'Ligar',exact:true}).waitFor();assert.equal(await p.locator('.nc-call-preferences').isVisible(),false);assert.equal(await q.locator('.nc-call-preferences').isVisible(),false);
 assert.deepEqual(errors,[]);await mkdir('test-results',{recursive:true});await writeFile('test-results/voice-layout-13.10.json',JSON.stringify({passed:true,media:'microfones simulados no mesmo computador',flows:['ligar','receber','aceitar','conectar WebRTC','silenciar','desligar','sem vídeos vazios','restaurar layout'],errors},null,2));console.log('PASS: chamada entre duas contas com microfones simulados e layout limpo.');
}finally{await browser.close();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
