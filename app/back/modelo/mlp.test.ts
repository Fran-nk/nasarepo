import { describe, expect, it } from "vitest";
import { cargarModelo } from "./cargar";
import { puntuar, validarModelo } from "./mlp";
import { normalizarVariables, validarEspecificacion } from "./variables";
import casos from "./artefactos/casos-referencia.json";
import spec from "./artefactos/feature-spec.json";

describe("modelo MLP", () => {
  it("carga el artefacto entrenado y evalúa un vector normalizado", async () => {
    const modelo = await cargarModelo();
    expect(modelo).not.toBeNull();
    expect(modelo!.inputSize).toBe(106);
    const resultado = puntuar(modelo!, Array(106).fill(0));
    expect(Number.isFinite(resultado)).toBe(true);
    expect(resultado).toBeGreaterThanOrEqual(0);
    expect(resultado).toBeLessThanOrEqual(1);
    expect(() => puntuar(modelo!, [0])).toThrow();
  });

  it("rechaza matrices con dimensiones incompatibles", () => {
    expect(() => validarModelo({ version: "1", featureSpecVersion: "1", inputSize: 2, layers: [{ pesos: [[1]], bias: [0], activacion: "sigmoid" }] })).toThrow();
  });

  it("reproduce los casos exportados de Keras y normaliza en el orden acordado", async () => {
    const modelo = (await cargarModelo())!;
    validarEspecificacion(modelo);
    expect(casos.length).toBeGreaterThan(0);
    for (const caso of casos) {
      expect(puntuar(modelo, caso.entrada_normalizada)).toBeCloseTo(caso.salida, 5);
      const crudos = Object.fromEntries(spec.features.map((f, i) => [f.nombre, caso.entrada_normalizada[i] * f.escala + f.media]));
      expect(puntuar(modelo, normalizarVariables(modelo, crudos))).toBeCloseTo(caso.salida, 5);
    }
    expect(() => normalizarVariables(modelo, {})).toThrow();
  });
});
