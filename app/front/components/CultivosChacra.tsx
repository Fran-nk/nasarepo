"use client";

import { useState, type ReactNode } from "react";
import { BOTON_PIE_PRINCIPAL, SelectorSemillas } from "@/app/front/components/SelectorSemillas";
import { agregarMiSemilla, db, guardarHistorial, HISTORIAL_VACIO, quitarMiSemilla } from "@/app/front/lib/almacen";
import type { Semilla } from "@/app/front/lib/contratos/tipos";
import { useCatalogo, useMisSemillasLista } from "@/app/front/lib/hooks";
import { useLiveQuery } from "dexie-react-hooks";

/*
 * "¿Qué sembraste antes?" y "Mis semillas":
 * - en el panel son tarjetas con casillas (Figma 51:1641 y 43:1200); al tocarlas se abre la ventana para elegir;
 * - en el asistente para crear un cultivo son directamente las ventanas, una después de otra.
 * "¿Qué sembraste antes?" es de cada cultivo (terreno); "Mis semillas" es del agricultor.
 * En escritorio las tarjetas llevan los tamaños del diseño; en el celular son un poco más grandes.
 */

const TEXTOS = {
  anteriores: {
    titulo: "¿Qué sembraste antes?",
    ventana: "Elige hasta 3, empezando por lo último que sembraste.",
  },
  semillas: {
    titulo: "Mis Semillas",
    ventana: "¿Qué semillas tienes?",
  },
};

interface PropsPregunta {
  etiqueta?: string;
  onCerrar: () => void;
  pie: ReactNode;
}

/** Ventana para elegir lo sembrado antes en un terreno (máximo 3, en orden: el primero es lo último). */
export function PreguntaCultivosAnteriores({ cultivoId, etiqueta, onCerrar, pie }: PropsPregunta & { cultivoId: number }) {
  const historial = useLiveQuery(async () => (await db.cultivos.get(cultivoId))?.historial, [cultivoId]) ?? HISTORIAL_VACIO;
  const elegidos = historial.filter((id): id is string => id !== null);

  function alternar(id: string) {
    const nuevos = elegidos.includes(id) ? elegidos.filter((x) => x !== id) : [...elegidos, id].slice(0, 3);
    void guardarHistorial(cultivoId, nuevos);
  }

  return (
    <SelectorSemillas
      etiqueta={etiqueta}
      titulo={TEXTOS.anteriores.titulo}
      bajada={TEXTOS.anteriores.ventana}
      seleccion={elegidos}
      maximo={3}
      onAlternar={alternar}
      onCerrar={onCerrar}
      pie={pie}
    />
  );
}

/** Ventana para elegir las semillas que tiene (sin límite). */
export function PreguntaMisSemillas({ etiqueta, onCerrar, pie }: PropsPregunta) {
  const mias = useMisSemillasLista();
  return (
    <SelectorSemillas
      etiqueta={etiqueta}
      titulo={TEXTOS.semillas.ventana}
      seleccion={mias}
      onAlternar={(id) => void (mias.includes(id) ? quitarMiSemilla(id) : agregarMiSemilla(id))}
      onCerrar={onCerrar}
      pie={pie}
    />
  );
}

/** Tarjeta blanca con título, bajada (opcional) y una fila de casillas. */
function Tarjeta({ titulo, bajada, children }: { titulo: string; bajada?: string; children: ReactNode }) {
  return (
    <section
      aria-label={titulo}
      className="flex w-full flex-col rounded-[16px] border-[0.8px] border-borde bg-white p-3 shadow-[0_0.633px_0.475px_rgba(0,0,0,0.1),0_0.633px_0.317px_rgba(0,0,0,0.1)] lg:rounded-[12.667px] lg:p-[10px]"
    >
      <h2 className="text-[16px] leading-[22px] font-semibold text-tinta lg:text-[14px] lg:leading-[20px]">{titulo}</h2>
      {bajada && <p className="text-[13px] leading-[18px] text-secundario lg:text-[12px] lg:leading-[15.2px]">{bajada}</p>}
      {children}
    </section>
  );
}

const FILA = "flex flex-wrap items-start gap-[6px] pt-2 lg:gap-[5px] lg:pt-[7.6px]";

/**
 * Casilla de una semilla: con su dibujo y nombre, o vacía (fondo arena) para agregar una.
 */
function Casilla({
  semilla,
  etiqueta,
  onClick,
}: {
  semilla?: Semilla;
  etiqueta: string;
  onClick: () => void;
}) {
  return (
    <div className="flex w-[56px] flex-col items-center lg:w-[50px]">
      <button
        type="button"
        onClick={onClick}
        aria-label={etiqueta}
        title={etiqueta}
        className={`flex h-[54px] w-full items-center justify-center rounded-[8px] border-[0.8px] border-borde transition-colors lg:h-[46.6px] lg:rounded-[7.6px] ${
          semilla ? "bg-white" : "bg-arena hover:bg-arena/70"
        }`}
      >
        {semilla && (
          <span aria-hidden className="text-[30px] leading-none lg:text-[24px]">
            {semilla.emoji}
          </span>
        )}
      </button>
      {semilla && (
        <p className="w-full truncate text-center text-[11px] leading-[15px] text-secundario lg:text-[11px] lg:leading-[15.2px]">
          {semilla.nombre}
        </p>
      )}
    </div>
  );
}

export function BotonListo({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={BOTON_PIE_PRINCIPAL}>
      Listo
    </button>
  );
}

/** Tarjeta del panel con las semillas que tiene (la cantidad varía). */
export function MisSemillasChacra() {
  const mias = useMisSemillasLista();
  const { porId } = useCatalogo();
  const [abierta, setAbierta] = useState(false);
  const cerrar = () => setAbierta(false);
  // Filas de 5 casillas, siempre con al menos una vacía para agregar otra semilla.
  const total = Math.max(5, Math.ceil((mias.length + 1) / 5) * 5);

  return (
    <Tarjeta titulo={TEXTOS.semillas.titulo}>
      <ul className={FILA}>
        {Array.from({ length: total }, (_, i) => {
          const semilla = i < mias.length ? porId.get(mias[i]) : undefined;
          return (
            <li key={i < mias.length ? mias[i] : `vacia-${i}`}>
              <Casilla
                semilla={semilla}
                etiqueta={semilla ? `${semilla.nombre}. Tocar para cambiar` : "Agregar una semilla que tienes"}
                onClick={() => setAbierta(true)}
              />
            </li>
          );
        })}
      </ul>
      {abierta && <PreguntaMisSemillas onCerrar={cerrar} pie={<BotonListo onClick={cerrar} />} />}
    </Tarjeta>
  );
}
