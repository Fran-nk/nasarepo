import { describe, expect, it } from "vitest";
import type { DiaMedido } from "@/app/front/lib/fuentes/power";
import { anomaliasDiarias, condicionNino, efectoEnZona, magnitudCalida, magnitudFria, promedioPorFecha, resumenMar } from "./elNino";

/** 120 días seguidos (hasta el 2026-11-12): los primeros con `antes`, los últimos `ultimos` con `despues`. */
function serie(antes: number, despues = antes, ultimos = 0): DiaMedido[] {
  const fin = new Date("2026-11-12T12:00:00Z");
  return Array.from({ length: 120 }, (_, i) => {
    const d = new Date(fin);
    d.setUTCDate(fin.getUTCDate() - (119 - i));
    return { fecha: d.toISOString().slice(0, 10), valor: i >= 120 - ultimos ? despues : antes };
  });
}

describe("anomalía del mar", () => {
  it("resta el promedio del mes de cada día", () => {
    const normal = Array.from({ length: 12 }, (_, i) => 20 + i);
    const a = anomaliasDiarias(
      [
        { fecha: "2026-01-31", valor: 22 },
        { fecha: "2026-11-01", valor: 27 },
      ],
      normal,
    );
    expect(a.map((d) => d.valor)).toEqual([2, -3]);
  });

  it("promedia varios puntos por fecha, aunque a alguno le falte un día", () => {
    const p = promedioPorFecha([
      [
        { fecha: "2026-11-02", valor: 1 },
        { fecha: "2026-11-01", valor: 3 },
      ],
      [{ fecha: "2026-11-01", valor: 5 }],
    ]);
    expect(p).toEqual([
      { fecha: "2026-11-01", valor: 4 },
      { fecha: "2026-11-02", valor: 1 },
    ]);
  });
});

describe("umbrales tipo ICEN", () => {
  it.each([
    [0.39, null],
    [0.4, "debil"],
    [1, "moderada"],
    [1.7, "fuerte"],
    [3, "extraordinaria"],
  ] as const)("cálido %f → %s", (a, m) => expect(magnitudCalida(a)).toBe(m));

  it.each([
    [-0.99, null],
    [-1, "debil"],
    [-1.2, "moderada"],
    [-1.4, "fuerte"],
  ] as const)("frío %f → %s", (a, m) => expect(magnitudFria(a)).toBe(m));
});

describe("condición estimada", () => {
  it("sin anomalía: no activo", () => {
    expect(condicionNino(serie(0.1))).toMatchObject({ estado: "no_activo", anomalia_c: 0.1, hasta: "2026-11-12" });
  });

  it("3 meses cálidos: alerta de El Niño con su magnitud", () => {
    expect(condicionNino(serie(2))).toMatchObject({ estado: "alerta", fenomeno: "nino_costero", magnitud: "fuerte" });
  });

  it("solo el último mes cálido: vigilancia", () => {
    const c = condicionNino(serie(0, 1, 20)); // 20 días cálidos: pasa en el último mes, no en 3 meses
    expect(c).toMatchObject({ estado: "vigilancia", fenomeno: "nino_costero", anomalia_30d_c: 0.67 });
    expect(c.anomalia_c).toBeLessThan(0.4);
  });

  it("3 meses fríos: alerta de La Niña", () => {
    expect(condicionNino(serie(-1.3))).toMatchObject({ estado: "alerta", fenomeno: "nina_costera", magnitud: "moderada" });
  });

  it("noviembre 2022 (La Niña) y junio 2023 (El Niño costero), con los valores de NASA POWER", () => {
    expect(condicionNino(serie(-1.23)).fenomeno).toBe("nina_costera");
    expect(condicionNino(serie(3.22)).magnitud).toBe("extraordinaria");
  });

  it("sin datos avisa", () => {
    expect(() => condicionNino([])).toThrow();
  });
});

describe("resumen del mar", () => {
  it("temperatura del último mes y lo normal para esos días", () => {
    const medido = serie(21, 27, 30);
    const anomalias = serie(0, 5.5, 30);
    expect(resumenMar(medido, anomalias)).toEqual({ mar_c: 27, mar_normal_c: 21.5 });
  });
  it("sin datos avisa", () => {
    expect(() => resumenMar([], [])).toThrow();
  });
});

describe("efecto en la zona", () => {
  const nino = { estado: "alerta" as const, fenomeno: "nino_costero" as const };
  it("costa norte: más lluvia; resto de la costa: más calor", () => {
    expect(efectoEnZona({ ...nino, zona: "chala", lat: -5.1, vertiente: "pacifico" })).toBe("mas_lluvia");
    expect(efectoEnZona({ ...nino, zona: "chala", lat: -12, vertiente: "pacifico" })).toBe("mas_calor");
  });
  it("en la sierra y la selva no adivina", () => {
    expect(efectoEnZona({ ...nino, zona: "suni", lat: -15.8, vertiente: "amazonia" })).toBe("sin_efecto_claro");
    expect(efectoEnZona({ ...nino, zona: "quechua", lat: -13.5, vertiente: "amazonia" })).toBe("sin_efecto_claro");
    expect(efectoEnZona({ ...nino, zona: "omagua", lat: -6.5, vertiente: "amazonia" })).toBe("sin_efecto_claro");
  });
  it("La Niña costera: sin efecto claro", () => {
    expect(efectoEnZona({ estado: "alerta", fenomeno: "nina_costera", zona: "chala", lat: -5, vertiente: "pacifico" })).toBe("sin_efecto_claro");
  });
  it("sin El Niño no hay efecto", () => {
    expect(efectoEnZona({ estado: "no_activo", fenomeno: "nino_costero", zona: "chala", lat: -5, vertiente: "pacifico" })).toBe("sin_efecto_claro");
  });
});
