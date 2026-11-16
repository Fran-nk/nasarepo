/**
 * Catálogo de semillas: la ficha curada por el equipo (nombres, usos, rotación, altura, cómo guardar
 * la semilla) + los rangos reales de la FAO (ECOCROP) para las especies que figuran ahí.
 * Función pura sin APIs de Node: la usa la ruta GET /api/v1/semillas y, si la ruta no responde,
 * el cliente del frontend, para que el catálogo sea el mismo en los dos casos.
 */
import curadas from "@/app/frontcode/datos/semillas.json";
import ecocrop from "./datos/ecocrop.json";
import type { ParametrosEcocrop, RespuestaSemillas, Semilla } from "@/app/frontcode/lib/contratos/tipos";

export const FUENTE_ECOCROP = {
  proveedor: `${ecocrop.fuente} (${ecocrop.via})`,
  url: ecocrop.url,
  extraido: ecocrop.extraido,
};

const FUENTE_CURADA = "Ficha del equipo (ECOCROP de la FAO no tiene esta especie)";
const FUENTE_MIXTA = "Rangos de temperatura, lluvia, ciclo y pH: FAO ECOCROP · Altura, usos y rotación: ficha del equipo";

export function combinarCatalogo(
  semillas: Semilla[],
  rangos: Record<string, ParametrosEcocrop | undefined>,
): Semilla[] {
  return semillas.map((s) => {
    const r = rangos[s.id];
    return r ? { ...s, ecocrop: r, fuente: FUENTE_MIXTA } : { ...s, fuente: FUENTE_CURADA };
  });
}

export function catalogoSemillas(): RespuestaSemillas {
  return {
    semillas: combinarCatalogo(
      curadas.semillas as Semilla[],
      ecocrop.especies as unknown as Record<string, ParametrosEcocrop>,
    ),
    fuente: FUENTE_ECOCROP,
  };
}
