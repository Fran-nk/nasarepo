"use client";

import Link from "next/link";
import { useState } from "react";
import { BotonListo, PreguntaCultivosAnteriores } from "@/app/frontcode/components/CultivosChacra";
import type { Cultivo } from "@/app/frontcode/lib/almacen";
import { useCatalogo } from "@/app/frontcode/lib/hooks";
import { ICONOS_CHACRA } from "@/app/frontcode/lib/textos";

/**
 * Cabecera de "Mi Cultivo" (Figma 89:1160): círculo con el ícono, el nombre con el lápiz al lado y, debajo,
 * "¿Qué sembraste antes?" con sus 3 fichas (al tocarlas se elige). Arriba a la izquierda, volver a Mi Perfil.
 * En el celular todo es un poco más grande para tocarlo con el dedo.
 */
export function CabeceraCultivo({ cultivo, onEditar }: { cultivo: Cultivo; onEditar: () => void }) {
  const { porId } = useCatalogo();
  const [eligiendo, setEligiendo] = useState(false);
  const anteriores = cultivo.historial.filter((id): id is string => id !== null);
  const cerrar = () => setEligiendo(false);

  return (
    <header className="relative flex items-center gap-[6.334px]">
      {/* Volver a Mi Perfil: botón redondo sobre el borde del círculo (Figma 89:1585). */}
      <Link
        href="/perfil"
        aria-label="Volver a Mi Perfil"
        title="Volver a Mi Perfil"
        className="tactil absolute -top-2 -left-2 z-10 flex size-10 items-center justify-center rounded-full bg-petroleo-fuerte p-[10.255px] shadow-[0_1px_3px_rgba(38,59,53,0.3)] active:bg-petroleo-fuerte/85 lg:-top-[7px] lg:-left-[2px] lg:size-[34px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- chevron del diseño, girado hacia la izquierda */}
        <img src="/iconos/volver.svg" alt="" width={11.3333} height={14.5714} className="-scale-x-100" />
      </Link>

      <span
        aria-hidden
        className="flex size-[88px] shrink-0 items-center justify-center rounded-full bg-petroleo text-[40px] lg:size-[73px] lg:text-[34px]"
      >
        {cultivo.icono ?? ICONOS_CHACRA[0]}
      </span>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-[5px]">
        <div className="flex items-center justify-between gap-2">
          <h1 className="min-w-0 truncate font-titulo text-[24px] leading-[28px] font-bold text-tinta lg:text-[20.268px] lg:leading-[24.068px]">
            {cultivo.nombre}
          </h1>
          <button
            type="button"
            onClick={onEditar}
            aria-label={`Editar ${cultivo.nombre}`}
            title="Editar cultivo"
            className="tactil relative flex shrink-0 items-center justify-center rounded-[8px] bg-petroleo-fuerte p-[8px] active:bg-petroleo-fuerte/85 lg:rounded-[7.042px] lg:p-[5.03px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- lápiz del diseño (Figma 90:1601) */}
            <img src="/iconos/lapiz-cultivo.svg" alt="" width={12.0714} height={12.0714} />
          </button>
        </div>
        <h2 className="font-titulo text-[16px] leading-[22px] font-semibold text-tinta lg:text-[14px] lg:leading-[20px]">
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
                  className="flex size-11 items-center justify-center rounded-[10px] border-[0.583px] border-borde bg-arena transition-colors hover:bg-arena/70 lg:size-[35px] lg:rounded-[8.75px]"
                >
                  {s && (
                    <span aria-hidden className="text-[22px] leading-none lg:text-[18.958px]">
                      {s.emoji}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {eligiendo && <PreguntaCultivosAnteriores cultivoId={cultivo.id!} onCerrar={cerrar} pie={<BotonListo onClick={cerrar} />} />}
    </header>
  );
}
