// script.js — UI only, no logic inside

let genie = null;

window.addEventListener("DOMContentLoaded", () => {
  // Create Genie
  genie = new Genie();
  genie.start();

  const allowBtn = document.getElementById("allowBtn");
  const listenBtn = document.getElementById("listenBtn");
  const skipBtn = document.getElementById("skipBtn");
  const cloth = document.getElementById("cloth");
  const speechStatus = document.getElementById("speechStatus");
  const bgAudio = document.getElementById("bgAudio");

  // Allow Audio
  allowBtn.addEventListener("click", async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      genie.setMicAllowed(true);
      cloth.classList.add("hidden");
      speechStatus.textContent = "Microphone: active";

      // Background thunder plays only after user gesture
      bgAudio.play().catch(() => {});
    } catch (err) {
      alert("Microphone requires HTTPS or localhost. Demo mode only.");
    }
  });

  // Listen
  listenBtn.addEventListener("click", () => {
    genie.toggleListen();
  });

  // Skip
  skipBtn.addEventListener("click", () => {
    genie.skip();
  });

  console.log("Genie home initialized.");
});
