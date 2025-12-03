export function createRecognizer(lang="en-IN"){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR) return null;
    const r = new SR();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 1;
    return r;
}

