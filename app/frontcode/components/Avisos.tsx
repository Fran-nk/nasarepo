"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { IconoLinea, type NombreIconoLinea } from "@/app/frontcode/components/IconoLinea";
import { AVISOS } from "@/app/frontcode/lib/textos";

interface Aviso {
  texto: string;
  /** Si existe, el aviso ofrece "Deshacer" y dura más. */
  deshacer?: () => void;
  icono?: NombreIconoLinea;
}

const Contexto = createContext<(aviso: Aviso) => void>(() => {});

/** Muestra un aviso breve ("Anotado", "Semilla agregada", "Deshacer"). Se anuncia al lector de pantalla. */
export function useAviso() {
  return useContext(Contexto);
}

/**
 * Avisos de confirmación: una sola tira tinta abajo (encima del menú en el celular, arriba del mapa en
 * escritorio). Confirmar cada acción evita que el agricultor la repita o se quede con la duda.
 */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<(Aviso & { id: number }) | null>(null);
  const reloj = useRef<number | undefined>(undefined);

  const avisar = useCallback((nuevo: Aviso) => {
    window.clearTimeout(reloj.current);
    setAviso({ ...nuevo, id: Date.now() });
    reloj.current = window.setTimeout(() => setAviso(null), nuevo.deshacer ? 8000 : 3000);
  }, []);

  useEffect(() => () => window.clearTimeout(reloj.current), []);

  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[76px] z-50 flex justify-center px-4 despues-del-panel lg:top-[18px] lg:bottom-auto lg:right-[334px]"
      >
        {aviso && (
          <div
            key={aviso.id}
            role="status"
            className="animar-surco pointer-events-auto flex max-w-[360px] min-w-0 items-center gap-3 rounded-[12px] bg-tinta py-2.5 pr-2 pl-3.5 text-white shadow-[0_6px_20px_rgba(38,59,53,0.35)]"
          >
            <span className="animar-sello flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-senal text-senal">
              <IconoLinea nombre={aviso.icono ?? "check"} className="size-4" />
            </span>
            <p className="min-w-0 flex-1 text-[14px] leading-[20px] font-semibold">{aviso.texto}</p>
            {aviso.deshacer ? (
              <button
                type="button"
                onClick={() => {
                  aviso.deshacer?.();
                  setAviso(null);
                }}
                className="tactil relative shrink-0 rounded-[8px] px-2.5 py-1.5 text-[14px] leading-[20px] font-bold text-senal underline underline-offset-2 hover:bg-white/10"
              >
                {AVISOS.deshacer}
              </button>
            ) : (
              <span className="w-1.5" />
            )}
          </div>
        )}
      </div>
    </Contexto.Provider>
  );
}
