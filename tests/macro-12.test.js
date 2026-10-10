import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../desktop/main.cjs',import.meta.url),'utf8');
const validator=readFileSync(new URL('../scripts/validate-release.cjs',import.meta.url),'utf8');
test('IPC protege notificações, abertura e informações de conexão',()=>{
 assert.match(main,/function trustedSender/);
 assert.match(main,/if\(!trustedSender\(event\)\)return false/);
 assert.match(main,/connection-info.*trustedSender/);
});
test('navegação e redirecionamentos externos são limitados',()=>{
 assert.match(main,/will-navigate/);
 assert.match(main,/will-redirect/);
});
test('notificações têm limitação temporal',()=>{
 assert.match(main,/now-lastNotifyAt<1200/);
});
test('distribuição registra hash SHA-256 para cada artefato',()=>{
 assert.match(validator,/SHA256SUMS.json/);
 assert.match(validator,/sha256/);
});
