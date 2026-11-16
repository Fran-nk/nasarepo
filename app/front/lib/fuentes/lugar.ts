/**
 * Nombre del lugar con la búsqueda inversa de Mapbox (el mismo servicio del mapa, con el mismo token).
 * Sin token o sin respuesta, se muestran las coordenadas.
 */
import { TOKEN_MAPBOX } from "@/app/front/lib/mapbox";
import { pedirJson } from "./red";
import type { Punto } from "./power";

interface RespuestaGeocodificacion {
  features?: {
    properties?: {
      name?: string;
      feature_type?: string;
      context?: Record<string, { name?: string } | undefined>;
    };
  }[];
}

export function coordenadasLegibles(p: Punto): string {
  const lat = `${Math.abs(p.lat).toFixed(2)}° ${p.lat < 0 ? "S" : "N"}`;
  const lon = `${Math.abs(p.lon).toFixed(2)}° ${p.lon < 0 ? "O" : "E"}`;
  return `${lat}, ${lon}`;
}

/** "Lugar, Región" sin repetir nombres ("Departamento de Cusco" → "Cusco"). */
export function nombreDesdeGeocodificacion(r: RespuestaGeocodificacion): string | null {
  const props = r.features?.[0]?.properties;
  if (!props) return null;
  const ctx = props.context ?? {};
  const partes = [ctx.locality?.name ?? ctx.place?.name ?? props.name, ctx.district?.name, ctx.region?.name]
    .filter((s): s is string => Boolean(s?.trim()))
    .map((s) => s.replace(/^Departamento de /i, ""))
    .filter((s, i, todas) => todas.indexOf(s) === i);
  return partes.length ? partes.join(", ") : null;
}

export async function nombreLugar(p: Punto, token = TOKEN_MAPBOX): Promise<string> {
  if (!token) return coordenadasLegibles(p);
  const q = new URLSearchParams({
    longitude: p.lon.toFixed(4),
    latitude: p.lat.toFixed(4),
    language: "es",
    types: "locality,place,district,region",
    access_token: token,
  });
  try {
    const r = await pedirJson<RespuestaGeocodificacion>(`https://api.mapbox.com/search/geocode/v6/reverse?${q}`);
    return nombreDesdeGeocodificacion(r) ?? coordenadasLegibles(p);
  } catch {
    return coordenadasLegibles(p);
  }
}
