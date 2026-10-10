const fs = require('node:fs');
const path = require('node:path');
function fail(message) { console.error('ERRO Electron: ' + message); process.exitCode = 1; }
try {
  const dir = path.dirname(require.resolve('electron/package.json'));
  const marker = path.join(dir, 'path.txt');
  if (!fs.existsSync(marker)) {
    fail('path.txt nao existe; postinstall bloqueado. Verifique npm approve-scripts electron e reinstale as dependencias.');
  } else {
    const binary = path.resolve(dir, 'dist', fs.readFileSync(marker, 'utf8').trim());
    if (!fs.existsSync(binary)) fail('Executavel nao existe: ' + binary + '. A instalacao do Electron esta incompleta.');
    else console.log('Electron instalado: ' + binary);
  }
} catch (error) { fail(error.message + '. Execute npm ci apos autorizar scripts de instalacao do Electron.'); }
