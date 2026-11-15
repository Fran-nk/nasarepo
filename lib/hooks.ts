"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, HISTORIAL_VACIO } from "@/lib/almacen";
import { ESCENARIOS } from "@/lib/escenarios";
import { useEscenario } from "@/lib/preferencias";
import { obtenerRecomendaciones, obtenerSemillas, type Punto } from "@/lib/api/cliente";
import type { Semilla } from "@/lib/contratos/tipos";

interface Estado<T> {
  clave: string;
  datos?: T;
  error?: string;
}

/**
 * Pide datos cada vez que cambia `clave`. `cargando` se deriva comparando
 * la clave de la última respuesta con la actual.
 */
export function useConsulta<T>(clave: string | null, pedir: () => Promise<T>) {
  const [estado, setEstado] = useState<Estado<T>>({ clave: "" });

  useEffect(() => {
    if (clave === null) return;
    let vigente = true;
    pedir()
      .then((datos) => vigente && setEstado({ clave, datos }))
      .catch((e: unknown) =>
        vigente && setEstado({ clave, error: e instanceof Error ? e.message : String(e) }),
      );
    return () => {
      vigente = false;
    };
    // `pedir` cambia en cada render; la clave resume sus dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const actual = estado.clave === clave;
  return {
    datos: actual ? estado.datos : undefined,
    error: actual ? estado.error : undefined,
    cargando: clave !== null && !actual,
  };
}

/**
 * Ubicación usada para pedir datos: la chacra guardada o, si no hay, el punto del escenario.
 * `clave` es null mientras IndexedDB no responde, para no pedir datos con el punto equivocado.
 */
export function useUbicacion() {
  const [escenario] = useEscenario();
  // undefined = cargando; null = no hay chacra guardada
  const guardada = useLiveQuery(async () => (await db.chacra.get("principal")) ?? null, []);
  const cargada = guardada !== undefined;
  const chacra = guardada ?? undefined;
  const punto: Punto = chacra ? { lat: chacra.lat, lon: chacra.lon } : ESCENARIOS[escenario].punto;
  const clave = cargada ? `${escenario}|${punto.lat.toFixed(4)},${punto.lon.toFixed(4)}` : null;
  return { punto, escenario, chacra, cargada, clave };
}

/** Historial de cultivos; undefined mientras carga. */
export function useHistorialGuardado() {
  return useLiveQuery(async () => (await db.historial.get("principal"))?.cultivos ?? HISTORIAL_VACIO, []);
}

export function useHistorial() {
  return useHistorialGuardado() ?? HISTORIAL_VACIO;
}

export function useMisSemillas(): Set<string> {
  const lista = useLiveQuery(() => db.misSemillas.toArray(), []);
  return new Set((lista ?? []).map((m) => m.id));
}

/** Recomendaciones para la chacra actual con el historial guardado. */
export function useRecomendaciones() {
  const { punto, escenario, clave } = useUbicacion();
  const historial = useHistorialGuardado();
  const mes = new Date().getMonth() + 1;
  const listo = clave !== null && historial !== undefined;
  return useConsulta(listo ? `rec|${clave}|${mes}|${historial.join(",")}` : null, () =>
    obtenerRecomendaciones({ lat: punto.lat, lon: punto.lon, mes, historial: historial! }, escenario),
  );
}

/** Catálogo de semillas (se pide una vez y queda en memoria). */
let cacheCatalogo: Promise<Semilla[]> | null = null;
export function useCatalogo() {
  const { datos, cargando, error } = useConsulta("catalogo", () => {
    cacheCatalogo ??= obtenerSemillas()
      .then((r) => r.semillas)
      .catch((e) => {
        cacheCatalogo = null; // permitir reintentar
        throw e;
      });
    return cacheCatalogo;
  });
  const porId = new Map((datos ?? []).map((s) => [s.id, s]));
  return { semillas: datos ?? [], porId, cargando, error };
}
