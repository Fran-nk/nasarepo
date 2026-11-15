"use client";

import { useState } from "react";
import { callar, hablar, vozDisponible } from "@/app/front/lib/voz";

/**
 * Botón que lee el texto en voz alta (y lo detiene si se vuelve a tocar).
 * `pequeno`: versión de 28 px con el ícono de altavoz del diseño.
 */
export function BotonVoz({ texto, pequeno = false, className = "" }: { texto: string; pequeno?: boolean; className?: string }) {
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

  const etiqueta = leyendo ? "Detener lectura" : "Escuchar";
  const icono = leyendo ? (
    <span className="block size-[9px] rounded-[1px] bg-tinta" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- ícono SVG del diseño
    <img src="/iconos/altavoz.svg" alt="" width={16} height={16} />
  );

  if (pequeno) {
    return (
      <button
        type="button"
        onClick={alTocar}
        aria-label={etiqueta}
        title={etiqueta}
        className={`relative flex size-[28px] shrink-0 items-center justify-center rounded-[14px] border border-borde before:absolute before:-inset-2 active:bg-arena/60 ${className}`}
      >
        {icono}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={alTocar}
      aria-label={etiqueta}
      title={etiqueta}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-borde bg-white active:bg-arena/60 ${className}`}
    >
      {icono}
    </button>
  );
}
