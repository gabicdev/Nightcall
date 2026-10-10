// Valida o destino remoto antes de abrir a janela Electron.
function normalizeRemoteUrl(raw) {
  if(raw == null || String(raw).trim() === '') return '';
  const value=String(raw).trim();
  let url;
  try {url=new URL(value);} catch {throw Error('Servidor remoto: URL inválida.');}
  if(url.protocol!=='https:' || !url.hostname || url.username || url.password ||
     url.pathname!=='/' || url.search || url.hash) {
    throw Error('Servidor remoto deve ser uma origem HTTPS sem credenciais, caminho ou parâmetros.');
  }
  return url.origin;
}
module.exports={normalizeRemoteUrl};
