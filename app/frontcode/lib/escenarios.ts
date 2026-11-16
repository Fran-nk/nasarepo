/**
 * Lugares de ejemplo: dónde mira la app cuando el agricultor todavía no marcó ningún cultivo.
 * Solo es un punto: todos los datos que se muestran salen de las fuentes reales para ese punto.
 */
export type IdEscenario = "cusco" | "piura-nino" | "puno-helada";

export const ESCENARIOS = {
  cusco: { nombre: "Cusco · sierra (Quechua)", punto: { lat: -13.53, lon: -71.97 } },
  "piura-nino": { nombre: "Piura · costa norte", punto: { lat: -5.09, lon: -80.16 } },
  "puno-helada": { nombre: "Puno · altiplano", punto: { lat: -15.84, lon: -70.02 } },
} satisfies Record<IdEscenario, { nombre: string; punto: { lat: number; lon: number } }>;

export const LISTA_ESCENARIOS = Object.keys(ESCENARIOS) as IdEscenario[];
export const ESCENARIO_INICIAL: IdEscenario = "cusco";
