import { catalogoSemillas } from "@/app/back/semillas";

/** Catálogo de semillas con los rangos de la FAO (ECOCROP). Datos fijos: se genera al compilar. */
export function GET(): Response {
  return Response.json({ version_api: "1", ...catalogoSemillas() });
}
