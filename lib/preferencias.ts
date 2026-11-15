/**
 * Preferencias por dispositivo (modo de interfaz y escenario de demo) en localStorage.
 * Se leen con useSyncExternalStore para evitar diferencias entre servidor y cliente.
 */
"use client";

import { useSyncExternalStore } from "react";
import { ESCENARIO_INICIAL, LISTA_ESCENARIOS, type IdEscenario } from "@/lib/escenarios";

export type Modo = "sencillo" | "avanzado";

const CLAVES = { modo: "ss.modo", escenario: "ss.escenario" } as const;
const EVENTO = "ss-preferencias";

function leer(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string) {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    /* sin almacenamiento: el cambio dura solo esta sesión */
  }
  memoria[clave] = valor;
  window.dispatchEvent(new Event(EVENTO));
}

const memoria: Record<string, string> = {};

function suscribir(cb: () => void) {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useModo(): [Modo, (m: Modo) => void] {
  const valor = useSyncExternalStore(
    suscribir,
    () => (leer(CLAVES.modo) ?? memoria[CLAVES.modo]) === "avanzado" ? "avanzado" : "sencillo",
    () => "sencillo" as Modo,
  );
  return [valor, (m) => escribir(CLAVES.modo, m)];
}

export function useEscenario(): [IdEscenario, (e: IdEscenario) => void] {
  const valor = useSyncExternalStore(
    suscribir,
    () => {
      const v = (leer(CLAVES.escenario) ?? memoria[CLAVES.escenario]) as IdEscenario | null;
      return v && LISTA_ESCENARIOS.includes(v) ? v : ESCENARIO_INICIAL;
    },
    () => ESCENARIO_INICIAL,
  );
  return [valor, (e) => escribir(CLAVES.escenario, e)];
}
