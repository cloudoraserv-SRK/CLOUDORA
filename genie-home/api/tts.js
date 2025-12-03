// simple TTS wrapper — export speak
export async function speak(text){
  if(!text) return;
  // use Web Speech API if available
  if(window.speechSynthesis){
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = document.getElementById("languageSelect")?.value || navigator.language;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
  } else {
    // fallback: return as resolved promise
    console.warn("No speechSynthesis available");
  }
}
