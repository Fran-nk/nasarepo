/** Datos del agricultor guardados solo en su dispositivo (IndexedDB con Dexie). */
"use client";

import Dexie, { type EntityTable } from "dexie";
import type { Polygon } from "geojson";
import { ACTIVIDADES } from "@/app/frontcode/lib/textos";

export type HistorialCultivos = [string | null, string | null, string | null];

/** Un terreno del agricultor ("cultivo"): dónde está, qué sembró antes en él y su ícono. */
export interface Cultivo {
  id?: number;
  nombre: string;
  /** Centro del terreno (o la ubicación del celular). */
  lat: number;
  lon: number;
  poligono?: Polygon;
  area_ha?: number;
  origen: "poligono" | "ubicacion";
  /** Ícono (emoji) que eligió para este cultivo; se ve en el mapa y en el panel. */
  icono?: string;
  /** [último, penúltimo, antepenúltimo] sembrado en este terreno — null = ninguno */
  historial: HistorialCultivos;
  creado: string; // ISO
}

/** Lo que entrega el mapa (o el GPS) al marcar un terreno nuevo. */
export type TerrenoNuevo = Pick<Cultivo, "lat" | "lon" | "poligono" | "area_ha" | "origen">;

export interface MiSemilla {
  id: string; // id de la semilla
  agregada: string; // ISO
}

export type TipoActividad = keyof typeof ACTIVIDADES;

export interface Actividad {
  id?: number;
  tipo: TipoActividad;
  fecha: string; // YYYY-MM-DD
  semillaId?: string;
  nota?: string;
}

/** Formato de la versión 1 (una sola chacra): solo se lee para pasarlo a `cultivos`. */
interface ChacraV1 extends Omit<Cultivo, "id" | "nombre" | "historial" | "creado"> {
  id: "principal";
}
interface HistorialV1 {
  id: "principal";
  cultivos: HistorialCultivos;
}

class BaseLocal extends Dexie {
  cultivos!: EntityTable<Cultivo, "id">;
  misSemillas!: EntityTable<MiSemilla, "id">;
  actividades!: EntityTable<Actividad, "id">;
  /** Tablas de la versión 1; quedan solo como respaldo de la migración. */
  chacra!: EntityTable<ChacraV1, "id">;
  historial!: EntityTable<HistorialV1, "id">;

  constructor() {
    super("semilla-siguiente");
    this.version(1).stores({
      chacra: "id",
      historial: "id",
      misSemillas: "id",
      actividades: "++id, fecha, tipo, semillaId",
    });
    // v2: varios cultivos. La chacra única (y su historial) pasa a ser el primer cultivo.
    this.version(2)
      .stores({ cultivos: "++id, creado" })
      .upgrade(async (tx) => {
        const chacra = (await tx.table("chacra").get("principal")) as ChacraV1 | undefined;
        if (!chacra) return;
        const historial = (await tx.table("historial").get("principal")) as HistorialV1 | undefined;
        const { id: _id, ...terreno } = chacra;
        void _id;
        await tx.table("cultivos").add({
          ...terreno,
          nombre: nombreCultivo(0),
          historial: historial?.cultivos ?? HISTORIAL_VACIO,
          creado: new Date().toISOString(),
        } satisfies Cultivo);
      });
  }
}

export const db = new BaseLocal();

export const HISTORIAL_VACIO: HistorialCultivos = [null, null, null];

/** "Mi cultivo", "Mi cultivo 2", … según cuántos tenga. */
export function nombreCultivo(cuantosHay: number) {
  return cuantosHay === 0 ? "Mi cultivo" : `Mi cultivo ${cuantosHay + 1}`;
}

/** Guarda un terreno recién marcado como cultivo nuevo y devuelve su id. */
export async function crearCultivo(terreno: TerrenoNuevo, nombre?: string | null): Promise<number> {
  const cuantos = await db.cultivos.count();
  const id = await db.cultivos.add({
    ...terreno,
    nombre: nombre?.trim() || nombreCultivo(cuantos),
    historial: HISTORIAL_VACIO,
    creado: new Date().toISOString(),
  });
  return id as number;
}

/** Guarda los cultivos anteriores de un terreno en orden (el primero es lo último que sembró). */
export async function guardarHistorial(cultivoId: number, ids: string[]) {
  const historial: HistorialCultivos = [ids[0] ?? null, ids[1] ?? null, ids[2] ?? null];
  await db.cultivos.update(cultivoId, { historial });
}

export async function cambiarIcono(cultivoId: number, icono: string) {
  await db.cultivos.update(cultivoId, { icono });
}

export async function alternarMiSemilla(id: string) {
  const existe = await db.misSemillas.get(id);
  if (existe) await db.misSemillas.delete(id);
  else await db.misSemillas.put({ id, agregada: new Date().toISOString() });
}

export async function agregarMiSemilla(id: string) {
  if (!(await db.misSemillas.get(id))) await db.misSemillas.put({ id, agregada: new Date().toISOString() });
}

export async function quitarMiSemilla(id: string) {
  await db.misSemillas.delete(id);
}

/** Cambia el nombre o el ícono de un cultivo. */
export async function actualizarCultivo(cultivoId: number, cambios: Partial<Pick<Cultivo, "nombre" | "icono">>) {
  await db.cultivos.update(cultivoId, cambios);
}
