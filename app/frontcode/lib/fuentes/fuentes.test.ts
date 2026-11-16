import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import climatologia from "./ejemplos/power-climatologia-cusco.json";
import diario from "./ejemplos/power-diario-cusco.json";
import pronostico from "./ejemplos/openmeteo-cusco.json";
import { alturaCelda, diasMedidos, promediosMensuales, urlClimatologia, urlDiario, type RespuestaPower } from "./power";
import { alturaTerreno, diasPronostico, urlPronostico } from "./openMeteo";
import { coordenadasLegibles, nombreDesdeGeocodificacion, nombreLugar } from "./lugar";
import { olvidarPedidos, pedirJson } from "./red";

const CUSCO = { lat: -13.53, lon: -71.97 };

describe("NASA POWER", () => {
  it("arma las URL de climatología y de días medidos", () => {
    const c = new URL(urlClimatologia(CUSCO, ["T2M", "PRECTOTCORR"]));
    expect(c.origin + c.pathname).toBe("https://power.larc.nasa.gov/api/temporal/climatology/point");
    expect(c.searchParams.get("parameters")).toBe("T2M,PRECTOTCORR");
    expect(c.searchParams.get("latitude")).toBe("-13.53");

    const d = new URL(urlDiario(CUSCO, ["T2M"], "2026-10-01", "2026-11-15"));
    expect(d.searchParams.get("start")).toBe("20261001");
    expect(d.searchParams.get("end")).toBe("20261115");
  });

  it("lee los 12 promedios mensuales (sin el anual)", () => {
    const lluvia = promediosMensuales(climatologia, "PRECTOTCORR");
    expect(lluvia).toHaveLength(12);
    expect(lluvia[0]).toBe(climatologia.properties.parameter.PRECTOTCORR.JAN);
    expect(lluvia[11]).toBe(climatologia.properties.parameter.PRECTOTCORR.DEC);
  });

  it("falla si falta un mes o el valor es -999", () => {
    const roto: RespuestaPower = { properties: { parameter: { T2M: { ...climatologia.properties.parameter.T2M, JUL: -999 } } } };
    expect(() => promediosMensuales(roto, "T2M")).toThrow(/T2M/);
    expect(() => promediosMensuales({}, "T2M")).toThrow();
  });

  it("descarta los días -999 (aún sin procesar) y ordena por fecha", () => {
    const dias = diasMedidos(diario, "PRECTOTCORR");
    const crudos = Object.keys(diario.properties.parameter.PRECTOTCORR);
    expect(dias.length).toBeLessThan(crudos.length);
    expect(dias.every((d) => d.valor !== -999)).toBe(true);
    expect(dias.at(-1)!.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dias.map((d) => d.fecha)).toEqual(dias.map((d) => d.fecha).toSorted());
  });

  it("lee la altura de la celda (la de Cusco está más alta que la ciudad)", () => {
    expect(alturaCelda(climatologia)).toBeGreaterThan(3600);
    expect(alturaCelda({})).toBeNull();
  });
});

describe("Open-Meteo", () => {
  it("arma la URL con zona horaria del lugar", () => {
    const u = new URL(urlPronostico(CUSCO));
    expect(u.searchParams.get("forecast_days")).toBe("7");
    expect(u.searchParams.get("timezone")).toBe("auto");
  });

  it("convierte el pronóstico y la probabilidad a 0–1", () => {
    const dias = diasPronostico(pronostico);
    expect(dias).toHaveLength(7);
    expect(dias[0].fecha).toBe(pronostico.daily.time[0]);
    expect(dias[0].prob_lluvia).toBe(pronostico.daily.precipitation_probability_max[0] / 100);
    expect(dias.every((d) => d.prob_lluvia >= 0 && d.prob_lluvia <= 1)).toBe(true);
  });

  it("descarta días sin temperatura y avisa si no queda ninguno", () => {
    const incompleto = {
      daily: { ...pronostico.daily, temperature_2m_min: [null, ...pronostico.daily.temperature_2m_min.slice(1)] },
    };
    expect(diasPronostico(incompleto)).toHaveLength(6);
    expect(() => diasPronostico({ daily: { time: [] } })).toThrow();
  });

  it("da la altura del terreno", () => {
    expect(alturaTerreno(pronostico)).toBeGreaterThan(3200);
    expect(alturaTerreno({})).toBeNull();
  });
});

describe("Nombre del lugar", () => {
  it("muestra coordenadas legibles", () => {
    expect(coordenadasLegibles(CUSCO)).toBe("13.53° S, 71.97° O");
  });

  it("arma distrito, provincia y región sin repetir", () => {
    const r = {
      features: [
        {
          properties: {
            name: "San Sebastián",
            context: { locality: { name: "San Sebastián" }, district: { name: "Cusco" }, region: { name: "Cusco" } },
          },
        },
      ],
    };
    expect(nombreDesdeGeocodificacion(r)).toBe("San Sebastián, Cusco");
    const mapbox = {
      features: [{ properties: { name: "Santiago", context: { place: { name: "Santiago" }, region: { name: "Departamento de Cusco" } } } }],
    };
    expect(nombreDesdeGeocodificacion(mapbox)).toBe("Santiago, Cusco");
    expect(nombreDesdeGeocodificacion({ features: [] })).toBeNull();
  });

  it("sin token de Mapbox usa las coordenadas", async () => {
    await expect(nombreLugar(CUSCO, "")).resolves.toBe("13.53° S, 71.97° O");
  });
});

describe("Pedidos compartidos", () => {
  const fetchFalso = vi.fn();
  beforeEach(() => {
    olvidarPedidos();
    fetchFalso.mockReset();
    vi.stubGlobal("fetch", fetchFalso);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("pide cada URL una sola vez", async () => {
    fetchFalso.mockResolvedValue(new Response(JSON.stringify({ ok: 1 })));
    const [a, b] = await Promise.all([pedirJson("https://x.test/a"), pedirJson("https://x.test/a")]);
    expect(a).toEqual({ ok: 1 });
    expect(b).toEqual({ ok: 1 });
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it("vuelve a pedir pasada la vigencia", async () => {
    fetchFalso.mockImplementation(async () => new Response("{}"));
    await pedirJson("https://x.test/b", 0);
    await pedirJson("https://x.test/b", 31 * 60 * 1000);
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  it("si falla, avisa y permite reintentar", async () => {
    fetchFalso.mockResolvedValueOnce(new Response("caído", { status: 503 }));
    await expect(pedirJson("https://x.test/c")).rejects.toThrow(/503/);
    fetchFalso.mockResolvedValueOnce(new Response(JSON.stringify({ ok: 2 })));
    await expect(pedirJson("https://x.test/c")).resolves.toEqual({ ok: 2 });
  });
});
