// Language names stay readable even when a browser does not offer speech synthesis.
export const englishLanguageNames = Object.freeze({
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam', kn: 'Kannada'
});

// Must be called directly from the user's click/change event (browser audio policy).
// Prefer a native voice; if unavailable, pronounce the name with an English voice.
export function announceSelectedLanguage(code, nativeName, locale, synthesis, Utterance) {
  const englishName = englishLanguageNames[code];
  if (!englishName || !synthesis || typeof Utterance !== 'function') return false;
  try {
    const voices = synthesis.getVoices?.() || [];
    const nativeVoice = voices.find(v => v.lang.toLowerCase() === locale.toLowerCase())
      || voices.find(v => v.lang.toLowerCase().split('-')[0] === code);
    const englishVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    const speakNatively = Boolean(nativeVoice) || voices.length === 0;
    const utterance = new Utterance(speakNatively ? nativeName : englishName);
    utterance.lang = nativeVoice?.lang || (speakNatively ? locale : englishVoice?.lang || 'en-US');
    if (nativeVoice || (!speakNatively && englishVoice)) utterance.voice = nativeVoice || englishVoice;
    utterance.rate = 0.93;
    synthesis.cancel();
    synthesis.speak(utterance);
    return true;
  } catch { return false; }
}
