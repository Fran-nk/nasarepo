import especificacion from "./artefactos/feature-spec.json";
import type { ArtefactoMLP } from "./mlp";

export function validarEspecificacion(modelo: ArtefactoMLP): void {
  const variables = especificacion.features;
  if (especificacion.version !== modelo.featureSpecVersion || variables.length !== modelo.inputSize ||
      new Set(variables.map((v) => v.nombre)).size !== variables.length ||
      variables.some((v) => !v.nombre || !Number.isFinite(v.media) || !Number.isFinite(v.escala) || v.escala <= 0)) {
    throw new Error("Especificación de variables incompatible con el modelo");
  }
}

export function normalizarVariables(modelo: ArtefactoMLP, valores: Record<string, number>): number[] {
  validarEspecificacion(modelo);
  return especificacion.features.map(({ nombre, media, escala }) => {
    const valor = valores[nombre];
    if (typeof valor !== "number" || !Number.isFinite(valor)) throw new Error(`Variable ausente o inválida: ${nombre}`);
    return (valor - media) / escala;
  });
}
