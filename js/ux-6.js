/* Aperfeiçoamentos progressivos: não interceptar campos nem sobrescrever navegação existente. */
(() => {
  const label = (query,text) => document.querySelectorAll(query).forEach(el => {if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',text)});
  const setup = () => {
    label('.main-navigation a[title="Início"]','Abrir início');
    label('.main-navigation a[title="Mensagens"]','Abrir mensagens');
    label('#settingsButton','Abrir configurações');
    label('#logoutButton','Sair da conta');
    const app = document.querySelector('.app');
    if(app) app.setAttribute('aria-label','Nightcall');
  };
  if(document.readyState === 'loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
