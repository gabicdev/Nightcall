import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('index.html','utf8'),js=readFileSync('js/communities.js','utf8'),css=readFileSync('css/communities.css','utf8');
test('painel de comunidades oferece controles e recursos acessíveis',()=>{
 for(const id of ['communityChannelCreate','communityChannelName','communityChannelKind','communityMembers','communityStatus']) assert.match(html,new RegExp(`id="${id}"`));
 assert.match(js,/\/members\/.*PATCH|method:'PATCH'/);
 assert.match(js,/method:'POST'/);
 assert.match(css,/max-width:540px/);
 assert.match(css,/\[hidden\]/);
});
