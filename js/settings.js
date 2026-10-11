export let DEFAULT_PROFILE;
export let DEFAULT_AUDIO;
export let DEFAULT_NOTIFICATIONS;
export let DEFAULT_PRIVACY;
export let settingsNavItems;
export let settingsSections;
export let sectionInformation;
export let sectionLabel;
export let sectionTitle;
export let sectionDescription;
export function openSection(sectionName) {
  if (!settingsSections[sectionName]) {
    return;
  }
  settingsNavItems.forEach(function (item) {
    item.classList.toggle("active", item.dataset.section === sectionName);
  });
  Object.values(settingsSections).forEach(function (section) {
    if (section) {
      section.classList.remove("active");
    }
  });
  settingsSections[sectionName].classList.add("active");
  const info = sectionInformation[sectionName];
  if (sectionLabel) {
    sectionLabel.textContent = info.label;
  }
  if (sectionTitle) {
    sectionTitle.textContent = info.title;
  }
  if (sectionDescription) {
    sectionDescription.textContent = info.description;
  }
  localStorage.setItem("nightcallLastSettingsSection", sectionName);
}
export function initializeSettings() {
  DEFAULT_PROFILE = {
    name: "Usuário",
    username: "usuario",
    bio: "",
    avatar: "",
  };
  DEFAULT_AUDIO = {
    microphoneEnabled: false,
    microphoneVolume: 100,
    outputVolume: 100,
  };
  DEFAULT_NOTIFICATIONS = {
    messages: true,
    friends: true,
    calls: true,
  };
  DEFAULT_PRIVACY = {
    messagePrivacy: "friends",
    friendPrivacy: "everyone",
    onlineStatus: true,
  };
  settingsNavItems = document.querySelectorAll(".settings-nav-item");
  settingsSections = {
    overview: document.getElementById("overviewSection"),
    profile: document.getElementById("profileSection"),
    audio: document.getElementById("audioSection"),
    appearance: document.getElementById("appearanceSection"),
    notifications: document.getElementById("notificationsSection"),
    privacy: document.getElementById("privacySection"),
  };
  sectionInformation = {
    overview: {label:"APLICATIVO",title:"Configurações",description:"Preferências, privacidade e sua conta."},
    profile: {
      label: "PERFIL",
      title: "Perfil",
      description: "Personalize as informações que aparecem no seu perfil.",
    },
    audio: {
      label: "ÁUDIO",
      title: "Voz e vídeo",
      description: "Configure seu microfone e a saída de áudio.",
    },
    appearance: {
      label: "APARÊNCIA",
      title: "Aparência",
      description: "Escolha como o Nightcall deve aparecer.",
    },
    notifications: {
      label: "NOTIFICAÇÕES",
      title: "Notificações",
      description: "Controle quais avisos você deseja receber.",
    },
    privacy: {
      label: "PRIVACIDADE",
      title: "Privacidade",
      description: "Controle quem poderá interagir com você.",
    },
  };
  document.querySelectorAll('[data-settings-open]').forEach(button=>button.addEventListener('click',()=>openSection(button.dataset.settingsOpen)));
  document.querySelector('.settings-search input')?.addEventListener('input',event=>{const query=event.target.value.trim().toLocaleLowerCase('pt-BR');settingsNavItems.forEach(item=>{item.hidden=!item.textContent.toLocaleLowerCase('pt-BR').includes(query);});});
  sectionLabel = document.getElementById("sectionLabel");
  sectionTitle = document.getElementById("sectionTitle");
  sectionDescription = document.getElementById("sectionDescription");
  settingsNavItems.forEach(function (item) {
    item.addEventListener("click", function () {
      openSection(item.dataset.section);
    });
  });
}
