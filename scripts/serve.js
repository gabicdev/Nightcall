import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.env.NIGHTCALL_STATIC_ROOT||'.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
// Servidor de desenvolvimento estático. Não implementa contas, API ou chamadas.
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+sep)||!types[extname(file)]){res.writeHead(404);res.end();return;}
    const content=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)],'Cache-Control':'no-store'});res.end(content);
  }catch{res.writeHead(404);res.end();}
});
server.listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('http://127.0.0.1:'+server.address().port));
