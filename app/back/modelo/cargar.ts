import artefacto from "./artefactos/modelo.json";
import { type ArtefactoMLP, validarModelo } from "./mlp";

let pendiente: Promise<ArtefactoMLP | null> | undefined;

export function cargarModelo(): Promise<ArtefactoMLP | null> {
  pendiente ??= (async () => {
    try {
      const modelo = artefacto as ArtefactoMLP;
      validarModelo(modelo);
      return modelo;
    } catch (error) {
      throw error;
    }
  })();
  return pendiente;
}
