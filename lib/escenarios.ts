/** Escenarios de demostración (solo se usan con datos de prueba). */
import cusco from "@/mocks/escenarios/cusco.json";
import piuraNino from "@/mocks/escenarios/piura-nino.json";
import punoHelada from "@/mocks/escenarios/puno-helada.json";

export type IdEscenario = "cusco" | "piura-nino" | "puno-helada";

export const ESCENARIOS = {
  cusco: { nombre: cusco.nombre, punto: cusco.punto, datos: cusco },
  "piura-nino": { nombre: piuraNino.nombre, punto: piuraNino.punto, datos: piuraNino },
  "puno-helada": { nombre: punoHelada.nombre, punto: punoHelada.punto, datos: punoHelada },
} satisfies Record<IdEscenario, { nombre: string; punto: { lat: number; lon: number }; datos: unknown }>;

export const LISTA_ESCENARIOS = Object.keys(ESCENARIOS) as IdEscenario[];
export const ESCENARIO_INICIAL: IdEscenario = "cusco";
