import { describe, expect, it } from "vitest";
import { catalogoSemillas, combinarCatalogo } from "./semillas";
import ecocrop from "./datos/ecocrop.json";

describe("catálogo de semillas con ECOCROP", () => {
  const { semillas, fuente } = catalogoSemillas();
  const porId = new Map(semillas.map((s) => [s.id, s]));

  it("29 especies con datos de la FAO y 3 que ECOCROP no tiene", () => {
    expect(semillas.filter((s) => s.ecocrop)).toHaveLength(29);
    for (const id of ["sacha_inchi", "choloque", "camu_camu"]) {
      expect(porId.get(id)?.ecocrop).toBeUndefined();
      expect(porId.get(id)?.fuente).toMatch(/no tiene/);
    }
    expect(fuente?.proveedor).toMatch(/ECOCROP/);
  });

  it("usa los valores reales de la FAO (papa: crece mejor entre 15 y 25 °C)", () => {
    const papa = porId.get("papa")!;
    expect(papa.ecocrop).toMatchObject({
      cientifico_ecocrop: "Solanum tuberosum L.",
      temperatura_c: { min: 7, optima_min: 15, optima_max: 25, max: 30 },
      temperatura_mata_c: -1,
    });
    // La ficha curada se mantiene (nombre, altura, rotación).
    expect(papa.nombre).toBe("Papa");
    expect(papa.altura_min_m).toBeGreaterThan(0);
  });

  it("los rangos están ordenados (mínimo ≤ óptimo ≤ máximo)", () => {
    for (const [id, e] of Object.entries(ecocrop.especies)) {
      const t = e.temperatura_c;
      const l = e.lluvia_ciclo_mm;
      expect(t.min <= t.optima_min && t.optima_min <= t.optima_max && t.optima_max <= t.max, id).toBe(true);
      expect(l.min <= l.optima_min && l.optima_min <= l.optima_max && l.optima_max <= l.max, id).toBe(true);
      expect(e.ciclo_dias[0] <= e.ciclo_dias[1], id).toBe(true);
    }
  });

  it("no cambia las semillas sin datos", () => {
    const sin = combinarCatalogo([{ ...porId.get("papa")!, ecocrop: undefined }], {});
    expect(sin[0].ecocrop).toBeUndefined();
  });
});
