/** Inferencia pequeña para los pesos exportados del MLP de Keras. Solo servidor. */
export type Activacion = "relu" | "sigmoid";
export interface Capa {
  pesos: number[][]; // [entrada][salida], formato Dense.get_weights()[0]
  bias: number[];
  activacion: Activacion;
}
export interface ArtefactoMLP {
  version: string;
  featureSpecVersion: string;
  inputSize: number;
  layers: Capa[];
}

export function validarModelo(modelo: ArtefactoMLP): void {
  if (!modelo.version || !modelo.featureSpecVersion || !Number.isInteger(modelo.inputSize) || modelo.inputSize < 1 || !modelo.layers.length) {
    throw new Error("Metadatos del modelo inválidos");
  }
  let entradas = modelo.inputSize;
  for (const [indice, capa] of modelo.layers.entries()) {
    const salidas = capa.bias.length;
    if (!salidas || capa.pesos.length !== entradas || capa.pesos.some((fila) => fila.length !== salidas) ||
      ![...capa.bias, ...capa.pesos.flat()].every(Number.isFinite)) {
      throw new Error(`Dimensiones o valores inválidos en capa ${indice}`);
    }
    if ((indice === modelo.layers.length - 1 ? "sigmoid" : "relu") !== capa.activacion) {
      throw new Error(`Activación inválida en capa ${indice}`);
    }
    entradas = salidas;
  }
  if (entradas !== 1) throw new Error("El MLP debe tener una salida");
}

export function puntuar(modelo: ArtefactoMLP, vector: number[]): number {
  if (vector.length !== modelo.inputSize || !vector.every(Number.isFinite)) throw new Error("Vector de entrada inválido");
  let valores = vector;
  for (const capa of modelo.layers) {
    valores = capa.bias.map((bias, j) => {
      const suma = valores.reduce((total, valor, i) => total + valor * capa.pesos[i][j], bias);
      return capa.activacion === "relu" ? Math.max(0, suma) : 1 / (1 + Math.exp(-suma));
    });
  }
  return valores[0];
}
