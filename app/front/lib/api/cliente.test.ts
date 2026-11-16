/**
 * El cliente completo con las fuentes simuladas: fetch devuelve respuestas reales guardadas
 * (NASA POWER y Open-Meteo para Cusco, noviembre 2026). No sale a internet.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import climatologia from "@/app/front/lib/fuentes/ejemplos/power-climatologia-cusco.json";
import diario from "@/app/front/lib/fuentes/ejemplos/power-diario-cusco.json";
import pronostico from "@/app/front/lib/fuentes/ejemplos/openmeteo-cusco.json";
import { olvidarPedidos } from "@/app/front/lib/fuentes/red";
import {
  fechaRelativa,
  obtenerAlertas,
  obtenerContexto,
  obtenerElNino,
  obtenerRecomendaciones,
  obtenerRiego,
  obtenerSemaforo,
  obtenerSemana,
  obtenerSemillas,
  obtenerVsNormal,
} from "./cliente";

const CUSCO = { lat: -13.53, lon: -71.97 };
const json = (d: unknown) => new Response(JSON.stringify(d));

/** Temperatura del mar: 2 °C sobre lo normal todos los días (El Niño fuerte). */
function marCaliente(url: URL) {
  if (url.pathname.includes("climatology")) {
    const mes = Object.fromEntries(["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"].map((m) => [m, 22]));
    return { properties: { parameter: { TS: mes } } };
  }
  const inicio = url.searchParams.get("start")!;
  const d0 = new Date(Date.UTC(+inicio.slice(0, 4), +inicio.slice(4, 6) - 1, +inicio.slice(6, 8)));
  const serie: Record<string, number> = {};
  for (let i = 0; i < 100; i++) {
    const d = new Date(d0);
    d.setUTCDate(d0.getUTCDate() + i);
    serie[d.toISOString().slice(0, 10).replaceAll("-", "")] = 24;
  }
  return { properties: { parameter: { TS: serie } } };
}

/** Responde según la fuente; `caidas` hace fallar las que se indiquen. */
function fuentes(caidas: ("power" | "openmeteo")[] = []) {
  return vi.fn(async (entrada: string | URL | Request) => {
    const url = new URL(String(entrada));
    if (url.hostname === "power.larc.nasa.gov") {
      if (caidas.includes("power")) return new Response("caído", { status: 503 });
      if (url.searchParams.get("parameters") === "TS") return json(marCaliente(url));
      return json(url.pathname.includes("climatology") ? climatologia : diario);
    }
    if (url.hostname === "api.open-meteo.com") {
      if (caidas.includes("openmeteo")) return new Response("caído", { status: 503 });
      return json(pronostico);
    }
    throw new Error(`URL inesperada en la prueba: ${url}`);
  });
}

beforeEach(() => olvidarPedidos());
afterEach(() => vi.unstubAllGlobals());

describe("con las fuentes respondiendo", () => {
  beforeEach(() => vi.stubGlobal("fetch", fuentes()));

  it("contexto: altura real del terreno, zona y cultivos de la zona", async () => {
    const c = await obtenerContexto(CUSCO);
    expect(c.altitud_m).toBe(Math.round(pronostico.elevation));
    expect(c.zona).toBe("quechua");
    expect(c.cultivos_comunes).toContain("papa");
    expect(c.lugar).toBe("13.53° S, 71.97° O"); // sin token de Mapbox en las pruebas
  });

  it("semana: los 7 días del pronóstico", async () => {
    const s = await obtenerSemana(CUSCO);
    expect(s.dias.map((d) => d.fecha)).toEqual(pronostico.daily.time);
    expect(s.dias[0].cielo).toBe("lluvia"); // 9.9 mm
    expect(s.fuente).toMatch(/Open-Meteo/);
  });

  it("riego: humedad del último día medido por la NASA", async () => {
    const r = await obtenerRiego(CUSCO);
    expect(r.humedad_fecha).toBe("2026-11-12"); // el 13, 14 y 15 llegan como -999
    expect(r.humedad_suelo).toBe(diario.properties.parameter.GWETROOT["20261112"]);
    expect(r.lluvia_3dias_mm).toBe(11.2);
    expect(r.regar).toBe("no");
  });

  it("vs. lo normal: del 1 al 12 de noviembre, con lo normal de esos 12 días", async () => {
    const v = await obtenerVsNormal(CUSCO);
    const normalDia = climatologia.properties.parameter.PRECTOTCORR.NOV;
    expect(v).toMatchObject({ mes: 11, desde: "2026-11-01", hasta: "2026-11-12" });
    expect(v.lluvia_normal_mm).toBe(Math.round(normalDia * 12));
    expect(v.lluvia).toBe("mas_lluvioso");
    // La celda de POWER está ~390 m más alta que Cusco: la temperatura se sube ~2.5 °C.
    expect(v.temp_normal).toBeCloseTo(climatologia.properties.parameter.T2M.NOV + 2.5, 0);
  });

  it("alertas: ninguna en esta semana de Cusco", async () => {
    const a = await obtenerAlertas(CUSCO);
    expect(a.alertas).toEqual([]);
    expect(a.fuente).toMatch(/NASA POWER/);
  });

  it("semáforo: verde con las lluvias de noviembre", async () => {
    await expect(obtenerSemaforo(CUSCO, 11)).resolves.toMatchObject({ color: "verde", motivo: "buena_lluvia" });
  });

  it("El Niño: estimado con el mar de la NASA, enlaza al aviso oficial", async () => {
    const n = await obtenerElNino(CUSCO);
    expect(n).toMatchObject({ estado: "alerta", fenomeno: "nino_costero", magnitud: "fuerte", anomalia_c: 2, efecto_zona: "sin_efecto_claro" }); // Cusco: sierra, no se adivina
    expect(n.fuente).toMatch(/estimación/);
    expect(n.aviso_oficial_url).toMatch(/enfen/);
    // Datos para el gráfico: 24 °C medidos contra 22 °C normales.
    expect(n).toMatchObject({ mar_c: 24, mar_normal_c: 22 });
    expect(n.serie.length).toBeGreaterThan(80);
    expect(n.serie.every((d) => d.anomalia_c === 2)).toBe(true);
    expect(n.puntos).toHaveLength(4);
    expect(new URL(n.datos_url).hostname).toBe("power.larc.nasa.gov");
    expect(n.fuente_url).toMatch(/power\.larc\.nasa\.gov/);
  });

  it("recomendaciones: reglas con el clima de la NASA y la rotación", async () => {
    const r = await obtenerRecomendaciones({ ...CUSCO, mes: 11, historial: ["papa", null, null] });
    expect(r.modelo).toMatch(/NASA POWER/);
    expect(r.recomendaciones.length).toBeGreaterThan(2);
    expect(r.recomendaciones.map((x) => x.semillaId)).not.toContain("papa");
  });

  it("catálogo de semillas", async () => {
    expect((await obtenerSemillas()).semillas.length).toBeGreaterThan(20);
  });
});

describe("cuando una fuente falla", () => {
  it("sin NASA POWER las alertas siguen con el pronóstico", async () => {
    vi.stubGlobal("fetch", fuentes(["power"]));
    const a = await obtenerAlertas(CUSCO);
    expect(a.fuente).toBe("Pronóstico Open-Meteo");
  });

  it("sin NASA POWER el riego avisa con error (la pantalla muestra lo guardado o reintentar)", async () => {
    vi.stubGlobal("fetch", fuentes(["power"]));
    await expect(obtenerRiego(CUSCO)).rejects.toThrow(/503/);
  });

  it("sin Open-Meteo la altura sale de NASA POWER", async () => {
    vi.stubGlobal("fetch", fuentes(["openmeteo"]));
    const c = await obtenerContexto(CUSCO);
    expect(c.altitud_m).toBe(Math.round(climatologia.geometry.coordinates[2]));
  });

  it("sin ninguna fuente no inventa datos", async () => {
    vi.stubGlobal("fetch", fuentes(["power", "openmeteo"]));
    await expect(obtenerSemana(CUSCO)).rejects.toThrow();
    await expect(obtenerContexto(CUSCO)).rejects.toThrow();
    await expect(obtenerElNino(CUSCO)).rejects.toThrow();
  });
});

describe("fechas", () => {
  it("calcula días antes y después en hora local", () => {
    const hoy = new Date(2026, 10, 15);
    expect(fechaRelativa(0, hoy)).toBe("2026-11-15");
    expect(fechaRelativa(-45, hoy)).toBe("2026-10-01");
    expect(fechaRelativa(20, hoy)).toBe("2026-12-05");
  });
});
