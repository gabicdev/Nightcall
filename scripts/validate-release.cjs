const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const dir=path.resolve(process.argv[2]||'release');
if(!fs.existsSync(dir))throw Error('Pasta release ausente');
const files=fs.readdirSync(dir).filter(f=>f.toLowerCase().endsWith('.exe'));
if (files.some(f=>f.includes('/') || f.includes('\\'))) throw Error('Nome inesperado');
const nsis=files.filter(f=>/nsis|setup/i.test(f));
const portable=files.filter(f=>/portable/i.test(f));
if(nsis.length!==1||portable.length!==1)throw Error('Instalador NSIS ou portátil não encontrado em release: '+files.join(', '));
const version=require('../package.json').version;
const metadata=fs.readFileSync(path.join(dir,'latest.yml'),'utf8');
const installer=fs.readFileSync(path.join(dir,nsis[0]));
const sha512=crypto.createHash('sha512').update(installer).digest('base64');
if(!metadata.includes('version: '+version+'\n')||!metadata.includes(nsis[0])||!metadata.includes(sha512))throw Error('latest.yml não corresponde à versão e ao instalador.');
if(!fs.statSync(path.join(dir,nsis[0]+'.blockmap')).size)throw Error('Blockmap do instalador ausente ou vazio.');
const manifest=[];
for(const file of files){ const size=fs.statSync(path.join(dir,file)).size; if(size<10_000_000) throw Error('EXE suspeito/incompleto: '+file+' ('+size+' bytes)'); console.log(file,size+' bytes'); manifest.push({file,bytes:size,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex')}); }
console.log('Artefatos Windows encontrados. Instalação e abertura ainda exigem teste no Windows.');

fs.writeFileSync(path.join(dir,'SHA256SUMS.json'),JSON.stringify({createdAt:new Date().toISOString(),files:manifest},null,2)+'\n');
