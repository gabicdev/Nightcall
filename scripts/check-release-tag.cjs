const {version}=require('../package.json');
const tag=process.env.RELEASE_TAG;
if(!/^v\d+\.\d+\.\d+$/.test(tag||'')||tag!=='v'+version){
  console.error('A tag precisa ser v'+version+', igual à versão do package.json.');process.exit(1);
}
console.log('Tag e versão conferidas: '+tag);
