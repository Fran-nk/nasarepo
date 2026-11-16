import type { Map as MapaGL } from "mapbox-gl";

/**
 * Vista satélite: solo la imagen satelital de Mapbox, sin calles, etiquetas ni rellenos del estilo.
 * Lo único que queda encima es el terreno que dibuja el usuario (capas de Mapbox Draw).
 */

export type Vista = "mapa" | "satelite";

const ID_SATELITE = "vista-satelite";

const ocultasPorVista = new WeakMap<MapaGL, string[]>();

/** Capas de Mapbox Draw y los terrenos guardados: se dejan visibles en las dos vistas. */
function esDelDibujo(capa: { id: string; source?: unknown }): boolean {
  const fuente = typeof capa.source === "string" ? capa.source : "";
  return capa.id.startsWith("gl-draw-") || fuente.startsWith("mapbox-gl-draw") || fuente === "terrenos";
}

function asegurarSatelite(mapa: MapaGL) {
  if (!mapa.getSource(ID_SATELITE)) {
    mapa.addSource(ID_SATELITE, { type: "raster", url: "mapbox://mapbox.satellite", tileSize: 256 });
  }
  if (!mapa.getLayer(ID_SATELITE)) {
    // Justo encima del fondo; el resto del estilo se oculta, así que queda debajo del dibujo.
    const primera = mapa.getStyle()?.layers?.find((l) => l.type !== "background")?.id;
    mapa.addLayer({ id: ID_SATELITE, type: "raster", source: ID_SATELITE }, primera);
  }
}

/** Cambia entre la vista de mapa (estilo de Studio) y la vista 100 % satelital. */
export function aplicarVista(mapa: MapaGL, vista: Vista) {
  if (vista === "satelite") {
    asegurarSatelite(mapa);
    mapa.setLayoutProperty(ID_SATELITE, "visibility", "visible");
    const ocultas: string[] = [];
    for (const capa of mapa.getStyle()?.layers ?? []) {
      if (capa.id === ID_SATELITE || esDelDibujo(capa)) continue;
      if (mapa.getLayoutProperty(capa.id, "visibility") !== "none") {
        mapa.setLayoutProperty(capa.id, "visibility", "none");
        ocultas.push(capa.id);
      }
    }
    ocultasPorVista.set(mapa, [...(ocultasPorVista.get(mapa) ?? []), ...ocultas]);
  } else {
    if (mapa.getLayer(ID_SATELITE)) mapa.setLayoutProperty(ID_SATELITE, "visibility", "none");
    for (const id of ocultasPorVista.get(mapa) ?? []) {
      if (mapa.getLayer(id)) mapa.setLayoutProperty(id, "visibility", "visible");
    }
    ocultasPorVista.delete(mapa);
  }
}
