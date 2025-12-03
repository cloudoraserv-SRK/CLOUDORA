export let i18n = {};
export let currentLang = "en";

// Load language file
export async function loadLanguage(lang = "en") {
  currentLang = lang;

  try {
    const res = await fetch(`/i18n/${lang}.json`);
    i18n = await res.json();
  } catch (e) {
    console.error("Error loading language", e);
    i18n = {};
  }

  applyTranslations(); // update UI live
}

// Translation function
export function t(keyPath) {
  try {
    return keyPath.split('.').reduce((obj, key) => obj[key], i18n);
  } catch {
    return keyPath; // fallback
  }
}

// Replace UI text dynamically
function applyTranslations() {
  // Tap to say
  const tapBtn = document.getElementById("tapToSay");
  if (tapBtn) tapBtn.textContent = t("ui.tap_to_say");

  // Input Placeholder
  const input = document.getElementById("userText");
  if (input) input.placeholder = t("ui.type_placeholder");

  // Option buttons
  document.querySelector(".gold-cloud").textContent = t("ui.grow_business");
  document.querySelector(".treasure").textContent = t("ui.get_website");

  // Footer
  document.querySelector(".site-footer a:nth-child(1)").textContent = t("ui.login");
  document.querySelector(".site-footer a:nth-child(2)").textContent = t("ui.apply");
}
