import { describe, expect, it } from "vitest";
import { longitudDivisoria, vertiente, zonaPulgarVidal } from "./zona";

describe("vertiente (lado de los Andes)", () => {
  it.each([
    ["Piura", -5.19, -80.63, "pacifico"],
    ["Chiclayo", -6.77, -79.84, "pacifico"],
    ["Lima", -12.05, -77.04, "pacifico"],
    ["Moquegua", -17.19, -70.93, "pacifico"],
    ["Tacna", -18.01, -70.25, "pacifico"],
    ["Iquitos", -3.75, -73.25, "amazonia"],
    ["Tarapoto", -6.49, -76.37, "amazonia"],
    ["Jaén", -5.71, -78.81, "amazonia"],
    ["Quillabamba", -12.86, -72.69, "amazonia"],
    ["Puerto Maldonado", -12.6, -69.18, "amazonia"],
  ] as const)("%s → %s", (_, lat, lon, esperado) => {
    expect(vertiente(lat, lon)).toBe(esperado);
  });

  it("usa el extremo de la línea fuera del Perú", () => {
    expect(longitudDivisoria(0)).toBe(-79.9);
    expect(longitudDivisoria(-25)).toBe(-69.6);
  });
});

describe("zona de Pulgar Vidal", () => {
  it.each([
    ["Piura (90 m)", 90, -5.19, -80.63, "chala"],
    ["Chosica (860 m)", 860, -11.94, -76.7, "yunga_maritima"],
    ["Cusco (3,350 m)", 3350, -13.53, -71.97, "quechua"],
    ["Puno (3,820 m)", 3820, -15.84, -70.02, "suni"],
    ["Junín (4,100 m)", 4100, -11.16, -75.99, "puna"],
    ["Nevado (5,000 m)", 5000, -9.12, -77.6, "janca"],
    ["Iquitos (100 m)", 100, -3.75, -73.25, "omagua"],
    ["Tarapoto (300 m)", 300, -6.49, -76.37, "omagua"],
    ["Satipo (630 m)", 630, -11.25, -74.64, "rupa_rupa"],
    ["Quillabamba (1,050 m)", 1050, -12.86, -72.69, "yunga_fluvial"],
  ] as const)("%s → %s", (_, alt, lat, lon, esperado) => {
    expect(zonaPulgarVidal(alt, lat, lon)).toBe(esperado);
  });

  it("respeta los límites exactos de altura", () => {
    expect(zonaPulgarVidal(2299, -13.5, -72)).toBe("yunga_fluvial");
    expect(zonaPulgarVidal(2300, -13.5, -72)).toBe("quechua");
    expect(zonaPulgarVidal(3500, -13.5, -72)).toBe("suni");
    expect(zonaPulgarVidal(4000, -13.5, -72)).toBe("puna");
    expect(zonaPulgarVidal(4800, -13.5, -72)).toBe("janca");
    expect(zonaPulgarVidal(499, -12, -77)).toBe("chala");
    expect(zonaPulgarVidal(500, -12, -77)).toBe("yunga_maritima");
  });
});
