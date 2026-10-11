import { api } from "./api.js";
import { refreshFriends } from "./friends.js";
import {
  closeSettings,
  conversations,
  openSettings,
  setCurrentPage,
  showFriends,
  showHome,
  showMessages,
  updateOnlineCount,
} from "./navigation.js";
import { closeAddFriend, openAddFriend, renderFriends } from "./friends.js";
export let messageSearch;
export const getActivePerson=()=>activePerson;
export let conversationsList;
export let messagesEmpty;
export let newConversationButton;
export let emptyNewConversation;
let activePerson = null;
let currentUserId = null;
async function refreshConversations() {
  try { const data = await api("/api/conversations"); conversations.splice(0,conversations.length,...data.conversations); renderConversations(); }
  catch(e) { console.warn(e); }
}
async function refreshChat() {
  if (!activePerson) return;
  try {
    const {messages} = await api(`/api/messages/${activePerson.id}`);
    const history = document.getElementById("chatHistory");
    const signature = JSON.stringify(messages.map(m=>m.id+":"+m.content));
    if (history.dataset.signature === signature) return;
    history.dataset.signature=signature;
    history.replaceChildren();
    for (const msg of messages) {
      const el=document.createElement("div"); el.className="chat-message"+(msg.senderId===currentUserId?" mine":"");
      el.textContent=msg.content;
      if(msg.senderId===currentUserId){
        const del=document.createElement("button"); del.type="button"; del.className="message-delete";
        del.textContent="Excluir";del.title="Excluir minha mensagem";
        del.addEventListener("click",async()=>{
          try{await api(`/api/messages/own/${msg.id}`,{method:"DELETE"});await refreshChat();}
          catch(e){document.getElementById("chatStatus").textContent=e.message;}
        });el.appendChild(del);
      }
      history.appendChild(el);
    }
    history.scrollTop=history.scrollHeight;
  } catch(e) { document.getElementById("chatStatus").textContent=e.message; }
}
export function renderConversations() {
  if (!conversationsList) {
    return;
  }
  conversationsList.innerHTML = "";
  let filtered = [...conversations];
  const search = messageSearch?.value.trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(function (conversation) {
      const name = String(conversation.name || "").toLowerCase();
      const username = String(conversation.username || "").toLowerCase();
      return name.includes(search) || username.includes(search);
    });
  }
  if (filtered.length === 0) {
    messagesEmpty?.classList.add("visible");
    return;
  }
  messagesEmpty?.classList.remove("visible");
  filtered.forEach(function (conversation) {
    const card = document.createElement("article");
    card.className = "conversation-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Abrir conversa com " + (conversation.name || conversation.username || "usuário"));
    const name = document.createElement("strong");
    name.textContent = conversation.name || "Usuário";
    const username = document.createElement("span");
    username.textContent = conversation.username || "@usuario";
    const avatar = document.createElement("span");
    avatar.className="nc-conversation-avatar";
    avatar.textContent=String(conversation.name || conversation.username || "N").trim().slice(0,1).toUpperCase();
    card.appendChild(avatar);
    const identity=document.createElement("span");
    identity.className="nc-conversation-identity";
    identity.appendChild(name);
    identity.appendChild(username);
    card.appendChild(identity);
    card.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openConversation(conversation);}});
    card.addEventListener("click", function () {
      openConversation(conversation);
    });
    conversationsList.appendChild(card);
  });
}
export function openNewConversation() {
  showFriends();
  document.getElementById("addFriendButton")?.click();
}
export function openConversation(person = null) {
  showMessages();
  if (!person) {
    console.log("Abrindo nova conversa.");
    return;
  }
  activePerson = person;
  document.getElementById("chatPanel").hidden=false;
  document.getElementById("chatName").textContent=`${person.name} (@${person.username.replace(/^@/,"")})`;
  document.getElementById("chatStatus").textContent="";
  document.getElementById("chatHistory").dataset.signature="";
  refreshChat();
}
export function startCall(person = null) {
  if (person) {
    console.log("Iniciando chamada com " + (person.name || "Usuário"));
    return;
  }
  console.log("Iniciando chamada.");
}
export function initializeMessages() {
  messageSearch = document.getElementById("messageSearch");
  conversationsList = document.getElementById("conversationsList");
  messagesEmpty = document.getElementById("messagesEmpty");
  newConversationButton = document.getElementById("newConversationButton");
  emptyNewConversation = document.getElementById("emptyNewConversation");
  api("/api/auth/me").then(({user}) => {currentUserId=user.id;}).catch(console.warn);
  document.getElementById("chatClose").addEventListener("click",()=>{activePerson=null;document.getElementById("chatPanel").hidden=true;});
  document.getElementById("chatForm").addEventListener("submit",async event=>{
    event.preventDefault(); if(!activePerson)return;
    const input=document.getElementById("chatInput"); const content=input.value.trim();if(!content)return;
    try {await api(`/api/messages/${activePerson.id}`,{method:"POST",body:JSON.stringify({content})});input.value="";await refreshChat();await refreshConversations();}
    catch(e){document.getElementById("chatStatus").textContent=e.message;}
  });
  refreshConversations();
  // Eventos imediatos com reconexão automática; polling como fallback.
  if (typeof EventSource !== "undefined") {
    const stream = new EventSource("/api/events");
    stream.addEventListener("open",()=>{
      const el=document.getElementById("chatStatus");
      if(el?.textContent?.includes("Reconectando"))el.textContent="Conexão restabelecida.";
      refreshConversations();refreshChat();
    });
    stream.addEventListener("error",()=>{
      const el=document.getElementById("chatStatus");
      if(el)el.textContent="Reconectando aos eventos do Nightcall…";
    });
    window.addEventListener("beforeunload",()=>stream.close(),{once:true});
    stream.addEventListener("message",async event=>{
      refreshConversations();refreshChat();
      try{
        const payload=JSON.parse(event.data);
        if(document.hidden && payload?.from && payload.from!==currentUserId){
          await window.nightcallDesktop?.notify("Nightcall — nova mensagem","Você recebeu uma mensagem privada.");
        }
      }catch{}
    });
    stream.addEventListener("social",()=>{refreshFriends();refreshConversations();});
  }
  setInterval(()=>{refreshConversations();refreshChat();},15000);
  if (messageSearch) {
    messageSearch.addEventListener("input", renderConversations);
  }
  if (newConversationButton) {
    newConversationButton.addEventListener("click", openNewConversation);
  }
  if (emptyNewConversation) {
    emptyNewConversation.addEventListener("click", openNewConversation);
  }
  window.NightcallActivePerson=getActivePerson;
  window.Nightcall = {
    showHome,
    showFriends,
    showMessages,
    openConversation,
    startCall,
    openSettings,
    closeSettings,
    openAddFriend,
    closeAddFriend,
    updateOnlineCount,
    renderFriends,
    renderConversations,
    setCurrentPage,
  };
  console.log("Parte principal do Nightcall carregada.");
}
