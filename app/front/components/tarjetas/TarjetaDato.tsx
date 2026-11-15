"use client";

import type { ReactNode } from "react";
import { BotonVoz } from "@/app/front/components/BotonVoz";

export type Tono = "verde" | "ambar" | "rojo" | "neutral" | "violeta";

/** Color de la franja superior (guía "Territorio"). */
const ACENTOS: Record<Tono, string> = {
  verde: "bg-bosque",
  ambar: "bg-senal",
  rojo: "bg-terracota",
  neutral: "bg-petroleo",
  violeta: "bg-terracota",
};

export interface DatoTecnico {
  etiqueta: string;
  valor: string;
}

interface Props {
  emoji: string;
  pregunta: string;
  respuesta: string;
  /** Por qué (una frase debajo de la respuesta) */
  detalle?: string;
  queHacer?: string;
  tono?: Tono;
  /** Parte visual (barras, días, etc.) */
  children?: ReactNode;
  /** Solo se muestran en modo Avanzado */
  datos?: DatoTecnico[];
  fuente?: string;
}

/**
 * Tarjeta base: pregunta → respuesta en una frase → qué hacer.
 * "Ver datos" (plegado) muestra los números y la fuente.
 */
export function TarjetaDato({ emoji, pregunta, respuesta, detalle, queHacer, tono = "neutral", children, datos, fuente }: Props) {
  const textoVoz = [pregunta, respuesta, detalle, queHacer && `Qué hacer: ${queHacer}`].filter(Boolean).join(". ");

  return (
    <section className="relative overflow-clip rounded-[20px] border border-white bg-white px-5 pt-[18px] pb-4">
      <div aria-hidden className={`absolute inset-x-0 top-0 h-1 ${ACENTOS[tono]}`} />
      <div className="flex items-start gap-3">
        <span className="text-[32px] leading-[38px]" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] leading-[18px] font-normal text-secundario">{pregunta}</h2>
          <p className="mt-1 text-[20px] leading-[26px] font-semibold text-tinta">{respuesta}</p>
          {detalle && <p className="mt-1 text-[16px] leading-[24px] text-secundario">{detalle}</p>}
        </div>
        <BotonVoz texto={textoVoz} pequeno />
      </div>

      {children && <div className="mt-3">{children}</div>}

      {queHacer && (
        <p className="mt-3 rounded-[4px] bg-arena p-3 text-[16px] leading-[24px] text-tinta">
          <span className="font-semibold">Qué hacer: </span>
          {queHacer}
        </p>
      )}

      {(Boolean(datos?.length) || Boolean(fuente)) && (
        <details className="mt-3 rounded-[4px] bg-arena/60 p-3 text-[14px] leading-[20px]">
          <summary className="cursor-pointer font-semibold text-tinta">Ver datos</summary>
          {datos && datos.length > 0 && (
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {datos.map((d) => (
                <div key={d.etiqueta} className="contents">
                  <dt className="text-secundario">{d.etiqueta}</dt>
                  <dd className="text-right font-semibold text-tinta">{d.valor}</dd>
                </div>
              ))}
            </dl>
          )}
          {fuente && (
            <p className="mt-2 text-[11px] leading-[15px] text-secundario">
              Fuente: {fuente}
            </p>
          )}
        </details>
      )}
    </section>
  );
}

export function TarjetaCargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="animate-pulse rounded-[20px] bg-white p-4 text-[16px] leading-[24px] text-secundario">
      {texto}
    </div>
  );
}

export function TarjetaError({ texto }: { texto: string }) {
  return (
    <div className="rounded-[20px] bg-terracota/15 p-4 text-[16px] leading-[24px] text-tinta">
      😕 No pudimos traer este dato. {texto}
    </div>
  );
}
