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
export let conversationsList;
export let messagesEmpty;
export let newConversationButton;
export let emptyNewConversation;
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
    const name = document.createElement("strong");
    name.textContent = conversation.name || "Usuário";
    const username = document.createElement("span");
    username.textContent = conversation.username || "@usuario";
    card.appendChild(name);
    card.appendChild(username);
    card.addEventListener("click", function () {
      openConversation(conversation);
    });
    conversationsList.appendChild(card);
  });
}
export function openNewConversation() {
  showMessages();
}
export function openConversation(person = null) {
  showMessages();
  if (!person) {
    console.log("Abrindo nova conversa.");
    return;
  }
  console.log("Abrindo conversa com " + (person.name || "Usuário"));
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
  if (messageSearch) {
    messageSearch.addEventListener("input", renderConversations);
  }
  if (newConversationButton) {
    newConversationButton.addEventListener("click", openNewConversation);
  }
  if (emptyNewConversation) {
    emptyNewConversation.addEventListener("click", openNewConversation);
  }
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
