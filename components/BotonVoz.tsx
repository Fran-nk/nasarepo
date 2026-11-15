"use client";

import { useState } from "react";
import { callar, hablar, vozDisponible } from "@/lib/voz";

/** Botón 🔊 que lee el texto en voz alta (y lo detiene si se vuelve a tocar). */
export function BotonVoz({ texto, className = "" }: { texto: string; className?: string }) {
  const [leyendo, setLeyendo] = useState(false);

  function alTocar() {
    if (leyendo) {
      callar();
      setLeyendo(false);
      return;
    }
    if (!vozDisponible()) {
      alert("Tu navegador no puede leer en voz alta.");
      return;
    }
    setLeyendo(true);
    hablar(texto, () => setLeyendo(false));
  }

  return (
    <button
      type="button"
      onClick={alTocar}
      aria-label={leyendo ? "Detener lectura" : "Escuchar"}
      className={`flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white px-3 text-xl active:bg-stone-100 ${className}`}
    >
      {leyendo ? "⏹️" : "🔊"}
    </button>
  );
}
