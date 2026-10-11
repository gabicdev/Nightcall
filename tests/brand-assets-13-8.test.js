import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8');
const server = readFileSync('backend/server.js', 'utf8');
const css = readFileSync('css/nightcall-13-8.css', 'utf8');
const communities = readFileSync('js/communities.js', 'utf8');
test('servidor entrega imagens de marca sem liberar caminhos arbitrários', () => {
  assert.match(server, /assets\\\/[a-zA-Z0-9_\[\]\\\-\+\(\)\?\*\.\|]+/);
  assert.match(server, /png\|jpg\|jpeg\|webp\|svg\|ico/);
  assert.ok(statSync('assets/nightcall-mark.png').size > 10000);
  assert.ok(statSync('assets/nightcall-official.png').size > 10000);
  assert.match(html, /assets\/nightcall-mark\.png/);
});
test('criação de comunidades utiliza ações separadas', () => {
  for (const id of ['communityCreate','communityJoin','communityChooser']) assert.ok(html.includes(`id="${id}"`));
  assert.ok(!html.includes('id="ncNewCommunity"'));
  assert.ok(!html.includes('id="ncJoinCommunity"'));
  assert.match(communities, /toggleCommunityForm/);
  assert.match(css, /nc-community-toolbar/);
});
