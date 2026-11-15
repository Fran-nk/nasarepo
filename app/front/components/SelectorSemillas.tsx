"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { buscar } from "@/app/front/lib/busqueda/fonetica";
import { useCatalogo, useContexto } from "@/app/front/lib/hooks";

interface Props {
  /** Texto pequeño sobre el título, p. ej. "Paso 1 de 2". */
  etiqueta?: string;
  titulo: string;
  bajada?: string;
  /** ids elegidos, en orden. */
  seleccion: string[];
  /** Máximo de semillas que se pueden elegir; también dibuja ese número de casillas arriba. */
  maximo?: number;
  onAlternar: (id: string) => void;
  onCerrar: () => void;
  /** Botones de abajo (Siguiente, Saltar, Listo…). */
  pie: ReactNode;
}

/**
 * Ventana que ocupa la pantalla para elegir semillas:
 * arriba las elegidas (dibujo y nombre pequeño), abajo un buscador y la cuadrícula con todas.
 * La búsqueda tolera errores de ortografía (RF 12) y las semillas comunes en la zona salen primero (RF 6).
 */
export function SelectorSemillas({ etiqueta, titulo, bajada, seleccion, maximo, onAlternar, onCerrar, pie }: Props) {
  const idTitulo = useId();
  const idBuscar = useId();
  const [texto, setTexto] = useState("");
  const { semillas, porId, cargando } = useCatalogo();
  const comunes = useContexto().datos?.cultivos_comunes ?? [];

  // Escape cierra la ventana.
  useEffect(() => {
    function alTeclado(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [onCerrar]);

  const lista = texto.trim()
    ? buscar(texto, semillas, semillas.length)
    : semillas.toSorted((a, b) => Number(comunes.includes(b.id)) - Number(comunes.includes(a.id)));
  const lleno = maximo !== undefined && seleccion.length >= maximo;
  const casillas = maximo ?? seleccion.length;

  // Se dibuja en <body> para quedar encima del panel y del menú (que tienen su propio z-index).
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-stretch justify-center bg-tinta/40 lg:items-center lg:p-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="flex h-full w-full flex-col overflow-hidden bg-papel lg:h-auto lg:max-h-[88dvh] lg:max-w-[760px] lg:rounded-[20px] lg:shadow-[0_12px_40px_rgba(38,59,53,0.3)]"
      >
        {/* Encabezado y semillas elegidas */}
        <div className="flex flex-col gap-3 border-b border-borde px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {etiqueta && (
                <p className="font-titulo text-[12px] leading-[16px] font-bold text-secundario uppercase">{etiqueta}</p>
              )}
              <h2 id={idTitulo} className="font-titulo text-[26px] leading-[30px] font-bold text-tinta">
                {titulo}
              </h2>
              {bajada && <p className="text-[14px] leading-[20px] text-secundario">{bajada}</p>}
            </div>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-borde text-[18px] text-tinta"
            >
              ✕
            </button>
          </div>

          <ul aria-label="Elegidas" className="flex min-h-[78px] gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {Array.from({ length: Math.max(casillas, 1) }, (_, i) => {
              const s = seleccion[i] ? porId.get(seleccion[i]) : undefined;
              if (!s) {
                return (
                  <li key={`vacia-${i}`} className="flex w-[56px] shrink-0 flex-col items-center">
                    <span className="h-[54px] w-full rounded-[8px] border-[0.5px] border-dashed border-borde bg-arena" />
                    {maximo === undefined && (
                      <span className="sr-only">Todavía no elegiste ninguna</span>
                    )}
                  </li>
                );
              }
              return (
                <li key={s.id} className="flex w-[56px] shrink-0 flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onAlternar(s.id)}
                    aria-label={`Quitar ${s.nombre}`}
                    title={`Quitar ${s.nombre}`}
                    className="relative flex h-[54px] w-full items-center justify-center rounded-[8px] border-[0.5px] border-borde bg-white"
                  >
                    <span aria-hidden className="text-[30px] leading-none">
                      {s.emoji}
                    </span>
                    <span
                      aria-hidden
                      className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-tinta text-[10px] text-white"
                    >
                      ✕
                    </span>
                  </button>
                  <p className="w-full truncate text-center text-[10px] leading-[15px] text-secundario">{s.nombre}</p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Buscador y cuadrícula con todas las semillas */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pt-4">
          <label htmlFor={idBuscar} className="sr-only">
            Buscar semilla
          </label>
          <input
            id={idBuscar}
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="🔎 Busca como la llamas: oyuco, abas, chocho…"
            autoComplete="off"
            className="w-full rounded-[14px] border border-borde bg-white px-4 py-3 text-[16px] leading-[24px] text-tinta outline-none focus:border-tinta"
          />
          {lleno && (
            <p className="text-[13px] leading-[18px] text-secundario">
              Ya elegiste {maximo}. Para cambiar una, quítala de arriba.
            </p>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
            {cargando && <p className="py-6 text-center text-[14px] text-secundario">Cargando semillas…</p>}
            {!cargando && lista.length === 0 && (
              <p className="py-6 text-center text-[14px] leading-[20px] text-secundario">
                No encontramos esa semilla. Prueba con otro nombre.
              </p>
            )}
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {lista.map((s) => {
                const elegida = seleccion.includes(s.id);
                const bloqueada = !elegida && lleno;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onAlternar(s.id)}
                      disabled={bloqueada}
                      aria-pressed={elegida}
                      className={`relative flex w-full flex-col items-center gap-1 rounded-[12px] border p-2 text-center transition-colors disabled:opacity-40 ${
                        elegida ? "border-tinta bg-pradera/30" : "border-borde bg-white hover:bg-arena/40"
                      }`}
                    >
                      <span aria-hidden className="flex h-[48px] items-center text-[34px] leading-none">
                        {s.emoji}
                      </span>
                      <span className="w-full truncate text-[13px] leading-[18px] font-semibold text-tinta">{s.nombre}</span>
                      {comunes.includes(s.id) && (
                        <span className="text-[10px] leading-[14px] text-secundario">Común en tu zona</span>
                      )}
                      {elegida && (
                        <span
                          aria-hidden
                          className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-tinta text-[11px] text-white"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-borde px-5 py-4">{pie}</div>
      </section>
    </div>,
    document.body,
  );
}

/** Estilos de los botones del pie de la ventana. */
export const BOTON_PIE_PRINCIPAL =
  "flex-1 rounded-[14px] bg-petroleo px-4 py-3 text-center text-[16px] leading-[24px] font-semibold text-[#fffdf6] active:bg-petroleo/85";
export const BOTON_PIE_SECUNDARIO =
  "rounded-[14px] px-4 py-3 text-[16px] leading-[24px] font-semibold text-secundario underline underline-offset-2";
