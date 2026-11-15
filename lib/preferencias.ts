/**
 * Preferencias por dispositivo (escenario de demo y cultivo abierto) en localStorage.
 * Se leen con useSyncExternalStore para evitar diferencias entre servidor y cliente.
 */
"use client";

import { useSyncExternalStore } from "react";
import { ESCENARIO_INICIAL, LISTA_ESCENARIOS, type IdEscenario } from "@/lib/escenarios";

const CLAVES = { escenario: "ss.escenario", cultivo: "ss.cultivo" } as const;
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

/** id del cultivo que se está mirando (null = ninguno elegido: se usa el más reciente). */
export function useCultivoActivo(): [number | null, (id: number) => void] {
  const valor = useSyncExternalStore(
    suscribir,
    () => {
      const n = Number(leer(CLAVES.cultivo) ?? memoria[CLAVES.cultivo]);
      return Number.isInteger(n) && n > 0 ? n : null;
    },
    () => null,
  );
  return [valor, (id) => escribir(CLAVES.cultivo, String(id))];
}
