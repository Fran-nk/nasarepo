import { afterEach, describe, expect, it, vi } from "vitest";
import { recomendar } from "../../../back/recomendaciones";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("cliente del modelo", () => {
  it("envía contexto e historial al endpoint real y adapta las cinco recomendaciones", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS_MODELO", "false");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    const solicitudes: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      solicitudes.push({ url, init });
      const body = JSON.parse(String(init.body));
      return Response.json(await recomendar(body.latitud, body.longitud, body.mes_siembra,
        (body.historial ?? []).map((h: { cultivo_id: string }) => h.cultivo_id)));
    }));

    const { obtenerContexto, obtenerRecomendaciones } = await import("./cliente");
    const punto = { lat: -18.25, lon: -70.25 };
    const contexto = await obtenerContexto(punto, "cusco");
    const resultado = await obtenerRecomendaciones({ ...punto, mes: 4, historial: ["papa", null, null] }, "cusco");

    expect(solicitudes).toHaveLength(2);
    expect(solicitudes.every((s) => s.url === "/api/v1/contexto" && s.init.method === "POST")).toBe(true);
    expect(JSON.parse(String(solicitudes[1].init.body)).historial).toEqual([{ cultivo_id: "papa" }]);
    expect(contexto.altitud_m).toBeGreaterThan(0);
    expect(resultado.modelo).toContain("red-neuronal");
    expect(resultado.recomendaciones).toHaveLength(5);
    expect(resultado.recomendaciones.every((r) => r.puntaje >= 0 && r.puntaje <= 1)).toBe(true);
  });
});
