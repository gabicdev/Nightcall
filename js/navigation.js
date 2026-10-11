import { renderFriends } from "./friends.js";
import { renderConversations } from "./messages.js";
import { openSection } from "./settings.js";
export let sidebarLinks;
export let navButtons;
export let profileButtons;
export let homePage;
export let friendsPage;
export let messagesPage;
export let addMessageButton;
export let currentUser;
export let friends;
export let friendRequests;
export let conversations;
export let appState;
export function readStorage(key, fallback) {
  try {
    const profile = JSON.parse(localStorage.getItem("nightcallProfile") || "null");
    const scoped = ["nightcallNotifications", "nightcallPrivacy", "nightcallAudio"].includes(key) && profile?.id;
    const saved = localStorage.getItem(scoped ? `${key}:${profile.id}` : key);
    if (!saved) {
      return fallback;
    }
    const parsed = JSON.parse(saved);
    if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) {
      return {
        ...fallback,
        ...parsed,
      };
    }
    return parsed;
  } catch (error) {
    console.warn("Erro ao ler localStorage:", error);
    return fallback;
  }
}
export function writeStorage(key, value) {
  try {
    const profile = JSON.parse(localStorage.getItem("nightcallProfile") || "null");
    const scoped = ["nightcallNotifications", "nightcallPrivacy", "nightcallAudio"].includes(key) && profile?.id;
    localStorage.setItem(scoped ? `${key}:${profile.id}` : key, JSON.stringify(value));
  } catch (error) {
    console.warn("Erro ao salvar localStorage:", error);
  }
}
export function loadCurrentUser() {
  const saved = readStorage("nightcallProfile", null);
  if (saved) {
    currentUser = {
      name: saved.name || "Usuário",
      username: "@" + String(saved.username || "usuario").replace(/^@/, ""),
      avatar: saved.avatar || "",
    };
  }
  const myName = document.getElementById("myName");
  const myUsername = document.getElementById("myUsername");
  const myAvatar = document.getElementById("myAvatar");
  if (myName) {
    myName.textContent = currentUser.name;
  }
  if (myUsername) {
    myUsername.textContent = currentUser.username;
  }
  const fallbackAvatar = document.getElementById("myAvatarFallback");
  const communityAccountName=document.getElementById('communityAccountName');
  if(communityAccountName)communityAccountName.textContent=currentUser.name;
  const communityAccountAvatar=document.getElementById('communityAccountAvatar');
  if(communityAccountAvatar)communityAccountAvatar.textContent=(currentUser.name||'N').trim().slice(0,1).toUpperCase();
  if (fallbackAvatar) fallbackAvatar.textContent = (currentUser.name || "N").trim().charAt(0).toUpperCase();
  if (myAvatar) {
    if (currentUser.avatar) {
      myAvatar.src = currentUser.avatar;
      myAvatar.hidden = false;
      myAvatar.style.display = "block";
      myAvatar.onerror = () => { myAvatar.hidden = true; myAvatar.style.display = "none"; };
    } else {
      myAvatar.removeAttribute("src");
      myAvatar.hidden = true;
      myAvatar.style.display = "none";
    }
  }
}
export function updateWelcomeMessage() {
  const welcomeMessage = document.getElementById("welcomeMessage");
  if (!welcomeMessage) {
    return;
  }
  const hour = new Date().getHours();
  let greeting = "Boa noite";
  if (hour >= 5 && hour < 12) {
    greeting = "Bom dia";
  } else if (hour >= 12 && hour < 18) {
    greeting = "Boa tarde";
  }
  if (!currentUser.name || currentUser.name === "Usuário") {
    welcomeMessage.textContent = `${greeting}.`;
  } else {
    welcomeMessage.textContent = `${greeting}, ${currentUser.name}.`;
  }
}
export function setCurrentPage(page) {
  appState.currentPage = page;
}
export function showPage(page) {
  document.dispatchEvent(new CustomEvent("nightcallWorkspace", {detail: page}));
  const pages = [homePage, friendsPage, messagesPage];
  pages.forEach(function (pageElement) {
    if (pageElement) {
      pageElement.classList.remove("active-page");
    }
  });
  if (page === "home" && homePage) {
    homePage.classList.add("active-page");
  }
  if (page === "friends" && friendsPage) {
    friendsPage.classList.add("active-page");
  }
  if (page === "messages" && messagesPage) {
    messagesPage.classList.add("active-page");
  }
  setCurrentPage(page);
  updateActiveNavigation();
}
export function activateSidebarItem(section) {
  sidebarLinks.forEach(function (link) {
    const text = link.querySelector("span:last-child")?.textContent.trim();
    link.classList.toggle("active", text === section);
  });
}
export function showHome() {
  showPage("home");
  activateSidebarItem("Início");
}
export function showFriends() {
  showPage("friends");
  activateSidebarItem("Amigos");
  renderFriends();
}
export function showMessages() {
  showPage("messages");
  activateSidebarItem('Mensagens');
  renderConversations();
}
export function updateActiveNavigation() {
  navButtons.forEach(function (button) {
    button.classList.remove("active");
  });
  if (appState.currentPage === "home") {
    document
      .querySelector('.nav-button[title="Início"]')
      ?.classList.add("active");
  }
  if (appState.currentPage === "messages") {
    document
      .querySelector('.nav-button[title="Mensagens"]')
      ?.classList.add("active");
  }
}
export function openAddMenu() {
  document.dispatchEvent(new CustomEvent("nightcallCommunityAdd"));
}
export function toggleMicrophone() {
  appState.microphoneEnabled = !appState.microphoneEnabled;
  console.log(
    appState.microphoneEnabled ? "Microfone ativado." : "Microfone desativado.",
  );
}
export function toggleHeadphones() {
  appState.headphonesEnabled = !appState.headphonesEnabled;
  console.log(
    appState.headphonesEnabled ? "Fones ativados." : "Fones desativados.",
  );
}
export function openSettings(section = "overview") {
  const overlay = document.getElementById("settingsOverlay");
  if (!overlay) {
    console.error("settingsOverlay não encontrado no HTML.");
    return;
  }
  document.getElementById("ownProfile")?.close();
  overlay.hidden = false;
  overlay.classList.add("open");
  updateSettingsMiniProfile();
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("settings-open");
  if (typeof openSection === "function") {
    openSection(section);
  }
}
export function closeSettings() {
  const overlay = document.getElementById("settingsOverlay");
  if (!overlay) {
    return;
  }
  overlay.classList.remove("open");
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("settings-open");
}
export let closeSettingsButton;
export function updateSettingsMiniProfile() {
  const miniName = document.getElementById("settingsMiniName");
  const miniAvatar = document.getElementById("settingsMiniAvatar");
  if (miniName) {
    miniName.textContent = currentUser.name || "Usuário";
  }
  if (!miniAvatar) {
    return;
  }
  miniAvatar.innerHTML = "";
  if (currentUser.avatar) {
    const image = document.createElement("img");
    image.src = currentUser.avatar;
    image.alt = "";
    miniAvatar.appendChild(image);
  } else {
    miniAvatar.textContent = String(currentUser.name || "N").trim().slice(0, 1).toUpperCase();
  }
}
export function updateOnlineCount() {
  const onlineCount = document.getElementById("onlineCount");
  if (!onlineCount) {
    return;
  }
  const total = appState.onlineUsers.length;
  if (total === 0) {
    onlineCount.textContent = "0 pessoas online";
  } else if (total === 1) {
    onlineCount.textContent = "1 pessoa online";
  } else {
    onlineCount.textContent = `${total} pessoas online`;
  }
}
export function initializeNavigation() {
  sidebarLinks = document.querySelectorAll(".sidebar-link");
  navButtons = document.querySelectorAll(".nav-button");
  profileButtons = document.querySelectorAll(".profile-actions button");
  homePage = document.getElementById("homePage");
  friendsPage = document.getElementById("friendsPage");
  messagesPage = document.getElementById("messagesPage");
  addMessageButton = document.querySelector(".add-message");
  currentUser = {
    name: "Usuário",
    username: "@usuario",
    avatar: "",
  };
  friends = [];
  friendRequests = [];
  conversations = [];
  appState = {
    currentPage: "home",
    microphoneEnabled: false,
    headphonesEnabled: false,
    onlineUsers: [],
  };
  sidebarLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const section = link.querySelector("span:last-child")?.textContent.trim();
      if (section === "Início") {
        showHome();
      }
      if (section === "Amigos") {
        showFriends();
      }
    });
  });
  navButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      if (button.classList.contains("add-button")) {
        openAddMenu();
        return;
      }
      if (button.title === "Início") {
        showHome();
        return;
      }
      if (button.title === "Mensagens") {
        showMessages();
      }
    });
  });
  document.getElementById("settingsButton")?.addEventListener("click", (event) => { event.stopPropagation(); openSettings("overview"); });
  const openOwnProfile = () => {
    closeSettings();
    const profile = readStorage('nightcallProfile', {});
    for (const [id, value] of [['ownProfileName', profile.name], ['ownProfileUsername', '@' + profile.username], ['ownProfileBio', profile.bio || 'Nenhuma bio adicionada.']]) document.getElementById(id).textContent = value || '';
    for (const [id, value] of [['ownProfileAvatar', profile.avatar], ['ownProfileBanner', profile.banner]]) {
      const img = document.getElementById(id); img.hidden = !value;
      if (value) img.src = value; else img.removeAttribute('src');
      img.onerror = () => { img.hidden = true; };
    }
    document.getElementById('ownProfileFallback').textContent = (profile.name || 'N').trim().slice(0,1).toUpperCase();
    document.getElementById('ownProfile').showModal();
  };
  document.getElementById('ownProfileButton')?.addEventListener('click', openOwnProfile);
  document.querySelector('[data-mobile-open="profile"]')?.addEventListener('click',openOwnProfile);
  document.getElementById('communityOwnProfile')?.addEventListener('click',openOwnProfile);
  document.getElementById('communityAccountSettings')?.addEventListener('click',()=>openSettings('overview'));
  document.querySelector('[data-mobile-open="settings"]')?.addEventListener('click',()=>openSettings('overview'));
  document.querySelector('[data-mobile-open="friends"]')?.addEventListener('click',showFriends);
  document.getElementById('ownProfileClose').addEventListener('click', () => document.getElementById('ownProfile').close());
  document.getElementById('ownProfileEdit').addEventListener('click', () => openSettings('profile'));
  document.querySelectorAll('[data-quick-open="friends"]').forEach((button) => button.addEventListener('click', () => showFriends()));
  document.querySelectorAll('[data-quick-open="messages"]').forEach((button) => button.addEventListener('click', () => showMessages()));
  document.querySelector(".add-message")?.addEventListener("click", () => showFriends());
  document.getElementById("settingsOverlay")?.addEventListener("click", (event) => {
    if (event.target.id === "settingsOverlay") closeSettings();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (document.querySelector('dialog[open]')) return;
      closeSettings();
      const community = document.getElementById("communityRoot");
      if (community && !community.hidden) document.getElementById("communityClose")?.click();
    }
  });
  closeSettingsButton = document.getElementById("closeSettingsButton");
  if (closeSettingsButton) {
    closeSettingsButton.addEventListener("click", closeSettings);
  }
  document.addEventListener("nightcallProfileSaved", function () {
    loadCurrentUser();
    updateWelcomeMessage();
    updateSettingsMiniProfile();
  });
}
