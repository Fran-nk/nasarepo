import { describe, expect, it } from "vitest";
import type { Feature, Polygon } from "geojson";
import { datosTerreno } from "./terreno";

/** Cuadrado de ~1.1 km de lado cerca de Cusco (0.01° ≈ 1.1 km). */
const cuadrado = (lado = 0.01): Feature<Polygon> => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-71.98, -13.54],
        [-71.98 + lado, -13.54],
        [-71.98 + lado, -13.54 + lado],
        [-71.98, -13.54 + lado],
        [-71.98, -13.54],
      ],
    ],
  },
});

describe("datos de un terreno", () => {
  it("centro en medio del polígono y área en hectáreas", () => {
    const d = datosTerreno(cuadrado())!;
    expect(d.lon).toBeCloseTo(-71.975, 3);
    expect(d.lat).toBeCloseTo(-13.535, 3);
    // 0.01° ≈ 1,082 m de este a oeste a esta latitud y ≈ 1,106 m de norte a sur → ≈ 120 ha.
    expect(d.area_ha).toBeGreaterThan(115);
    expect(d.area_ha).toBeLessThan(125);
  });

  it("al mover un punto cambian el centro y el área", () => {
    const antes = datosTerreno(cuadrado())!;
    const movido = cuadrado();
    movido.geometry.coordinates[0][2] = [-71.95, -13.51]; // la esquina noreste se aleja
    const despues = datosTerreno(movido)!;
    expect(despues.area_ha).toBeGreaterThan(antes.area_ha);
    expect(despues.lon).toBeGreaterThan(antes.lon);
    expect(despues.poligono).toBe(movido.geometry);
  });

  it("rechaza lo que no es un terreno", () => {
    expect(datosTerreno(undefined)).toBeNull();
    const linea = cuadrado();
    linea.geometry.coordinates[0] = linea.geometry.coordinates[0].slice(0, 3);
    expect(datosTerreno(linea)).toBeNull();
    expect(datosTerreno({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [0, 0] } })).toBeNull();
  });
});
