import { describe, expect, it } from "vitest";
import { semanas } from "./GraficoMar";

describe("tabla semana por semana del mar", () => {
  it("agrupa de 7 en 7 desde el último día, del más nuevo al más antiguo", () => {
    const serie = Array.from({ length: 10 }, (_, i) => ({ fecha: `2026-11-${String(i + 1).padStart(2, "0")}`, anomalia_c: i < 3 ? 1 : 2 }));
    expect(semanas(serie)).toEqual([
      { fecha: "2026-11-04", valor: 2 },
      { fecha: "2026-11-01", valor: 1 },
    ]);
  });
});
