/**
 * Preferencias por dispositivo (nombre, escenario de demo y cultivo abierto) en localStorage.
 * Se leen con useSyncExternalStore para evitar diferencias entre servidor y cliente.
 */
"use client";

import { useSyncExternalStore } from "react";
import { ESCENARIO_INICIAL, LISTA_ESCENARIOS, type IdEscenario } from "@/app/frontcode/lib/escenarios";

const CLAVES = { escenario: "ss.escenario", cultivo: "ss.cultivo", usuario: "ss.usuario" } as const;
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
    if (valor === "") window.localStorage.removeItem(clave);
    else window.localStorage.setItem(clave, valor);
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

/** Nombre local del agricultor; undefined durante el primer render para evitar diferencias de hidratación. */
export function useNombreUsuario(): [string | null | undefined, (nombre: string) => void] {
  const valor = useSyncExternalStore<string | null | undefined>(
    suscribir,
    () => {
      const v = leer(CLAVES.usuario) ?? memoria[CLAVES.usuario] ?? null;
      return v?.trim() ? v : null;
    },
    () => undefined,
  );
  return [valor, (nombre) => escribir(CLAVES.usuario, nombre.trim())];
}
