/** Lectura en voz alta con la voz del navegador (Web Speech API). */

export function vozDisponible(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function elegirVoz(): SpeechSynthesisVoice | undefined {
  const voces = window.speechSynthesis.getVoices();
  return (
    voces.find((v) => v.lang.toLowerCase() === "es-pe") ??
    voces.find((v) => v.lang.toLowerCase().startsWith("es-4")) ?? // es-419 (Latinoamérica)
    voces.find((v) => v.lang.toLowerCase().startsWith("es"))
  );
}

/** Lee el texto. Si ya estaba leyendo, lo detiene. Devuelve false si no hay voz. */
export function hablar(texto: string, alTerminar?: () => void): boolean {
  if (!vozDisponible()) return false;
  const sintesis = window.speechSynthesis;
  sintesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "es-PE";
  const voz = elegirVoz();
  if (voz) u.voice = voz;
  u.rate = 0.95;
  u.onend = () => alTerminar?.();
  u.onerror = () => alTerminar?.();
  sintesis.speak(u);
  return true;
}

export function callar(): void {
  if (vozDisponible()) window.speechSynthesis.cancel();
}
