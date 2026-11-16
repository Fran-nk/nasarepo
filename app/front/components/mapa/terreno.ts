/**
 * Datos de un terreno a partir de su polígono: centro (donde va el círculo del cultivo y desde donde se
 * piden el clima y la zona) y área. Se usa al dibujar un terreno nuevo y al guardar uno editado.
 */
import area from "@turf/area";
import centroid from "@turf/centroid";
import type { Feature, Polygon } from "geojson";
import type { Cultivo } from "@/app/front/lib/almacen";

export type DatosTerreno = Required<Pick<Cultivo, "lat" | "lon" | "poligono" | "area_ha">>;

/** null si no es un polígono cerrado de al menos 3 esquinas (por ejemplo, si se borraron puntos). */
export function datosTerreno(f: Feature | undefined): DatosTerreno | null {
  if (!f || f.geometry?.type !== "Polygon") return null;
  const anillo = f.geometry.coordinates[0];
  if (!anillo || anillo.length < 4) return null;
  const poligono = f.geometry as Polygon;
  const [lon, lat] = centroid(f as Feature<Polygon>).geometry.coordinates;
  return { lat, lon, poligono, area_ha: area(f as Feature<Polygon>) / 10_000 };
}
