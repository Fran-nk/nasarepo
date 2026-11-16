import { describe, expect, it } from "vitest";
import type { Semilla } from "@/app/frontcode/lib/contratos/tipos";
import catalogo from "@/app/frontcode/datos/semillas.json";
import { ajusteAltura, cultivosDeLaZona, mesesDelCultivo, motivosPorCatalogo, puntajeMargen, recomendar, type ClimaLugar } from "./recomendar";

const SEMILLAS = catalogo.semillas as Semilla[];
const ids = (r: { semillaId: string }[]) => r.map((x) => x.semillaId);

/** Sierra tipo Cusco: 3,350 m, media 11 °C, noches bajo cero en invierno, lluvias de octubre a marzo. */
const SIERRA: ClimaLugar = {
  altitud: 3350,
  tempMedia: [11, 11, 11, 11, 10, 10, 10, 10, 11, 11.5, 11.7, 11.3],
  tempMin: [3.6, 3.6, 3.5, 3.2, -0.3, -0.1, -2, -0.9, 1.5, 1.4, 4, 4],
  lluviaMes: [129, 126, 96, 44, 9, 4, 11, 8, 18, 63, 72, 137],
};

/** Selva baja tipo Tarapoto: 300 m, cálida y lluviosa todo el año. */
const SELVA: ClimaLugar = {
  altitud: 300,
  tempMedia: Array(12).fill(27),
  tempMin: Array(12).fill(19),
  lluviaMes: Array(12).fill(110),
};

describe("ayudas", () => {
  it("cuenta los meses del cultivo y da la vuelta al año", () => {
    expect(mesesDelCultivo({ ciclo_dias: 150, perenne: false }, 11)).toEqual([11, 12, 1, 2, 3]);
    expect(mesesDelCultivo({ ciclo_dias: 20, perenne: false }, 5)).toEqual([5]);
    expect(mesesDelCultivo({ ciclo_dias: 1095, perenne: true }, 3)).toHaveLength(12);
  });

  it("puntúa el margen de temperatura", () => {
    expect(puntajeMargen(5)).toBe(1);
    expect(puntajeMargen(0)).toBe(0.85);
    expect(puntajeMargen(-5)).toBe(0);
  });

  it("puntúa la altura: centro, borde, margen y fuera", () => {
    const papa = { altura_min_m: 2000, altura_max_m: 4200 };
    expect(ajusteAltura(papa, 3100)).toBe(1);
    expect(ajusteAltura(papa, 2000)).toBeCloseTo(0.8);
    expect(ajusteAltura(papa, 1800)).toBe(0.5);
    expect(ajusteAltura(papa, 1500)).toBe(0);
  });

  it("cultivos de la zona: los que crecen a esa altura, primero los comunes", () => {
    const c = cultivosDeLaZona(SEMILLAS, 3350);
    expect(c).toContain("papa");
    expect(c).not.toContain("cacao");
    const rarezas = c.map((id) => SEMILLAS.find((s) => s.id === id)!.rareza);
    expect(rarezas[0]).toBe("comun");
    const primeraRara = rarezas.findIndex((r) => r !== "comun");
    if (primeraRara >= 0) expect(rarezas.slice(primeraRara)).not.toContain("comun");
  });
});

describe("recomendar", () => {
  it("en la sierra recomienda cultivos andinos y no tropicales", () => {
    const r = recomendar({ semillas: SEMILLAS, clima: SIERRA, mes: 11, historial: [null, null, null] });
    expect(r.length).toBeGreaterThan(3);
    expect(ids(r)).not.toContain("cacao");
    expect(ids(r)).not.toContain("arroz");
    expect(r.every((x) => x.puntaje > 0 && x.puntaje <= 1)).toBe(true);
    expect(r.map((x) => x.puntaje)).toEqual(r.map((x) => x.puntaje).toSorted((a, b) => b - a));
  });

  it("en la selva recomienda cultivos tropicales y no andinos", () => {
    const r = recomendar({ semillas: SEMILLAS, clima: SELVA, mes: 11, historial: [null, null, null] });
    expect(ids(r)).toContain("yuca");
    expect(ids(r)).not.toContain("papa");
    expect(ids(r)).not.toContain("maca");
  });

  it("no repite el último cultivo ni lo que va mal después de él", () => {
    const papa = SEMILLAS.find((s) => s.id === "papa")!;
    const r = recomendar({ semillas: SEMILLAS, clima: SIERRA, mes: 11, historial: ["papa", null, null], maximo: 40 });
    for (const malo of ["papa", ...papa.despues_de_mal]) expect(ids(r)).not.toContain(malo);
  });

  it("premia lo que rota bien y lo explica", () => {
    const sin = recomendar({ semillas: SEMILLAS, clima: SIERRA, mes: 11, historial: [null, null, null], maximo: 40 });
    const con = recomendar({ semillas: SEMILLAS, clima: SIERRA, mes: 11, historial: ["papa", null, null], maximo: 40 });
    const haba = (r: typeof sin) => r.find((x) => x.semillaId === "haba")!;
    expect(haba(con).puntaje).toBeGreaterThan(haba(sin).puntaje);
    expect(haba(con).motivos[0]).toBe("rota_bien");
  });

  it("da un poco más a las semillas que el agricultor ya tiene", () => {
    const base = { semillas: SEMILLAS, clima: SIERRA, mes: 11, historial: [null, null, null], maximo: 40 };
    const sin = recomendar(base).find((x) => x.semillaId === "oca")!;
    const con = recomendar({ ...base, disponibles: ["oca"] }).find((x) => x.semillaId === "oca")!;
    expect(con.puntaje).toBeGreaterThan(sin.puntaje);
  });

  it("las especies en rescate siempre dicen por qué", () => {
    const r = recomendar({ semillas: SEMILLAS, clima: SIERRA, mes: 11, historial: [null, null, null], maximo: 40 });
    const rescate = r.filter((x) => x.en_rescate);
    expect(rescate.length).toBeGreaterThan(0);
    for (const x of rescate) {
      expect(x.motivos).toContain("especie_en_rescate");
      expect(x.motivos.length).toBeLessThanOrEqual(3);
    }
  });

  it("dice que aguanta la helada solo si hay heladas y la semilla las aguanta", () => {
    const r = recomendar({ semillas: SEMILLAS, clima: SIERRA, mes: 5, historial: [null, null, null], maximo: 40 });
    const conHelada = r.filter((x) => x.motivos.includes("aguanta_helada"));
    for (const x of conHelada) expect(SEMILLAS.find((s) => s.id === x.semillaId)!.stats.frio).toBeGreaterThanOrEqual(3);
    const selva = recomendar({ semillas: SEMILLAS, clima: SELVA, mes: 5, historial: [null, null, null], maximo: 40 });
    expect(selva.some((x) => x.motivos.includes("aguanta_helada"))).toBe(false);
  });
});

describe("motivos que salen solo del catálogo (para las semillas que elige el modelo)", () => {
  const por = (id: string) => SEMILLAS.find((s) => s.id === id)!;
  it("rotación, zona y abono natural", () => {
    expect(motivosPorCatalogo(por("haba"), { ultimo: "papa", comunes: ["haba"] })).toEqual(["rota_bien", "comun_en_zona", "fija_nitrogeno"]);
  });
  it("sin historial ni zona no inventa motivos", () => {
    expect(motivosPorCatalogo(por("papa"), {})).toEqual([]);
  });
  it("las especies en rescate siempre lo dicen, con a lo más 3 motivos", () => {
    const m = motivosPorCatalogo(por("tarwi"), { ultimo: "papa", comunes: ["tarwi"], enRescate: true });
    expect(m).toHaveLength(3);
    expect(m.at(-1)).toBe("especie_en_rescate");
  });
  it("ciclo corto solo en lo que no es perenne", () => {
    expect(motivosPorCatalogo({ ...por("arveja"), ciclo_dias: 100 }, {})).toContain("ciclo_corto");
    expect(motivosPorCatalogo({ ...por("arveja"), ciclo_dias: 100, perenne: true }, {})).not.toContain("ciclo_corto");
  });
});
