// stt.js — Safe STT with fallback + no error crashes
export async function listen() {
  return new Promise((resolve) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // If STT is not supported at all
    if (!SpeechRecognition) {
      console.warn("Browser does not support SpeechRecognition.");
      return resolve("");
    }

    const rec = new SpeechRecognition();

    // Get selected language
    let lang = document.getElementById("languageSelect")?.value || "en";

    // STT supports only specific language codes → fallback to en-US when unsupported
    const supported = [
      "en-US", "en-IN", "en-GB",
      "hi-IN",
      "fr-FR", "de-DE",
      "es-ES", "it-IT", "pt-PT",
      "ja-JP", "ko-KR"
    ];

    // Convert simple code to full code
    const langMap = {
      "en": "en-US",
      "hi": "hi-IN",
      "pa": "en-US",  // fallback
      "gu": "en-US",
      "ra": "en-US",
      "kn": "en-US",
      "ta": "en-US"
    };

    lang = langMap[lang] || "en-US";

    // Final fallback if still unsupported
    if (!supported.includes(lang)) lang = "en-US";

    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      resolve(text);
    };

    rec.onerror = (err) => {
      console.warn("STT error, using fallback:", err);
      resolve(""); // No crash
    };

    rec.start();
  });
}
