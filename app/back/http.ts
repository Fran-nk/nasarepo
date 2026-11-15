export function errorApi(status: number, codigo: string, mensaje: string): Response {
  return Response.json({ version_api: "1", error: { codigo, mensaje, detalles: [] } }, { status });
}

export function validarContexto(cuerpo: unknown): string | null {
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) return "Se requiere un objeto JSON";
  const datos = cuerpo as Record<string, unknown>;
  if (typeof datos.latitud !== "number" || !Number.isFinite(datos.latitud) || datos.latitud < -90 || datos.latitud > 90 ||
      typeof datos.longitud !== "number" || !Number.isFinite(datos.longitud) || datos.longitud < -180 || datos.longitud > 180) {
    return "Coordenadas inválidas";
  }
  if (!Number.isInteger(datos.mes_siembra) || (datos.mes_siembra as number) < 1 || (datos.mes_siembra as number) > 12) return "mes_siembra debe estar entre 1 y 12";
  if (datos.limite !== undefined && (!Number.isInteger(datos.limite) || (datos.limite as number) < 1 || (datos.limite as number) > 5)) return "limite debe estar entre 1 y 5";
  if (datos.historial !== undefined && (!Array.isArray(datos.historial) || datos.historial.length > 3 ||
      datos.historial.some((item: unknown) => !item || typeof item !== "object" || typeof (item as { cultivo_id?: unknown }).cultivo_id !== "string"))) return "historial inválido";
  return null;
}
