// Diagnosticador opcional do processo atual; nao e uma medicao de FPS.
import {performance} from 'node:perf_hooks';
const samples=[];
const start=performance.now();
let prev=process.cpuUsage();
for(let i=0;i<5;i++){
 await new Promise(resolve=>setTimeout(resolve,200));
 const diff=process.cpuUsage(prev);prev=process.cpuUsage();
 const m=process.memoryUsage();
 samples.push({second:Number(((performance.now()-start)/1000).toFixed(2)),heapMB:Number((m.heapUsed/1048576).toFixed(1)),rssMB:Number((m.rss/1048576).toFixed(1)),cpuMs:Number(((diff.user+diff.system)/1000).toFixed(1))});
}
console.log(JSON.stringify({scope:'node-diagnostic-process-only',samples},null,2));
