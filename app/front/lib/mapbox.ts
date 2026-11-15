export const TOKEN_MAPBOX = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
export const HAY_TOKEN_MAPBOX = TOKEN_MAPBOX.length > 0;

/** Estilo del mapa: el del equipo en Mapbox Studio, o el que se indique en .env.local. */
export const ESTILO_MAPBOX =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE || "mapbox://styles/franks12/cmwh63kzv01oq01s6bv7f4qea";
