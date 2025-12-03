export function speak(text, lang="en"){
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" ? "hi-IN" : "en-US";
    speechSynthesis.speak(u);
}

