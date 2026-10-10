import { api } from "./api.js";
import { cacheProfile } from "./auth.js";
import { readStorage } from "./navigation.js";
import { DEFAULT_PROFILE } from "./settings.js";
import { showToast } from "./preferences.js";
export let profileName;
export let profileUsername;
export let profileBio;
export let profileAvatar;
export let previewName;
export let previewUsername;
export let previewBio;
export let avatarPreview;
export let avatarPlaceholder;
export let bioCount;
export let saveProfile;
export function getProfile() {
  return readStorage("nightcallProfile", DEFAULT_PROFILE);
}
export function updateProfilePreview() {
  if (!profileName || !profileUsername || !profileBio || !profileAvatar) {
    return;
  }
  const name = profileName.value.trim() || "Usuário";
  const username = profileUsername.value.trim().replace(/^@/, "") || "usuario";
  const bio = profileBio.value.trim();
  const avatar = profileAvatar.value.trim();
  if (previewName) {
    previewName.textContent = name;
  }
  if (previewUsername) {
    previewUsername.textContent = "@" + username;
  }
  if (previewBio) {
    previewBio.textContent = bio || "Nenhuma bio adicionada.";
  }
  if (avatar && avatarPreview) {
    avatarPreview.src = avatar;
    avatarPreview.classList.add("visible");
    if (avatarPlaceholder) {
      avatarPlaceholder.style.display = "none";
    }
  } else {
    if (avatarPreview) {
      avatarPreview.removeAttribute("src");
      avatarPreview.classList.remove("visible");
    }
    if (avatarPlaceholder) {
      avatarPlaceholder.style.display = "inline";
    }
  }
}
export function loadProfile() {
  if (!profileName || !profileUsername || !profileBio || !profileAvatar) {
    return;
  }
  const profile = getProfile();
  profileName.value = profile.name;
  profileUsername.value = profile.username;
  profileBio.value = profile.bio;
  profileAvatar.value = profile.avatar;
  updateBioCount();
  updateProfilePreview();
}
export async function saveProfileData() {
  if (!profileName || !profileUsername || !profileBio || !profileAvatar) {
    return;
  }
  const profile = {
    name: profileName.value.trim() || "Usuário",
    username: profileUsername.value.trim().replace(/^@/, "") || "usuario",
    bio: profileBio.value.trim(),
    avatar: profileAvatar.value.trim(),
  };
  saveProfile.disabled = true;
  try {
    const { user } = await api("/api/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
    cacheProfile(user);
  } catch (error) {
    showToast(error.message);
    return;
  } finally {
    saveProfile.disabled = false;
  }
  document.dispatchEvent(new CustomEvent("nightcallProfileSaved"));
  updateProfilePreview();
  showToast("Perfil salvo com sucesso ✓");
}
export function updateBioCount() {
  if (!profileBio || !bioCount) {
    return;
  }
  bioCount.textContent = profileBio.value.length;
}
export function initializeProfile() {
  profileName = document.getElementById("profileName");
  profileUsername = document.getElementById("profileUsername");
  profileBio = document.getElementById("profileBio");
  profileAvatar = document.getElementById("profileAvatar");
  previewName = document.getElementById("previewName");
  previewUsername = document.getElementById("previewUsername");
  previewBio = document.getElementById("previewBio");
  avatarPreview = document.getElementById("avatarPreview");
  avatarPlaceholder = document.getElementById("avatarPlaceholder");
  bioCount = document.getElementById("bioCount");
  saveProfile = document.getElementById("saveProfile");
  if (saveProfile) {
    saveProfile.addEventListener("click", saveProfileData);
  }
  if (profileName) {
    profileName.addEventListener("input", updateProfilePreview);
  }
  if (profileUsername) {
    profileUsername.addEventListener("input", updateProfilePreview);
  }
  if (profileBio) {
    profileBio.addEventListener("input", function () {
      updateBioCount();
      updateProfilePreview();
    });
  }
  if (profileAvatar) {
    profileAvatar.addEventListener("input", updateProfilePreview);
  }
}
