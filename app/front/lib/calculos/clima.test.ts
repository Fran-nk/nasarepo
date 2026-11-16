import { describe, expect, it } from "vitest";
import type { DiaPronostico } from "@/app/front/lib/fuentes/openMeteo";
import type { DiaMedido } from "@/app/front/lib/fuentes/power";
import {
  calcularAlertas,
  calcularSemaforo,
  calcularVsNormal,
  categoriaLluvia,
  categoriaTemperatura,
  cieloDelDia,
  corregirPorAltura,
  decidirRiego,
  lluviaMensualMm,
  lluviaProximosDias,
  semanaDesdePronostico,
} from "./clima";

/** Semana tranquila desde el 2026-11-15; `cambios` modifica días puntuales. */
function semana(cambios: Record<number, Partial<DiaPronostico>> = {}): DiaPronostico[] {
  return Array.from({ length: 7 }, (_, i) => ({
    fecha: `2026-11-${15 + i}`,
    codigo: 3,
    lluvia_mm: 0,
    prob_lluvia: 0.1,
    tmin: 8,
    tmax: 22,
    ...cambios[i],
  }));
}

/** Días seguidos con el mismo valor, desde una fecha. */
function dias(desde: string, cuantos: number, valor: number): DiaMedido[] {
  const d0 = new Date(`${desde}T12:00:00Z`);
  return Array.from({ length: cuantos }, (_, i) => {
    const d = new Date(d0);
    d.setUTCDate(d0.getUTCDate() + i);
    return { fecha: d.toISOString().slice(0, 10), valor };
  });
}

const DOCE = (v: number) => Array(12).fill(v) as number[];

describe("corrección de temperatura por altura", () => {
  it("baja 6.5 °C por cada 1,000 m (celda de Cusco 3,740 m → ciudad 3,350 m)", () => {
    expect(corregirPorAltura(8.5, 3740, 3350)).toBeCloseTo(8.5 + 2.535, 2);
    expect(corregirPorAltura(10, 3000, 3500)).toBeCloseTo(6.75, 5);
  });
  it("no pasa de ±5 °C", () => {
    expect(corregirPorAltura(22, 1051, 92)).toBe(27);
    expect(corregirPorAltura(10, 0, 3000)).toBe(5);
  });
  it("sin alturas no corrige", () => {
    expect(corregirPorAltura(12, null, 3000)).toBe(12);
  });
});

describe("cielo y semana", () => {
  it.each([
    [0, 0, "sol"],
    [1, 0.5, "sol"],
    [3, 0.9, "nubes"],
    [61, 1, "lluvia"],
    [81, 9.9, "lluvia"],
    [61, 15, "tormenta"],
    [95, 2, "tormenta"],
  ] as const)("código %i con %f mm → %s", (codigo, mm, cielo) => {
    expect(cieloDelDia(codigo, mm)).toBe(cielo);
  });

  it("redondea temperaturas y suma la lluvia de los próximos días", () => {
    const s = semana({ 0: { tmin: 7.6, tmax: 21.4, lluvia_mm: 2.26 }, 1: { lluvia_mm: 3 } });
    expect(semanaDesdePronostico(s)[0]).toMatchObject({ tmin: 8, tmax: 21, lluvia_mm: 2.3, cielo: "lluvia" });
    expect(lluviaProximosDias(s, 3)).toBe(5.3);
  });
});

describe("alertas", () => {
  it("sin peligros no hay alertas", () => {
    expect(calcularAlertas(semana())).toEqual([]);
  });

  it("helada: 0 °C es atención y -3 °C peligro", () => {
    expect(calcularAlertas(semana({ 2: { tmin: 0.5 } }))).toEqual([]);
    expect(calcularAlertas(semana({ 2: { tmin: 0 } }))[0]).toMatchObject({ tipo: "helada", nivel: "atencion" });
    expect(calcularAlertas(semana({ 2: { tmin: -3 } }))[0]).toMatchObject({ tipo: "helada", nivel: "peligro" });
  });

  it("junta días seguidos y toma el peor nivel", () => {
    const a = calcularAlertas(semana({ 1: { tmin: -1 }, 2: { tmin: -4 }, 3: { tmin: -1 }, 5: { tmin: -1 } }));
    expect(a).toEqual([
      { tipo: "helada", nivel: "peligro", desde: "2026-11-16", hasta: "2026-11-18" },
      { tipo: "helada", nivel: "atencion", desde: "2026-11-20", hasta: "2026-11-20" },
    ]);
  });

  it("lluvia fuerte desde 20 mm y peligro desde 40 mm", () => {
    expect(calcularAlertas(semana({ 0: { lluvia_mm: 19.9 } }))).toEqual([]);
    expect(calcularAlertas(semana({ 0: { lluvia_mm: 20 } }))[0]).toMatchObject({ tipo: "lluvia_fuerte", nivel: "atencion" });
    expect(calcularAlertas(semana({ 0: { lluvia_mm: 40 } }))[0]).toMatchObject({ nivel: "peligro" });
  });

  it("calor desde 36 °C (34–35 °C es normal en la selva)", () => {
    expect(calcularAlertas(semana({ 0: { tmax: 35 } }))).toEqual([]);
    expect(calcularAlertas(semana({ 0: { tmax: 36 } }))[0]).toMatchObject({ tipo: "calor", nivel: "atencion" });
    expect(calcularAlertas(semana({ 0: { tmax: 38 } }))[0]).toMatchObject({ nivel: "peligro" });
  });

  it("granizo solo cuando el pronóstico lo dice (códigos 96 y 99)", () => {
    expect(calcularAlertas(semana({ 0: { codigo: 95 } }))).toEqual([]);
    expect(calcularAlertas(semana({ 0: { codigo: 96 } }))[0]).toMatchObject({ tipo: "granizo" });
  });

  it("sequía: tierra más seca que lo normal y sin lluvia en la semana", () => {
    expect(calcularAlertas(semana(), { actual: 0.4, normal: 0.5 })).toEqual([]);
    expect(calcularAlertas(semana(), { actual: 0.35, normal: 0.5 })[0]).toMatchObject({
      tipo: "sequia",
      nivel: "atencion",
      desde: "2026-11-15",
      hasta: "2026-11-21",
    });
    expect(calcularAlertas(semana(), { actual: 0.2, normal: 0.5 })[0]).toMatchObject({ nivel: "peligro" });
    // Si va a llover, no es sequía.
    expect(calcularAlertas(semana({ 3: { lluvia_mm: 8 } }), { actual: 0.2, normal: 0.5 })).toEqual([]);
  });

  it("nunca inventa huaico", () => {
    const todo = calcularAlertas(semana({ 0: { lluvia_mm: 90, codigo: 99 } }), { actual: 0.1, normal: 0.6 });
    expect(todo.some((a) => a.tipo === "huaico")).toBe(false);
  });
});

describe("riego", () => {
  it.each([
    [0.2, 0, "si"],
    [0.45, 0, "poco"],
    [0.2, 4, "poco"],
    [0.65, 0, "no"],
    [0.2, 10, "no"],
  ] as const)("humedad %f y %f mm en 3 días → %s", (h, mm, esperado) => {
    expect(decidirRiego(h, mm)).toBe(esperado);
  });
});

describe("semáforo de siembra", () => {
  const base = { dias: semana({ 1: { lluvia_mm: 6 } }), humedad: 0.5, lluviaNormalMm: DOCE(80), mes: 11, zona: "quechua" as const };

  it("verde con lluvia y sin peligros", () => {
    expect(calcularSemaforo(base)).toEqual({ color: "verde", motivo: "buena_lluvia" });
  });
  it("rojo con helada fuerte, lluvia excesiva o calor extremo", () => {
    expect(calcularSemaforo({ ...base, dias: semana({ 4: { tmin: -3 } }) })).toEqual({ color: "rojo", motivo: "riesgo_helada" });
    expect(calcularSemaforo({ ...base, dias: semana({ 0: { lluvia_mm: 45 } }) })).toEqual({ color: "rojo", motivo: "lluvia_excesiva" });
    expect(calcularSemaforo({ ...base, dias: semana({ 0: { tmax: 38 } }) })).toEqual({ color: "rojo", motivo: "mucho_calor" });
  });
  it("si hay alguna alerta en la semana, nunca da verde (Piura con El Niño: 35 mm en un día)", () => {
    const lluviosa = semana({ 0: { lluvia_mm: 35 }, 2: { lluvia_mm: 24 } });
    expect(calcularAlertas(lluviosa).length).toBeGreaterThan(0);
    expect(calcularSemaforo({ ...base, dias: lluviosa })).toEqual({ color: "amarillo", motivo: "lluvia_excesiva" });
    for (const cambio of [{ tmin: 0 }, { tmin: -3 }, { tmax: 36 }, { lluvia_mm: 20 }, { lluvia_mm: 40 }]) {
      const dias = semana({ 3: cambio });
      expect(calcularAlertas(dias).length).toBeGreaterThan(0);
      expect(calcularSemaforo({ ...base, dias }).color).not.toBe("verde");
    }
  });
  it("amarillo con helada leve o poca lluvia", () => {
    expect(calcularSemaforo({ ...base, dias: semana({ 4: { tmin: -1 } }) })).toMatchObject({ color: "amarillo", motivo: "riesgo_helada" });
    expect(calcularSemaforo({ ...base, dias: semana(), humedad: 0.3 })).toMatchObject({ color: "amarillo", motivo: "poca_lluvia" });
  });
  it("fuera de temporada en la sierra si este mes y el siguiente son secos", () => {
    const seco = DOCE(80).map((v, i) => (i === 5 || i === 6 ? 10 : v));
    expect(calcularSemaforo({ ...base, mes: 6, lluviaNormalMm: seco })).toEqual({ color: "amarillo", motivo: "fuera_de_temporada" });
    // En la costa se siembra con riego: no aplica.
    expect(calcularSemaforo({ ...base, mes: 6, lluviaNormalMm: seco, zona: "chala" }).motivo).not.toBe("fuera_de_temporada");
  });
});

describe("este año vs. lo normal", () => {
  const normales = { lluviaNormalDia: DOCE(2), tempNormal: DOCE(10) };

  it("compara solo los días medidos del mes (lo normal también se prorratea)", () => {
    const r = calcularVsNormal({
      lluvia: [...dias("2026-10-20", 12, 9), ...dias("2026-11-01", 12, 4)],
      temperatura: dias("2026-11-01", 12, 11.5),
      ...normales,
    });
    expect(r).toMatchObject({
      mes: 11,
      desde: "2026-11-01",
      hasta: "2026-11-12",
      lluvia_mm: 48,
      lluvia_normal_mm: 24, // 12 días × 2 mm, no el mes entero
      temp_media: 11.5,
      temp_normal: 10,
      lluvia: "mas_lluvioso",
      temperatura: "mas_calido",
    });
  });

  it("a inicio de mes usa el mes anterior completo", () => {
    const r = calcularVsNormal({ lluvia: [...dias("2026-10-01", 31, 1), ...dias("2026-11-01", 3, 9)], temperatura: [], ...normales });
    expect(r).toMatchObject({ mes: 10, desde: "2026-10-01", hasta: "2026-10-31", lluvia_mm: 31, lluvia_normal_mm: 62, lluvia: "mas_seco" });
  });

  it("en enero con pocos días mira diciembre del año anterior", () => {
    const r = calcularVsNormal({ lluvia: [...dias("2025-12-01", 31, 2), ...dias("2026-01-01", 2, 2)], temperatura: [], ...normales });
    expect(r).toMatchObject({ mes: 12, hasta: "2025-12-31", lluvia: "normal" });
  });

  it("aplica la corrección de altura a ambas temperaturas", () => {
    const r = calcularVsNormal({ lluvia: dias("2026-11-01", 10, 2), temperatura: dias("2026-11-01", 10, 10), ...normales, correccionTemp: 2.5 });
    expect(r).toMatchObject({ temp_media: 12.5, temp_normal: 12.5, temperatura: "normal" });
  });

  it("sin días medidos avisa", () => {
    expect(() => calcularVsNormal({ lluvia: [], temperatura: [], ...normales })).toThrow();
  });

  it("en meses secos pocos mm no cuentan como diferencia", () => {
    expect(categoriaLluvia(8, 2)).toBe("normal"); // 4 veces más, pero solo 6 mm
    expect(categoriaLluvia(20, 5)).toBe("mas_lluvioso");
    expect(categoriaLluvia(40, 80)).toBe("mas_seco");
    expect(categoriaLluvia(70, 80)).toBe("normal");
    expect(categoriaTemperatura(1)).toBe("mas_calido");
    expect(categoriaTemperatura(-1)).toBe("mas_frio");
    expect(categoriaTemperatura(0.9)).toBe("normal");
  });

  it("pasa mm por día a mm por mes", () => {
    const m = lluviaMensualMm(DOCE(1));
    expect(m[0]).toBe(31);
    expect(m[1]).toBe(28);
    expect(m[3]).toBe(30);
  });
});
