"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { Cultivo } from "@/app/front/lib/almacen";

/** Funciones para manejar el mapa (que vive en el fondo de todas las pantallas) desde los botones del panel. */
export interface ApiMapa {
  dibujar: () => void;
  /** Cierra el terreno que se está marcando (si tiene 3 esquinas o más, se entrega como terreno nuevo). */
  terminar: () => void;
  /** Descarta el terreno que se está marcando. */
  cancelar: () => void;
  irA: (lat: number, lon: number, zoom?: number) => void;
  /** Mueve el mapa para que se vea todo el terreno del cultivo. */
  encuadrar: (cultivo: Cultivo) => void;
  /** Abre, al lado de su polígono, el cuadro con los datos del cultivo. */
  mostrarDatos: (cultivoId: number) => void;
}

/**
 * Pasos para crear un cultivo:
 * - "terreno": marcar las esquinas en el mapa o usar la ubicación del celular;
 * - "cultivos": qué sembró antes y qué semillas tiene (se puede saltar).
 */
export type PasoAsistente = "terreno" | "cultivos";

interface ValorContexto {
  /** Siempre la última API que entregó el mapa (o null si aún no carga). */
  apiRef: { current: ApiMapa | null };
  dibujando: boolean;
  setDibujando: (d: boolean) => void;
  /** null = no se está creando un cultivo. */
  paso: PasoAsistente | null;
  setPaso: (p: PasoAsistente | null | ((actual: PasoAsistente | null) => PasoAsistente | null)) => void;
  /** id del cultivo que se acaba de crear (para las preguntas del paso "cultivos"). */
  cultivoNuevo: number | null;
  setCultivoNuevo: (id: number | null) => void;
  iniciarAsistente: () => void;
  cancelarAsistente: () => void;
}

const Contexto = createContext<ValorContexto | null>(null);

export function ProveedorMapa({ children }: { children: ReactNode }) {
  const apiRef = useRef<ApiMapa | null>(null);
  const [dibujando, setDibujando] = useState(false);
  const [paso, setPaso] = useState<PasoAsistente | null>(null);
  const [cultivoNuevo, setCultivoNuevo] = useState<number | null>(null);

  const iniciarAsistente = useCallback(() => {
    setCultivoNuevo(null);
    setPaso("terreno");
    apiRef.current?.dibujar();
  }, []);

  const cancelarAsistente = useCallback(() => {
    apiRef.current?.cancelar();
    setPaso(null);
  }, []);

  const valor = useMemo(
    () => ({
      apiRef,
      dibujando,
      setDibujando,
      paso,
      setPaso,
      cultivoNuevo,
      setCultivoNuevo,
      iniciarAsistente,
      cancelarAsistente,
    }),
    [dibujando, paso, cultivoNuevo, iniciarAsistente, cancelarAsistente],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useMapa() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useMapa debe usarse dentro de <ProveedorMapa>");
  return valor;
}
