import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {createServer} from '../backend/server.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE);
const dir=await mkdtemp(join(tmpdir(),'nightcall-layout-'));const server=createServer({root:resolve('.'),database:join(dir,'test.sqlite')});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
try{const context=await browser.newContext({viewport:{width:390,height:844},permissions:['microphone','camera']});
 await context.request.post(url+'/api/auth/register',{data:{username:'inspect',name:'Luna',password:'strong password 123'}});
 await context.request.post(url+'/api/communities',{data:{name:'Clube da noite',template:'games'}});
 const page=await context.newPage();await page.goto(url);await page.waitForFunction(()=>!!window.Nightcall);await page.locator('.nc-space-rail-icon').click();await page.locator('.nc-channel-item').filter({hasText:'equipe'}).click();await page.locator('.nc-voice-tile').waitFor();
 console.log(JSON.stringify(await page.evaluate(()=>['.nc-community','.nc-community-grid','.nc-community-main','#communityMessages','.nc-voice-stage','.nc-voice-tile'].map(selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect(),s=getComputedStyle(e);return{selector,left:r.left,right:r.right,width:r.width,minWidth:s.minWidth,padding:s.padding,display:s.display,columns:s.gridTemplateColumns}})),null,2));
 await page.screenshot({path:'test-results/mobile-layout-inspect.png'});
}finally{await browser.close();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
