import { readStorage, writeStorage } from "./navigation.js";
import { DEFAULT_AUDIO } from "./settings.js";
export let microphoneEnabled;
export let microphoneVolume;
export let microphoneVolumeValue;
export let outputVolume;
export let outputVolumeValue;
export let testMicrophone;
export let microphoneStatus;
export function getAudio() {
  return readStorage("nightcallAudio", DEFAULT_AUDIO);
}
export function loadAudio() {
  if (!microphoneEnabled || !microphoneVolume || !outputVolume) {
    return;
  }
  const audio = getAudio();
  microphoneEnabled.checked = audio.microphoneEnabled;
  microphoneVolume.value = audio.microphoneVolume;
  outputVolume.value = audio.outputVolume;
  updateVolumeLabels();
}
export function saveAudio() {
  if (!microphoneEnabled || !microphoneVolume || !outputVolume) {
    return;
  }
  writeStorage("nightcallAudio", {
    microphoneEnabled: microphoneEnabled.checked,
    microphoneVolume: Number(microphoneVolume.value),
    outputVolume: Number(outputVolume.value),
  });
}
export function updateVolumeLabels() {
  if (microphoneVolumeValue && microphoneVolume) {
    microphoneVolumeValue.textContent = microphoneVolume.value + "%";
  }
  if (outputVolumeValue && outputVolume) {
    outputVolumeValue.textContent = outputVolume.value + "%";
  }
}
export function initializeAudio() {
  microphoneEnabled = document.getElementById("microphoneEnabled");
  microphoneVolume = document.getElementById("microphoneVolume");
  microphoneVolumeValue = document.getElementById("microphoneVolumeValue");
  outputVolume = document.getElementById("outputVolume");
  outputVolumeValue = document.getElementById("outputVolumeValue");
  testMicrophone = document.getElementById("testMicrophone");
  microphoneStatus = document.getElementById("microphoneStatus");
  if (microphoneEnabled) {
    microphoneEnabled.addEventListener("change", saveAudio);
  }
  if (microphoneVolume) {
    microphoneVolume.addEventListener("input", function () {
      updateVolumeLabels();
      saveAudio();
    });
  }
  if (outputVolume) {
    outputVolume.addEventListener("input", function () {
      updateVolumeLabels();
      saveAudio();
    });
  }
  if (testMicrophone) {
    testMicrophone.addEventListener("click", async function () {
      if (microphoneStatus) {
        microphoneStatus.textContent = "Solicitando acesso ao microfone...";
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (microphoneStatus) {
          microphoneStatus.textContent =
            "Seu navegador não permite acessar o microfone.";
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
        if (microphoneStatus) {
          microphoneStatus.textContent = "Microfone funcionando corretamente ✓";
        }
        if (microphoneEnabled) {
          microphoneEnabled.checked = true;
        }
        saveAudio();
      } catch (error) {
        console.error(error);
        if (microphoneStatus) {
          microphoneStatus.textContent =
            "Permissão do microfone negada ou indisponível.";
        }
      }
    });
  }
}
