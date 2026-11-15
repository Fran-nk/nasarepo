/** Datos del agricultor guardados solo en su dispositivo (IndexedDB con Dexie). */
"use client";

import Dexie, { type EntityTable } from "dexie";
import type { Polygon } from "geojson";
import { ACTIVIDADES } from "@/lib/textos";

export interface Chacra {
  id: "principal";
  lat: number;
  lon: number;
  poligono?: Polygon;
  area_ha?: number;
  origen: "poligono" | "ubicacion";
}

export interface Historial {
  id: "principal";
  /** [último, penúltimo, antepenúltimo] — null = ninguno */
  cultivos: [string | null, string | null, string | null];
}

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

class BaseLocal extends Dexie {
  chacra!: EntityTable<Chacra, "id">;
  historial!: EntityTable<Historial, "id">;
  misSemillas!: EntityTable<MiSemilla, "id">;
  actividades!: EntityTable<Actividad, "id">;

  constructor() {
    super("semilla-siguiente");
    this.version(1).stores({
      chacra: "id",
      historial: "id",
      misSemillas: "id",
      actividades: "++id, fecha, tipo, semillaId",
    });
  }
}

export const db = new BaseLocal();

export const HISTORIAL_VACIO: Historial["cultivos"] = [null, null, null];

export async function guardarCultivoHistorial(posicion: 0 | 1 | 2, semillaId: string | null) {
  const actual = (await db.historial.get("principal"))?.cultivos ?? HISTORIAL_VACIO;
  const cultivos = [...actual] as Historial["cultivos"];
  cultivos[posicion] = semillaId;
  await db.historial.put({ id: "principal", cultivos });
}

export async function alternarMiSemilla(id: string) {
  const existe = await db.misSemillas.get(id);
  if (existe) await db.misSemillas.delete(id);
  else await db.misSemillas.put({ id, agregada: new Date().toISOString() });
}
