import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type ArtefactoMLP, validarModelo } from "./mlp";

let pendiente: Promise<ArtefactoMLP | null> | undefined;

export function cargarModelo(): Promise<ArtefactoMLP | null> {
  pendiente ??= (async () => {
    try {
      const archivo = join(process.cwd(), "app", "back", "modelo", "artefactos", "modelo.json");
      const modelo = JSON.parse(await readFile(archivo, "utf8")) as ArtefactoMLP;
      validarModelo(modelo);
      return modelo;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  })();
  return pendiente;
}
