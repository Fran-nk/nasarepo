import { describe, expect, it, vi } from "vitest";
import { protegerQuitar } from "./quitarDibujo";

/** Imita MapboxDraw.onRemove: pregunta por sus capas y luego limpia sus eventos. */
function controlFalso() {
  const limpiar = vi.fn();
  const control = {
    onRemove(map: { style?: unknown; getLayer: (id: string) => unknown; getSource: (id: string) => unknown }) {
      if (map.getLayer("gl-draw-polygon-fill")) throw new Error("no debería quedar ninguna capa");
      map.getSource("mapbox-gl-draw-cold");
      limpiar();
      return this;
    },
  };
  return { control, limpiar };
}

/** Mapa de Mapbox ya desmontado: sin estilo, getLayer revienta como en el error real. */
function mapaSinEstilo() {
  const estilo: { getOwnLayer: () => unknown } | undefined = undefined;
  return {
    style: estilo,
    getLayer: () => (estilo as unknown as { getOwnLayer: () => unknown }).getOwnLayer(),
    getSource: () => (estilo as unknown as { getOwnSource: () => unknown }).getOwnSource(),
  };
}

describe("quitar el control de dibujo", () => {
  it("sin protección reproduce el error de getOwnLayer", () => {
    const { control } = controlFalso();
    expect(() => control.onRemove(mapaSinEstilo())).toThrow(/getOwnLayer/);
  });

  it("con el mapa ya desmontado no falla y limpia igual", () => {
    const { control, limpiar } = controlFalso();
    const mapa = mapaSinEstilo();
    const getLayer = mapa.getLayer;
    protegerQuitar(control);
    expect(() => control.onRemove(mapa)).not.toThrow();
    expect(limpiar).toHaveBeenCalledOnce();
    expect(mapa.getLayer).toBe(getLayer); // deja el mapa como estaba
  });

  it("con el mapa vivo usa sus capas de verdad", () => {
    const { control, limpiar } = controlFalso();
    const getLayer = vi.fn(() => undefined);
    const getSource = vi.fn(() => undefined);
    protegerQuitar(control).onRemove({ style: {}, getLayer, getSource });
    expect(getLayer).toHaveBeenCalledWith("gl-draw-polygon-fill");
    expect(getSource).toHaveBeenCalled();
    expect(limpiar).toHaveBeenCalledOnce();
  });
});
