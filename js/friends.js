import { api } from "./api.js";
import { currentUser, friendRequests, friends } from "./navigation.js";
import { openConversation } from "./messages.js";
export let friendsList;
export let friendsEmpty;
export let friendsTotal;
export let friendsListTitle;
export let friendSearch;
export let addFriendButton;
export let emptyAddFriend;
export let friendsTabs;
export let requestCount;
export let currentFriendsTab;
export function renderFriends() {
  if (!friendsList) {
    return;
  }
  friendsList.innerHTML = "";
  let filteredFriends = [...friends];
  if (currentFriendsTab === "online") {
    filteredFriends = filteredFriends.filter(function (friend) {
      return friend.online === true;
    });
  }
  if (currentFriendsTab === "pending") {
    filteredFriends = [...friendRequests];
  }
  const search = friendSearch?.value.trim().toLowerCase();
  if (search) {
    filteredFriends = filteredFriends.filter(function (friend) {
      const name = String(friend.name || "").toLowerCase();
      const username = String(friend.username || "").toLowerCase();
      return name.includes(search) || username.includes(search);
    });
  }
  if (friendsTotal) {
    const total = filteredFriends.length;
    friendsTotal.textContent = total === 1 ? "1 amigo" : `${total} amigos`;
  }
  if (filteredFriends.length === 0) {
    friendsEmpty?.classList.add("visible");
    return;
  }
  friendsEmpty?.classList.remove("visible");
  filteredFriends.forEach(function (friend) {
    friendsList.appendChild(createFriendCard(friend));
  });
}
export function createFriendCard(friend) {
  const card = document.createElement("article");
  card.className = "friend-card";
  const avatar = document.createElement("div");
  avatar.className = "friend-avatar";
  if (friend.avatar) {
    const image = document.createElement("img");
    image.src = friend.avatar;
    image.alt = "Foto de " + (friend.name || "usuário");
    avatar.appendChild(image);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "friend-avatar-placeholder";
    placeholder.textContent = "👤";
    avatar.appendChild(placeholder);
  }
  const status = document.createElement("span");
  status.className = "friend-status";
  if (friend.online) {
    status.classList.add("online");
  }
  avatar.appendChild(status);
  const info = document.createElement("div");
  info.className = "friend-info";
  const name = document.createElement("strong");
  name.className = "friend-name";
  name.textContent = friend.name || "Usuário";
  const username = document.createElement("span");
  username.className = "friend-username";
  username.textContent = friend.username || "@usuario";
  info.appendChild(name);
  info.appendChild(username);
  const actions = document.createElement("div");
  actions.className = "friend-actions";
  const message = document.createElement("button");
  message.type = "button";
  message.className = "friend-action";
  message.title = "Enviar mensagem";
  message.textContent = "💬";
  message.addEventListener("click", function () {
    openConversation(friend);
  });
  const more = document.createElement("button");
  more.type = "button";
  more.className = "friend-action";
  more.title = "Mais opções";
  more.textContent = "⋯";
  more.addEventListener("click", function () {
    openFriendOptions(friend);
  });
  if (currentFriendsTab === "pending") {
    message.textContent = "✓";
    message.title = "Aceitar";
    message.onclick = async () => { try { await api(`/api/friends/requests/${friend.id}/accept`, { method:"POST" }); await refreshFriends(); } catch(e) { alert(e.message); } };
    more.textContent = "✕";
    more.title = "Recusar";
    more.onclick = async () => { try { await api(`/api/friends/requests/${friend.id}/reject`, { method:"POST" }); await refreshFriends(); } catch(e) { alert(e.message); } };
  }
  actions.appendChild(message);
  actions.appendChild(more);
  card.appendChild(avatar);
  card.appendChild(info);
  card.appendChild(actions);
  return card;
}
export function openFriendOptions(friend) {
  if (!confirm(`Remover ${friend.name} dos amigos?`)) return;
  api(`/api/friends/${friend.id}`, { method:"DELETE" }).then(refreshFriends).catch(e=>alert(e.message));
}
export function updateFriendRequestCount() {
  if (!requestCount) {
    return;
  }
  const total = friendRequests.length;
  requestCount.textContent = total;
  requestCount.style.display = total > 0 ? "inline-flex" : "none";
}
let selectedUser = null;
export async function refreshFriends() {
  try {
    const { friends: list, incoming } = await api("/api/friends");
    friends.splice(0, friends.length, ...list);
    friendRequests.splice(0, friendRequests.length, ...incoming);
    renderFriends(); updateFriendRequestCount();
  } catch(e) { console.warn("Falha ao atualizar amigos",e); }
}
export let addFriendModal;
export let addFriendUsername;
export let addFriendError;
export let addFriendResult;
export let resultUserName;
export let resultUserUsername;
export let sendFriendRequest;
export let searchFriendButton;
export let closeAddFriendModal;
export let cancelAddFriend;
export function openAddFriend() {
  if (!addFriendModal) {
    return;
  }
  addFriendModal.classList.add("open");
  addFriendModal.setAttribute("aria-hidden", "false");
  clearAddFriendModal();
  setTimeout(function () {
    if (addFriendUsername) {
      addFriendUsername.focus();
    }
  }, 100);
}
export function closeAddFriend() {
  if (!addFriendModal) {
    return;
  }
  addFriendModal.classList.remove("open");
  addFriendModal.setAttribute("aria-hidden", "true");
  clearAddFriendModal();
}
export function clearAddFriendModal() {
  if (addFriendUsername) {
    addFriendUsername.value = "";
  }
  if (addFriendError) {
    addFriendError.textContent = "";
  }
  if (addFriendResult) {
    addFriendResult.classList.remove("visible");
  }
  selectedUser = null;
  if (sendFriendRequest) {
    sendFriendRequest.disabled = false;
    sendFriendRequest.textContent = "Adicionar";
  }
}
export function normalizeUsername(username) {
  let value = String(username || "").trim();
  if (value.startsWith("@")) {
    value = value.substring(1);
  }
  return value.toLowerCase();
}
export async function searchUser() {
  const username = normalizeUsername(addFriendUsername?.value);
  if (!username) {
    showAddFriendError("Digite um nome de usuário.");
    hideFriendResult();
    return;
  }
  const currentUsername = normalizeUsername(currentUser.username);
  if (username === currentUsername) {
    showAddFriendError("Você não pode adicionar você mesmo.");
    hideFriendResult();
    return;
  }
  let foundUser;
  try { ({user:foundUser} = await api(`/api/users/search?username=${encodeURIComponent(username)}`)); }
  catch(e) { showAddFriendError(e.message); hideFriendResult(); return; }
  if (!foundUser) {
    showAddFriendError("Usuário não encontrado.");
    hideFriendResult();
    return;
  }
  selectedUser = foundUser;
  showFriendResult(foundUser);
}
export function findUserByUsername(username) {
  const normalized = normalizeUsername(username);
  const allUsers = [...friends, ...friendRequests];
  return (
    allUsers.find(function (user) {
      return normalizeUsername(user.username) === normalized;
    }) || null
  );
}
export function showFriendResult(user) {
  if (!addFriendResult) {
    return;
  }
  if (resultUserName) {
    resultUserName.textContent = user.name || "Usuário";
  }
  if (resultUserUsername) {
    resultUserUsername.textContent = user.username || "@usuario";
  }
  addFriendResult.classList.add("visible");
  clearAddFriendError();
}
export function hideFriendResult() {
  if (addFriendResult) {
    addFriendResult.classList.remove("visible");
  }
}
export function showAddFriendError(message) {
  if (!addFriendError) {
    return;
  }
  addFriendError.textContent = message;
}
export function clearAddFriendError() {
  if (!addFriendError) {
    return;
  }
  addFriendError.textContent = "";
}
export function initializeFriends() {
  friendsList = document.getElementById("friendsList");
  friendsEmpty = document.getElementById("friendsEmpty");
  friendsTotal = document.getElementById("friendsTotal");
  friendsListTitle = document.getElementById("friendsListTitle");
  friendSearch = document.getElementById("friendSearch");
  addFriendButton = document.getElementById("addFriendButton");
  emptyAddFriend = document.getElementById("emptyAddFriend");
  friendsTabs = document.querySelectorAll(".friends-tab");
  requestCount = document.querySelector(".request-count");
  currentFriendsTab = "all";
  if (friendSearch) {
    friendSearch.addEventListener("input", renderFriends);
  }
  friendsTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      friendsTabs.forEach(function (item) {
        item.classList.remove("active");
      });
      tab.classList.add("active");
      currentFriendsTab = tab.dataset.tab;
      if (friendsListTitle) {
        if (currentFriendsTab === "all") {
          friendsListTitle.textContent = "Todos os amigos";
        } else if (currentFriendsTab === "online") {
          friendsListTitle.textContent = "Amigos online";
        } else {
          friendsListTitle.textContent = "Solicitações de amizade";
        }
      }
      renderFriends();
    });
  });
  if (addFriendButton) {
    addFriendButton.addEventListener("click", openAddFriend);
  }
  if (emptyAddFriend) {
    emptyAddFriend.addEventListener("click", openAddFriend);
  }
  addFriendModal = document.getElementById("addFriendModal");
  addFriendUsername = document.getElementById("addFriendUsername");
  addFriendError = document.getElementById("addFriendError");
  addFriendResult = document.getElementById("addFriendResult");
  resultUserName = document.getElementById("resultUserName");
  resultUserUsername = document.getElementById("resultUserUsername");
  sendFriendRequest = document.getElementById("sendFriendRequest");
  searchFriendButton = document.getElementById("searchFriendButton");
  closeAddFriendModal = document.getElementById("closeAddFriendModal");
  cancelAddFriend = document.getElementById("cancelAddFriend");
  if (closeAddFriendModal) {
    closeAddFriendModal.addEventListener("click", closeAddFriend);
  }
  if (cancelAddFriend) {
    cancelAddFriend.addEventListener("click", closeAddFriend);
  }
  if (addFriendModal) {
    addFriendModal.addEventListener("click", function (event) {
      if (event.target === addFriendModal) {
        closeAddFriend();
      }
    });
  }
  if (searchFriendButton) {
    searchFriendButton.addEventListener("click", searchUser);
  }
  refreshFriends();
  setInterval(refreshFriends, 12000);
  if (addFriendUsername) {
    addFriendUsername.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        searchUser();
      }
    });
  }
  if (sendFriendRequest) {
    sendFriendRequest.addEventListener("click", async function () {
      if (!selectedUser) return;
      sendFriendRequest.disabled = true;
      try {
        await api("/api/friends/request", {method:"POST", body:JSON.stringify({userId:selectedUser.id})});
        sendFriendRequest.textContent = "Enviado";
        await refreshFriends();
      } catch(e) { showAddFriendError(e.message); sendFriendRequest.disabled=false; }
    });
  }
}
