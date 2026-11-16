"use client";

import { IconoLinea } from "@/app/frontcode/components/IconoLinea";
import { useEnLinea } from "@/app/frontcode/lib/hooks";
import { SIN_SENAL } from "@/app/frontcode/lib/textos";

/**
 * Aviso tranquilo cuando el celular pierde la señal: explica que lo que se ve es lo último guardado,
 * para que el agricultor no piense que la app se rompió ni desconfíe de los datos.
 */
export function SinSenal() {
  const enLinea = useEnLinea();
  if (enLinea) return null;
  return (
    <p role="status" className="animar-surco mb-4 flex items-center gap-2.5 rounded-[12px] border-[0.5px] border-borde-fuerte bg-arena px-3 py-2.5">
      <IconoLinea nombre="sinSenal" className="size-5 shrink-0 text-tinta" />
      <span className="text-[14px] leading-[20px] text-tinta">
        <strong className="font-titulo text-[16px] font-bold">{SIN_SENAL.titulo}.</strong> {SIN_SENAL.texto}
      </span>
    </p>
  );
}
