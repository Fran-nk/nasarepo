import { cargarModelo } from "@/app/back/modelo/cargar";
import { validarEspecificacion } from "@/app/back/modelo/variables";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const modelo = await cargarModelo();
    if (modelo) validarEspecificacion(modelo);
    return Response.json({ version_api: "1", estado: "ok", catalogo_version: "dataset-v1", modelo_disponible: modelo !== null, pesos_cargados: modelo !== null });
  } catch {
    return Response.json({ version_api: "1", estado: "degradado", catalogo_version: null, modelo_disponible: false }, { status: 503 });
  }
}
