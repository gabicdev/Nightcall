import {randomUUID} from 'node:crypto';
const error=(message,status=400)=>Object.assign(Error(message),{status});
export const MAX_MEDIA=8*1024*1024;
export function decodeUpload(input){
  const {name,type,data,purpose='chat'}=input;
  if(typeof name!=='string'||!name.trim()||name.length>160||typeof data!=='string'||!['chat','profile','sticker'].includes(purpose))throw error('Arquivo inválido.');
  if(data.length>Math.ceil(MAX_MEDIA/3)*4)throw error('O limite por arquivo é 8 MB.',413);
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(data)||data.length%4!==0)throw error('Arquivo inválido.');
  const bytes=Buffer.from(data,'base64');if(!bytes.length||bytes.length>MAX_MEDIA)throw error('O limite por arquivo é 8 MB.',413);
  const head=bytes.subarray(0,16),ascii=head.toString('latin1');
  const formats={
    'image/png':head.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    'image/jpeg':head[0]===255&&head[1]===216&&head[2]===255,
    'image/gif':/^GIF8[79]a/.test(ascii),
    'image/webp':ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WEBP',
    'video/mp4':ascii.slice(4,8)==='ftyp',
    'video/webm':head.subarray(0,4).equals(Buffer.from([26,69,223,163])),
    'audio/webm':head.subarray(0,4).equals(Buffer.from([26,69,223,163])),
    'audio/ogg':ascii.startsWith('OggS'),
    'audio/mpeg':ascii.startsWith('ID3')||(head[0]===255&&(head[1]&224)===224),
    'audio/wav':ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WAVE'
  };
  if(!formats[type]||(['profile','sticker'].includes(purpose)&&!type.startsWith('image/')))throw error('Use PNG, JPG, GIF ou WebP para imagens; MP4/WebM para vídeo; MP3, OGG, WAV ou WebM para áudio.',415);
  return {id:randomUUID(),name:name.replace(/[\r\n\x00-\x1f]/g,'').trim(),type,data:bytes,purpose,size:bytes.length};
}
export function publicMedia(row){return {id:row.id,name:row.name,type:row.type,purpose:row.purpose,size:row.data?.length??row.size,url:'/api/media/'+row.id};}
export function messageMedia(db,owner,input=[]){
  if(!Array.isArray(input)||input.length>4)throw error('Envie no máximo 4 arquivos por mensagem.');
  return input.map(id=>{if(typeof id!=='string')throw error('Anexo inválido.');const row=db.prepare('SELECT * FROM media WHERE id=? AND owner_id=?').get(id,owner);if(!row||row.purpose==='profile')throw error('Anexo indisponível.',403);return publicMedia(row);});
}
