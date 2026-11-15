"use client";

import { useState } from "react";
import { BotonListo, PreguntaCultivosAnteriores } from "@/components/CultivosChacra";
import type { Cultivo } from "@/lib/almacen";
import { useCatalogo } from "@/lib/hooks";
import { ICONOS_CHACRA } from "@/lib/textos";

/**
 * Cabecera de "Mi Cultivo": círculo grande con el ícono, el nombre y, debajo, "¿Qué sembraste antes?"
 * con sus 3 fichas (al tocarlas se elige). El lápiz abre la edición del cultivo.
 */
export function CabeceraCultivo({ cultivo, onEditar }: { cultivo: Cultivo; onEditar: () => void }) {
  const { porId } = useCatalogo();
  const [eligiendo, setEligiendo] = useState(false);
  const anteriores = cultivo.historial.filter((id): id is string => id !== null);
  const cerrar = () => setEligiendo(false);

  return (
    <header className="relative flex items-center gap-3">
      <span
        aria-hidden
        className="flex size-[96px] shrink-0 items-center justify-center rounded-full bg-petroleo text-[44px] lg:size-[88px] lg:text-[40px]"
      >
        {cultivo.icono ?? ICONOS_CHACRA[0]}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="truncate pr-9 font-titulo text-[28px] leading-[32px] font-bold text-tinta lg:text-[26px] lg:leading-[30px]">
          {cultivo.nombre}
        </h1>
        <h2 className="font-titulo text-[17px] leading-[22px] font-bold text-tinta lg:text-[15px] lg:leading-[20px]">
          ¿Qué sembraste antes?
        </h2>
        <ol className="flex gap-1.5 pt-0.5">
          {[0, 1, 2].map((i) => {
            const s = anteriores[i] ? porId.get(anteriores[i]) : undefined;
            const etiqueta = s ? `${s.nombre}. Tocar para cambiar` : "Elegir lo que sembraste antes";
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setEligiendo(true)}
                  aria-label={etiqueta}
                  title={s?.nombre ?? etiqueta}
                  className="flex size-[52px] items-center justify-center rounded-[12px] border-[0.5px] border-borde bg-arena transition-colors hover:bg-arena/70 lg:size-[48px]"
                >
                  {s && (
                    <span aria-hidden className="text-[28px] leading-none lg:text-[26px]">
                      {s.emoji}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <button
        type="button"
        onClick={onEditar}
        aria-label={`Editar ${cultivo.nombre}`}
        title="Editar cultivo"
        className="absolute top-0 right-0 flex items-center justify-center rounded-[10px] bg-petroleo p-[10px] active:bg-petroleo/85 lg:rounded-[8.867px] lg:p-[6.334px]"
      >
        {/* Lápiz con el mismo trazo que el "+" del diseño. */}
        <svg width="15.201" height="15.201" viewBox="0 0 24 24" fill="none" stroke="#FFFDF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
          <path d="m14.5 5.5 3 3" />
        </svg>
      </button>

      {eligiendo && <PreguntaCultivosAnteriores cultivoId={cultivo.id!} onCerrar={cerrar} pie={<BotonListo onClick={cerrar} />} />}
    </header>
  );
}
