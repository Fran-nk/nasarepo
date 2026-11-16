import { errorApi, validarContexto } from "@/app/back/http";
import { ErrorContexto, recomendar } from "@/app/back/recomendaciones";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return errorApi(400, "SOLICITUD_INVALIDA", "El cuerpo debe ser JSON válido.");
  }
  const problema = validarContexto(cuerpo);
  if (problema) return errorApi(400, "SOLICITUD_INVALIDA", problema);
  const datos = cuerpo as { latitud: number; longitud: number; mes_siembra: number; limite?: number; clima?: unknown; historial?: { cultivo_id: string }[] };
  if (datos.clima !== undefined) return errorApi(400, "SOLICITUD_INVALIDA", "El clima proporcionado aún no es compatible con el modelo; omítelo para usar el contexto histórico de referencia.");
  try {
    return Response.json(await recomendar(datos.latitud, datos.longitud, datos.mes_siembra, (datos.historial ?? []).map((h) => h.cultivo_id), datos.limite));
  } catch (error) {
    if (error instanceof ErrorContexto) return errorApi(error.status, error.codigo, error.message);
    return errorApi(503, "DATOS_NO_DISPONIBLES", "No se pudo generar una recomendación con los datos disponibles.");
  }
}
