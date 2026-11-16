/**
 * Pedidos a las fuentes públicas (NASA POWER, Open-Meteo, Mapbox).
 * Varias tarjetas piden lo mismo para el mismo punto: cada URL se pide una sola vez
 * y la respuesta se reutiliza un rato. Si falla, se olvida para poder reintentar.
 */
const VIGENCIA_MS = 30 * 60 * 1000;
const ESPERA_MAX_MS = 20_000;

const memoria = new Map<string, { hasta: number; respuesta: Promise<unknown> }>();

export async function pedirJson<T>(url: string, ahora = Date.now()): Promise<T> {
  const guardado = memoria.get(url);
  if (guardado && guardado.hasta > ahora) return guardado.respuesta as Promise<T>;

  const respuesta = (async () => {
    const res = await fetch(url, { signal: AbortSignal.timeout(ESPERA_MAX_MS) });
    if (!res.ok) throw new Error(`La fuente de datos respondió ${res.status}`);
    return (await res.json()) as T;
  })();
  memoria.set(url, { hasta: ahora + VIGENCIA_MS, respuesta });
  respuesta.catch(() => memoria.delete(url));
  return respuesta;
}

/** Solo para pruebas. */
export function olvidarPedidos() {
  memoria.clear();
}
