import { errorApi, validarContexto } from "@/app/back/http";

export async function POST(request: Request): Promise<Response> {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return errorApi(400, "SOLICITUD_INVALIDA", "El cuerpo debe ser JSON válido.");
  }
  const problema = validarContexto(cuerpo);
  if (problema) return errorApi(400, "SOLICITUD_INVALIDA", problema);
  return errorApi(503, "DATOS_NO_DISPONIBLES", "Aún faltan el catálogo y las fuentes ambientales para generar recomendaciones.");
}
