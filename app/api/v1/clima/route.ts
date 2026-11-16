import { obtenerClima } from "@/app/back/clima";
import { errorApi } from "@/app/back/http";

export async function GET(request: Request): Promise<Response> {
  const parametros = new URL(request.url).searchParams;
  const lat = parametros.get("latitud");
  const lon = parametros.get("longitud");
  const diasTexto = parametros.get("dias");
  if (lat === null || lon === null || !lat.trim() || !lon.trim()) return errorApi(400, "SOLICITUD_INVALIDA", "Se requieren latitud y longitud.");
  const latitud = Number(lat), longitud = Number(lon), dias = diasTexto === null ? 16 : Number(diasTexto);
  if (!Number.isFinite(latitud) || latitud < -90 || latitud > 90 || !Number.isFinite(longitud) || longitud < -180 || longitud > 180 || !Number.isInteger(dias) || dias < 7 || dias > 16) return errorApi(400, "SOLICITUD_INVALIDA", "Coordenadas o cantidad de días inválidas.");
  const resultado = await obtenerClima(latitud, longitud, dias);
  if (!resultado.historico_mensual && !resultado.pronostico_diario) return errorApi(503, "DATOS_NO_DISPONIBLES", "Las fuentes de clima no están disponibles.");
  return Response.json(resultado);
}
