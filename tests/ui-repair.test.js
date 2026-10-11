import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const nav=readFileSync(new URL('../js/navigation.js', import.meta.url),'utf8');
const comm=readFileSync(new URL('../js/communities.js', import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html', import.meta.url),'utf8');
test('botão de configurações abre perfil em vez de alternar microfone',()=>{
 assert.match(nav,/getElementById\("settingsButton"\).*openSettings\("profile"\)/);
 assert.doesNotMatch(nav,/profileButtons\.forEach\(function \(button, index\)/);
});
test('atalhos abrem ações verdadeiras e navegação de comunidades fecha',()=>{
 assert.match(nav,/communityToggle"\)\?\.click/);
 assert.match(nav,/\.add-message"\)\?\.addEventListener/);
 assert.match(comm,/classList\.remove\('nc-community-open'\)/);
});
test('logo isolada e estilo de reparo constam na interface',()=>{
 assert.match(html,/assets\/nightcall-mark\.png/);
 assert.match(html,/css\/nightcall-repair\.css/);
});
