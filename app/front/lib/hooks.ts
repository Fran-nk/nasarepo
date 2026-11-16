"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, HISTORIAL_VACIO } from "@/app/front/lib/almacen";
import { ESCENARIOS } from "@/app/front/lib/escenarios";
import { useCultivoActivo, useEscenario } from "@/app/front/lib/preferencias";
import { obtenerContexto, obtenerRecomendaciones, obtenerSemillas, type Punto } from "@/app/front/lib/api/cliente";
import type { Semilla } from "@/app/front/lib/contratos/tipos";

interface Estado<T> {
  clave: string;
  datos?: T;
  error?: string;
  /** true si `datos` viene de lo guardado en el celular (no llegó la respuesta nueva). */
  guardado?: boolean;
}

/**
 * Última respuesta buena de cada consulta, guardada en el celular: sin señal se muestra eso
 * en vez de un error. Puede fallar (modo privado, almacenamiento lleno): entonces no se guarda nada.
 */
const PREFIJO_GUARDADO = "ss.dato.";
function leerGuardado<T>(clave: string): T | undefined {
  try {
    const texto = localStorage.getItem(PREFIJO_GUARDADO + clave);
    return texto ? (JSON.parse(texto) as T) : undefined;
  } catch {
    return undefined;
  }
}
function escribirGuardado(clave: string, datos: unknown) {
  try {
    localStorage.setItem(PREFIJO_GUARDADO + clave, JSON.stringify(datos));
  } catch {
    // Sin espacio o sin permiso: se sigue sin copia.
  }
}

function suscribirConexion(avisar: () => void) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

/** false cuando el celular perdió la señal (en el servidor se asume que hay). */
export function useEnLinea() {
  return useSyncExternalStore(
    suscribirConexion,
    () => navigator.onLine,
    () => true,
  );
}

/**
 * Pide datos cada vez que cambia `clave`. `cargando` se deriva comparando
 * la clave de la última respuesta con la actual.
 */
export function useConsulta<T>(clave: string | null, pedir: () => Promise<T>) {
  const [estado, setEstado] = useState<Estado<T>>({ clave: "" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (clave === null) return;
    let vigente = true;
    pedir()
      .then((datos) => {
        if (!vigente) return;
        setEstado({ clave, datos });
        escribirGuardado(clave, datos);
      })
      .catch((e: unknown) => {
        if (!vigente) return;
        const guardado = leerGuardado<T>(clave);
        setEstado(
          guardado !== undefined
            ? { clave, datos: guardado, guardado: true }
            : { clave, error: e instanceof Error ? e.message : String(e) },
        );
      });
    return () => {
      vigente = false;
    };
    // `pedir` cambia en cada render; la clave resume sus dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento]);

  const actual = estado.clave === clave;
  return {
    datos: actual ? estado.datos : undefined,
    error: actual ? estado.error : undefined,
    cargando: clave !== null && !actual,
    guardado: actual ? Boolean(estado.guardado) : false,
    /** Vuelve a pedir el dato (botón "Intentar de nuevo"). */
    reintentar: () => {
      setEstado({ clave: "" });
      setIntento((n) => n + 1);
    },
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

/** Clave de un punto para las consultas (≈10 m de precisión). */
const claveDe = (p: Punto) => `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`;

/**
 * Ubicación usada para pedir datos: el cultivo abierto o, si no hay, el lugar de ejemplo elegido.
 * `clave` es null mientras IndexedDB no responde, para no pedir datos con el punto equivocado.
 */
export function useUbicacion() {
  const [escenario] = useEscenario();
  const { cultivo, cultivos, cargada } = useCultivoAbierto();
  const punto: Punto = cultivo ? { lat: cultivo.lat, lon: cultivo.lon } : ESCENARIOS[escenario].punto;
  const clave = cargada ? claveDe(punto) : null;
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
  const { punto: abierto, clave } = useUbicacion();
  const punto = otro ?? abierto;
  const claveFinal = clave === null ? null : otro ? claveDe(otro) : clave;
  return useConsulta(claveFinal === null ? null : `ctx|${claveFinal}`, () => obtenerContexto(punto));
}

/** Recomendaciones para el cultivo abierto, con su historial y las semillas que tiene. */
export function useRecomendaciones() {
  const { punto, clave } = useUbicacion();
  const historial = useHistorialGuardado();
  const mias = useMisSemillasLista();
  const mes = new Date().getMonth() + 1;
  const listo = clave !== null && historial !== undefined;
  return useConsulta(listo ? `rec|${clave}|${mes}|${historial.join(",")}|${mias.join(",")}` : null, () =>
    obtenerRecomendaciones(
      { lat: punto.lat, lon: punto.lon, mes, historial: historial!, semillas_disponibles: mias },
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
