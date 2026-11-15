"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, HISTORIAL_VACIO } from "@/lib/almacen";
import { ESCENARIOS } from "@/lib/escenarios";
import { useCultivoActivo, useEscenario } from "@/lib/preferencias";
import { obtenerContexto, obtenerRecomendaciones, obtenerSemillas, type Punto } from "@/lib/api/cliente";
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

/** Todos los cultivos, del más antiguo al más nuevo; undefined mientras IndexedDB responde. */
export function useCultivos() {
  return useLiveQuery(() => db.cultivos.orderBy("creado").toArray(), []);
}

/**
 * Cultivo que se está mirando: el elegido en Perfil o, si no hay (o ya no existe), el más reciente.
 * `cargada` es false mientras IndexedDB no responde.
 */
export function useCultivoAbierto() {
  const cultivos = useCultivos();
  const [activo] = useCultivoActivo();
  const lista = cultivos ?? [];
  const cultivo = lista.find((c) => c.id === activo) ?? lista.at(-1);
  return { cultivo, cultivos: lista, cargada: cultivos !== undefined };
}

/**
 * Ubicación usada para pedir datos: el cultivo abierto o, si no hay, el punto del escenario.
 * `clave` es null mientras IndexedDB no responde, para no pedir datos con el punto equivocado.
 */
export function useUbicacion() {
  const [escenario] = useEscenario();
  const { cultivo, cultivos, cargada } = useCultivoAbierto();
  const punto: Punto = cultivo ? { lat: cultivo.lat, lon: cultivo.lon } : ESCENARIOS[escenario].punto;
  const clave = cargada ? `${escenario}|${punto.lat.toFixed(4)},${punto.lon.toFixed(4)}` : null;
  return { punto, escenario, cultivo, cultivos, cargada, clave };
}

/** Historial del cultivo abierto; undefined mientras carga. */
export function useHistorialGuardado() {
  const { cultivo, cargada } = useCultivoAbierto();
  return cargada ? (cultivo?.historial ?? HISTORIAL_VACIO) : undefined;
}

export function useHistorial() {
  return useHistorialGuardado() ?? HISTORIAL_VACIO;
}

export function useMisSemillas(): Set<string> {
  const lista = useLiveQuery(() => db.misSemillas.toArray(), []);
  return new Set((lista ?? []).map((m) => m.id));
}

/** Mis semillas en el orden en que se agregaron (las más antiguas primero). */
export function useMisSemillasLista(): string[] {
  const lista = useLiveQuery(() => db.misSemillas.toArray(), []);
  return (lista ?? []).toSorted((a, b) => a.agregada.localeCompare(b.agregada)).map((m) => m.id);
}

/** Lugar, altitud, zona y cultivos comunes del cultivo abierto (o del punto que se pase). */
export function useContexto(otro?: Punto) {
  const { punto: abierto, escenario, clave } = useUbicacion();
  const punto = otro ?? abierto;
  const claveFinal = clave === null ? null : otro ? `${escenario}|${otro.lat.toFixed(4)},${otro.lon.toFixed(4)}` : clave;
  return useConsulta(claveFinal, () => obtenerContexto(punto, escenario));
}

/** Recomendaciones para el cultivo abierto, con su historial y las semillas que tiene. */
export function useRecomendaciones() {
  const { punto, escenario, clave } = useUbicacion();
  const historial = useHistorialGuardado();
  const mias = useMisSemillasLista();
  const mes = new Date().getMonth() + 1;
  const listo = clave !== null && historial !== undefined;
  return useConsulta(listo ? `rec|${clave}|${mes}|${historial.join(",")}|${mias.join(",")}` : null, () =>
    obtenerRecomendaciones(
      { lat: punto.lat, lon: punto.lon, mes, historial: historial!, semillas_disponibles: mias },
      escenario,
    ),
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
