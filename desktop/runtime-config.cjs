const fs=require('node:fs');
const path=require('node:path');
const {normalizeRemoteUrl}=require('./remote-config.cjs');
function readRemoteConfig(dataDir, env=process.env) {
  const file=path.join(dataDir,'server-config.json');
  let stored={};
  if(fs.existsSync(file)) {
    try {stored=JSON.parse(fs.readFileSync(file,'utf8'));}
    catch(error) {throw Error('Configuração inválida em '+file+': '+error.message);}
    if(!stored || typeof stored!=='object' || Array.isArray(stored)) throw Error('Formato inválido em '+file);
  }
  const remote=normalizeRemoteUrl(env.NIGHTCALL_SERVER_URL || stored.serverUrl || '');
  return {remote,configFile:file,mode:remote?'remote':'local'};
}
function saveRemoteConfig(dataDir, value) {
  const remote=normalizeRemoteUrl(value);
  fs.mkdirSync(dataDir,{recursive:true});
  const file=path.join(dataDir,'server-config.json');
  const temp=file+'.tmp-'+process.pid;
  try {
    fs.writeFileSync(temp,JSON.stringify({serverUrl:remote},null,2)+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});
    fs.renameSync(temp,file);
  } finally {try {fs.unlinkSync(temp);} catch {}}
  return remote;
}
module.exports={readRemoteConfig,saveRemoteConfig};
