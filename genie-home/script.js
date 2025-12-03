import { Genie } from "./genie/genie-core.js";

const allowBtn = document.getElementById("allowBtn");
const listenBtn = document.getElementById("listenBtn");
const skipBtn = document.getElementById("skipBtn");
const langSelect = document.getElementById("langSelect");
const bgAudio = document.getElementById("bgAudio");

const genie = new Genie();

allowBtn.onclick = async () => {
    try {
        await navigator.mediaDevices.getUserMedia({ audio:true });
        document.getElementById("cloth").classList.add("hidden");
        genie.micAllowed = true;
        bgAudio.play();   // thunder sound
        document.getElementById("speechStatus").textContent = "Microphone: active";
    } catch {
        alert("Microphone requires HTTPS / localhost");
    }
};

listenBtn.onclick = () => genie.toggleListen();

skipBtn.onclick = () => genie.skip();

langSelect.onchange = (e) => genie.changeLanguage(e.target.value);

window.onload = () => genie.start();
