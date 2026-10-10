// Diagnóstico do endpoint público sem expor credenciais, cookies ou tokens.
const input=process.argv[2] || 'http://127.0.0.1:3000';
const base=new URL(input);
if(!['http:','https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname!=='/') throw Error('Informe apenas a origem HTTP(S) do servidor');
const endpoint=new URL('/api/health',base);
const started=performance.now();
try {
 const res=await fetch(endpoint,{signal:AbortSignal.timeout(5000),redirect:'manual',headers:{accept:'application/json'}});
 const json=res.ok ? await res.json().catch(()=>null) : null;
 const reachable=res.status===200 && json?.status==='ok' && json?.service==='nightcall';
 console.log(JSON.stringify({origin:base.origin,status:res.status,latencyMs:Math.round(performance.now()-started),nightcall:reachable},null,2));
 if(!reachable)process.exitCode=1;
}catch(error){console.error(JSON.stringify({origin:base.origin,nightcall:false,error:error.name}));process.exitCode=1;}
