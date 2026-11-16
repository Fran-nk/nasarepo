import { describe, expect, it } from "vitest";
import puntos from "./datos/contexto_puntos.json";
import cultivos from "./datos/catalogo_cultivos.json";
import { construirVariables, recomendar } from "./recomendaciones";
import spec from "./modelo/artefactos/feature-spec.json";

describe("recomendaciones", () => {
  it("construye las 106 variables del candidato en un ciclo que cruza el año", () => {
    const p = puntos[0], c = cultivos[0];
    const v = construirVariables(p, 12, [c], c);
    expect(spec.features).toHaveLength(106);
    for (const f of spec.features) expect(Number.isFinite(v[f.nombre])).toBe(true);
    expect(v[`zona_${p.zona}`]).toBe(1);
    expect(v[`prev1_familia_${c.familia}`]).toBe(1);
    expect(v.lluvia_ciclo_mm).toBeCloseTo([11, 0, 1, 2, 3].reduce((s, i) => s + p.lluvia_mm[i], 0));
  });
  it("ordena hasta cinco y declara el contexto aproximado", async () => {
    const p = puntos[0];
    const resultado = await recomendar(p.latitud, p.longitud, 1, [cultivos[0].cultivo_id]);
    expect(resultado.recomendaciones).toHaveLength(5);
    expect(resultado.recomendaciones.every((r, i, a) => i === 0 || a[i - 1].porcentaje_afinidad >= r.porcentaje_afinidad)).toBe(true);
    expect(resultado.avisos.some((a) => a.codigo === "CONTEXTO_APROXIMADO")).toBe(true);
    await expect(recomendar(0, 0, 1, [])).rejects.toMatchObject({ codigo: "DATOS_NO_DISPONIBLES" });
    await expect(recomendar(p.latitud, p.longitud, 1, ["desconocido"])).rejects.toMatchObject({ codigo: "CULTIVO_DESCONOCIDO" });
  });
});
