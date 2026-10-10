import {
  readStorage,
  updateSettingsMiniProfile,
  writeStorage,
} from "./navigation.js";
import {
  DEFAULT_NOTIFICATIONS,
  DEFAULT_PRIVACY,
  openSection,
  settingsSections,
} from "./settings.js";
import { avatarPlaceholder, avatarPreview, loadProfile } from "./profile.js";
import { loadAudio } from "./audio.js";
export let messageNotifications;
export let friendNotifications;
export let callNotifications;
export function loadNotifications() {
  if (!messageNotifications || !friendNotifications || !callNotifications) {
    return;
  }
  const notifications = readStorage(
    "nightcallNotifications",
    DEFAULT_NOTIFICATIONS,
  );
  messageNotifications.checked = notifications.messages;
  friendNotifications.checked = notifications.friends;
  callNotifications.checked = notifications.calls;
}
export function saveNotifications() {
  if (!messageNotifications || !friendNotifications || !callNotifications) {
    return;
  }
  writeStorage("nightcallNotifications", {
    messages: messageNotifications.checked,
    friends: friendNotifications.checked,
    calls: callNotifications.checked,
  });
}
export let messagePrivacy;
export let friendPrivacy;
export let onlineStatus;
export let savePrivacy;
export function loadPrivacy() {
  if (!messagePrivacy || !friendPrivacy || !onlineStatus) {
    return;
  }
  const privacy = readStorage("nightcallPrivacy", DEFAULT_PRIVACY);
  messagePrivacy.value = privacy.messagePrivacy;
  friendPrivacy.value = privacy.friendPrivacy;
  onlineStatus.checked = privacy.onlineStatus;
}
export let toast;
export let toastTimer;
export function showToast(message) {
  if (!toast) {
    return;
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2200);
}
export let lastSection;
export function initializePreferences() {
  messageNotifications = document.getElementById("messageNotifications");
  friendNotifications = document.getElementById("friendNotifications");
  callNotifications = document.getElementById("callNotifications");
  if (messageNotifications) {
    messageNotifications.addEventListener("change", saveNotifications);
  }
  if (friendNotifications) {
    friendNotifications.addEventListener("change", saveNotifications);
  }
  if (callNotifications) {
    callNotifications.addEventListener("change", saveNotifications);
  }
  messagePrivacy = document.getElementById("messagePrivacy");
  friendPrivacy = document.getElementById("friendPrivacy");
  onlineStatus = document.getElementById("onlineStatus");
  savePrivacy = document.getElementById("savePrivacy");
  if (savePrivacy) {
    savePrivacy.addEventListener("click", function () {
      if (!messagePrivacy || !friendPrivacy || !onlineStatus) {
        return;
      }
      writeStorage("nightcallPrivacy", {
        messagePrivacy: messagePrivacy.value,
        friendPrivacy: friendPrivacy.value,
        onlineStatus: onlineStatus.checked,
      });
      showToast("Configurações de privacidade salvas ✓");
    });
  }
  toast = document.getElementById("toast");
  toastTimer = null;
  if (avatarPreview) {
    avatarPreview.addEventListener("error", function () {
      avatarPreview.classList.remove("visible");
      if (avatarPlaceholder) {
        avatarPlaceholder.style.display = "inline";
      }
    });
  }
  loadProfile();
  loadAudio();
  loadNotifications();
  loadPrivacy();
  lastSection = localStorage.getItem("nightcallLastSettingsSection");
  if (lastSection && settingsSections[lastSection]) {
    openSection(lastSection);
  } else {
    openSection("profile");
  }
  updateSettingsMiniProfile();
  console.log("Configurações carregadas.");
}
