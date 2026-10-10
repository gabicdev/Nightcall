import { authenticate } from "./auth.js";
import { initializeNavigation } from "./navigation.js";
import { initializeFriends } from "./friends.js";
import { initializeMessages } from "./messages.js";
import { initializeSettings } from "./settings.js";
import { initializeProfile } from "./profile.js";
import { initializeAudio } from "./audio.js";
import { initializePreferences } from "./preferences.js";

await authenticate();

// A ordem preserva a inicialização do arquivo original; eventos são registrados uma vez.
initializeNavigation();
initializeFriends();
initializeMessages();
initializeSettings();
initializeProfile();
initializeAudio();
initializePreferences();

document.dispatchEvent(new CustomEvent("nightcallProfileSaved"));
