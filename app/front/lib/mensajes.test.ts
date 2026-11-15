import { describe, expect, it } from "vitest";
import type { DiaClima } from "./contratos/tipos";
import { cuandoDia, fraseRiego, fraseSemana, fraseVsNormal, rangoDias } from "./mensajes";

const HOY = "2026-11-16"; // lunes
const dia = (fecha: string, cielo: DiaClima["cielo"]): DiaClima => ({
  fecha,
  cielo,
  lluvia_mm: 0,
  prob_lluvia: 0,
  tmin: 5,
  tmax: 20,
});

describe("frases sencillas", () => {
  it("nombra los días como se dicen", () => {
    expect(cuandoDia("2026-11-16", HOY)).toBe("hoy");
    expect(cuandoDia("2026-11-17", HOY)).toBe("mañana");
    expect(cuandoDia("2026-11-19", HOY)).toBe("el jueves");
    expect(rangoDias("2026-11-16", "2026-11-19", HOY)).toBe("desde hoy hasta el jueves");
  });

  it("resume la lluvia de la semana", () => {
    const dias = [dia("2026-11-16", "sol"), dia("2026-11-17", "lluvia"), dia("2026-11-19", "tormenta")];
    expect(fraseSemana(dias, HOY)).toBe("Lloverá 2 días esta semana. El jueves lloverá fuerte.");
    expect(fraseSemana([dia("2026-11-16", "sol")], HOY)).toBe("No se espera lluvia esta semana.");
  });

  it("explica el riego sin números", () => {
    const riego = { regar: "si" as const, humedad_suelo: 0.1, lluvia_3dias_mm: 0, fuente: "" };
    expect(fraseRiego(riego, [dia("2026-11-16", "sol")], HOY)).toBe("La tierra está seca y no se espera lluvia pronto.");
  });

  it("compara con otros años", () => {
    expect(
      fraseVsNormal({
        mes: 11, lluvia_mm: 10, lluvia_normal_mm: 50, temp_media: 8, temp_normal: 9,
        lluvia: "mas_seco", temperatura: "mas_frio", fuente: "",
      }),
    ).toBe("Este mes está más seco y más frío que otros años.");
  });
});
