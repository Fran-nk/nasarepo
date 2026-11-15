"use client";

import type { ReactNode } from "react";
import { BotonVoz } from "@/components/BotonVoz";
import { useModo } from "@/lib/preferencias";
import { MODO } from "@/lib/textos";

export type Tono = "verde" | "ambar" | "rojo" | "neutral" | "violeta";

const BORDES: Record<Tono, string> = {
  verde: "border-l-green-600",
  ambar: "border-l-amber-500",
  rojo: "border-l-red-600",
  neutral: "border-l-stone-300",
  violeta: "border-l-violet-600",
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
 * En modo Avanzado agrega "Ver datos" con números y fuente.
 */
export function TarjetaDato({ emoji, pregunta, respuesta, detalle, queHacer, tono = "neutral", children, datos, fuente }: Props) {
  const [modo] = useModo();
  const textoVoz = [pregunta, respuesta, detalle, queHacer && `Qué hacer: ${queHacer}`].filter(Boolean).join(". ");

  return (
    <section className={`rounded-2xl border border-stone-200 border-l-8 ${BORDES[tono]} bg-white p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <span className="text-4xl leading-none" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium text-stone-500">{pregunta}</h2>
          <p className="mt-1 text-xl font-bold leading-snug text-stone-900">{respuesta}</p>
          {detalle && <p className="mt-1 text-lg text-stone-700">{detalle}</p>}
        </div>
        <BotonVoz texto={textoVoz} />
      </div>

      {children && <div className="mt-3">{children}</div>}

      {queHacer && (
        <p className="mt-3 rounded-xl bg-stone-100 p-3 text-lg text-stone-800">
          <span className="font-semibold">Qué hacer: </span>
          {queHacer}
        </p>
      )}

      {modo === "avanzado" && (Boolean(datos?.length) || Boolean(fuente)) && (
        <details className="mt-3 rounded-xl border border-stone-200 p-3 text-base">
          <summary className="cursor-pointer font-semibold text-stone-700">{MODO.verDatos}</summary>
          {datos && datos.length > 0 && (
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {datos.map((d) => (
                <div key={d.etiqueta} className="contents">
                  <dt className="text-stone-500">{d.etiqueta}</dt>
                  <dd className="text-right font-mono text-stone-900">{d.valor}</dd>
                </div>
              ))}
            </dl>
          )}
          {fuente && (
            <p className="mt-2 text-sm text-stone-500">
              {MODO.fuente}: {fuente}
            </p>
          )}
        </details>
      )}
    </section>
  );
}

export function TarjetaCargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="animate-pulse rounded-2xl border border-stone-200 bg-white p-4 text-lg text-stone-400">
      {texto}
    </div>
  );
}

export function TarjetaError({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-lg text-red-800">
      😕 No pudimos traer este dato. {texto}
    </div>
  );
}
