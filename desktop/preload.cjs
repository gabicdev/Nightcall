const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('nightcallDesktop',Object.freeze({
 notify:(title,body)=>ipcRenderer.invoke('nightcall:notify',{title,body}),
 open:()=>ipcRenderer.invoke('nightcall:open'),
 connectionInfo:()=>ipcRenderer.invoke('nightcall:connection-info')
}));
