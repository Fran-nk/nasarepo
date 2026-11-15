import { cargarModelo } from "@/app/back/modelo/cargar";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const modelo = await cargarModelo();
    return Response.json({ version_api: "1", estado: "ok", catalogo_version: null, modelo_disponible: modelo !== null });
  } catch {
    return Response.json({ version_api: "1", estado: "degradado", catalogo_version: null, modelo_disponible: false }, { status: 503 });
  }
}
