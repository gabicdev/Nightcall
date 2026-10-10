import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
const root=process.cwd();
test('identidade visual oficial está ligada ao login e à aplicação',async()=>{
 const html=await readFile(join(root,'index.html'),'utf8');
 assert.match(html,/nc-auth-brand/);assert.match(html,/assets\/nightcall-official\.png/);
 assert.match(html,/css\/nightcall-design\.css/);
 const image=await stat(join(root,'assets/nightcall-official.png'));
 assert.ok(image.size>10000);
});
test('layout mantém IDs essenciais para os contratos JS',async()=>{
 const html=await readFile(join(root,'index.html'),'utf8');
 for(const id of ['authPage','applicationRoot','communityRoot','friendsPage','messagesPage','chatPanel','settingsOverlay','homePage','myAvatar']) assert.ok(html.includes(`id="${id}"`),id);
});
test('versão desktop distribui os assets da marca e o build os copia',async()=>{
 const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
 assert.ok(pkg.build.files.includes('assets/**/*'));
 const build=await readFile(join(root,'scripts/build.js'),'utf8');assert.match(build,/"assets"/);
 const css=await readFile(join(root,'css/nightcall-design.css'),'utf8');
 assert.match(css,/prefers-reduced-motion/);assert.match(css,/focus-visible/);
});
