"use client";

import type { ReactNode } from "react";
import { BotonVoz } from "@/app/front/components/BotonVoz";
import { ERRORES } from "@/app/front/lib/textos";
import { IconoClima, type NombreIconoClima } from "./IconosClima";

export type Tono = "verde" | "ambar" | "rojo" | "neutral" | "violeta";

/** Franja izquierda según el tono (como las alertas): se reconoce el estado antes de leer. */
const ACENTOS: Record<Tono, string> = {
  verde: "border-l-bosque",
  ambar: "border-l-senal",
  rojo: "border-l-terracota-fuerte",
  neutral: "border-l-petroleo",
  violeta: "border-l-terracota-fuerte",
};

export interface DatoTecnico {
  etiqueta: string;
  valor: string;
}

interface Props {
  icono: NombreIconoClima;
  pregunta: string;
  respuesta: string;
  /** Por qué (una frase debajo de la respuesta) */
  detalle?: string;
  queHacer?: string;
  tono?: Tono;
  /** Parte visual (barras, días, etc.) */
  children?: ReactNode;
  /** Números y fuente, plegados en "Ver datos" */
  datos?: DatoTecnico[];
  fuente?: string;
}

/**
 * Tarjeta base: pregunta → respuesta en una frase → qué hacer, con el estilo del panel
 * (ícono de línea en ficha arena, franja de color a la izquierda). "Ver datos" muestra los números y la fuente.
 */
export function TarjetaDato({ icono, pregunta, respuesta, detalle, queHacer, tono = "neutral", children, datos, fuente }: Props) {
  const textoVoz = [pregunta, respuesta, detalle, queHacer && `Qué hacer: ${queHacer}`].filter(Boolean).join(". ");

  return (
    <section className={`rounded-[16px] border-[0.5px] border-l-4 border-borde bg-white p-4 shadow-[0_1px_3px_rgba(38,59,53,0.12)] ${ACENTOS[tono]}`}>
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-arena">
          <IconoClima nombre={icono} className="size-6 text-tinta" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-titulo text-[13px] leading-[16px] font-bold text-secundario uppercase">{pregunta}</h2>
          <p className="mt-1 font-titulo text-[20px] leading-[24px] font-bold text-tinta">{respuesta}</p>
          {detalle && <p className="mt-1 text-[14px] leading-[20px] text-secundario">{detalle}</p>}
        </div>
        <BotonVoz texto={textoVoz} pequeno />
      </div>

      {children && <div className="mt-3">{children}</div>}

      {queHacer && (
        <p className="mt-3 rounded-[12px] bg-arena p-3 text-[14px] leading-[20px] text-tinta">
          <span className="font-semibold">Qué hacer: </span>
          {queHacer}
        </p>
      )}

      {(Boolean(datos?.length) || Boolean(fuente)) && (
        <details className="mt-3 rounded-[12px] bg-arena/60 px-3 py-2.5 text-[14px] leading-[20px]">
          <summary className="tactil relative cursor-pointer font-semibold text-tinta">Ver datos</summary>
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
          {fuente && <p className="mt-2 text-[12px] leading-[16px] text-secundario">Fuente: {fuente}</p>}
        </details>
      )}
    </section>
  );
}

/** Esqueleto arena con brillo lento: muestra la forma de lo que viene en vez de "Cargando…". */
export function TarjetaCargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div role="status" className="flex flex-col gap-2.5 rounded-[16px] border-[0.5px] border-borde bg-white p-4">
      <span className="sr-only">{texto}</span>
      <div className="flex items-center gap-3">
        <span className="esqueleto size-10 shrink-0 rounded-[10px]" />
        <span className="flex flex-1 flex-col gap-1.5">
          <span className="esqueleto h-3 w-1/3 rounded-[3px]" />
          <span className="esqueleto h-5 w-3/4 rounded-[3px]" />
        </span>
      </div>
      <span className="esqueleto h-10 w-full rounded-[12px]" />
    </div>
  );
}

/**
 * Error en lenguaje simple con una salida ("Intentar de nuevo"). El detalle técnico solo se ve
 * mientras se programa: al agricultor no le sirve y le genera desconfianza.
 */
export function TarjetaError({ detalle, onReintentar }: { detalle?: string; onReintentar?: () => void }) {
  return (
    <div role="status" className="flex flex-col items-start gap-2 rounded-[12px] border-[0.5px] border-borde bg-arena p-3">
      <p className="text-[14px] leading-[20px] text-tinta">{ERRORES.dato}</p>
      {onReintentar && <BotonReintentar onClick={onReintentar} />}
      {detalle && process.env.NODE_ENV !== "production" && (
        <p className="font-mono text-[11px] leading-[14px] text-secundario">{detalle}</p>
      )}
    </div>
  );
}

export function BotonReintentar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tactil relative rounded-[10px] bg-tinta px-3 py-1.5 text-[13px] leading-[18px] font-semibold text-white hover:bg-tinta/90"
    >
      {ERRORES.reintentar}
    </button>
  );
}
