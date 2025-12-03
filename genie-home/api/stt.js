// simple STT wrapper — export listen
export async function listen(){
  return new Promise((resolve, reject) => {
    // use Web Speech Recognition if available (webkit)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return resolve("");
    }
    const rec = new SpeechRecognition();
    rec.lang = document.getElementById("languageSelect")?.value || navigator.language || "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      resolve(t);
    };
    rec.onerror = (err) => {
      console.error("STT error", err);
      resolve("");
    };
    rec.start();
  });
}
