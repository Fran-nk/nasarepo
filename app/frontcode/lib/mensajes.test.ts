import { describe, expect, it } from "vitest";
import type { DiaClima } from "./contratos/tipos";
import { cuandoDia, fraseRiego, fraseSemana, fraseVsNormal, evitarPorFila, motivoCorto, motivosComunes, rangoDias } from "./mensajes";

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
    const riego = { regar: "si" as const, humedad_suelo: 0.1, humedad_fecha: "2026-11-12", lluvia_3dias_mm: 0, fuente: "" };
    expect(fraseRiego(riego, [dia("2026-11-16", "sol")], HOY)).toBe("La tierra está seca y no se espera lluvia pronto.");
  });

  it("compara con otros años", () => {
    expect(
      fraseVsNormal({
        mes: 11, desde: "2026-11-01", hasta: "2026-11-12", lluvia_mm: 10, lluvia_normal_mm: 50, temp_media: 8, temp_normal: 9,
        lluvia: "mas_seco", temperatura: "mas_frio", fuente: "",
      }, 11),
    ).toBe("Este mes está más seco y más frío que otros años.");
    expect(
      fraseVsNormal({
        mes: 10, desde: "2026-10-01", hasta: "2026-10-31", lluvia_mm: 60, lluvia_normal_mm: 60, temp_media: 9, temp_normal: 9,
        lluvia: "normal", temperatura: "normal", fuente: "",
      }, 11),
    ).toBe("El mes pasado estuvo igual que otros años.");
  });
});

describe("motivo corto de una semilla recomendada", () => {
  const haba = { ciclo_dias: 160 };
  it("usa el primer motivo, que es el más importante", () => {
    expect(motivoCorto({ motivos: ["fija_nitrogeno", "comun_en_zona"] }, haba)).toBe("Abona tu tierra sola");
  });
  it("dice después de qué va bien, con el nombre de lo sembrado", () => {
    expect(motivoCorto({ motivos: ["rota_bien"] }, haba, { ultimo: { nombre: "Papa" } })).toBe("Va bien después de papa");
    expect(motivoCorto({ motivos: ["rota_bien"] }, haba)).toBe("Va bien después de lo que sembraste");
  });
  it("da los meses hasta la cosecha", () => {
    expect(motivoCorto({ motivos: ["ciclo_corto"] }, { ciclo_dias: 110 })).toBe("Cosecha en 4 meses");
  });
  it("agrega si ya tiene la semilla", () => {
    expect(motivoCorto({ motivos: ["aguanta_helada"] }, haba, { tengo: true })).toBe("Aguanta las heladas · Ya la tienes");
    expect(motivoCorto({ motivos: [] }, haba, { tengo: true })).toBe("Ya tienes la semilla");
    expect(motivoCorto({ motivos: [] }, haba)).toBe("");
  });
});

describe("motivo que distingue a cada semilla", () => {
  const lista = [
    { motivos: ["rota_bien", "clima_ideal", "aprovecha_lluvias"] as const },
    { motivos: ["rota_bien", "clima_ideal", "comun_en_zona"] as const },
    { motivos: ["rota_bien", "aguanta_helada"] as const },
  ].map((r) => ({ motivos: [...r.motivos] }));
  it("encuentra lo que tienen todas", () => {
    expect([...motivosComunes(lista)]).toEqual(["rota_bien"]);
    expect(motivosComunes(lista.slice(0, 1)).size).toBe(0);
  });
  it("cada fila dice algo distinto (ni lo que tienen todas ni lo que ya dijo otra fila)", () => {
    const evitar = evitarPorFila(lista);
    const textos = lista.map((r, i) => motivoCorto(r, { ciclo_dias: 150 }, { evitar: evitar[i] }));
    expect(textos).toEqual(["Le va bien el clima de tu zona", "Se siembra mucho en tu zona", "Aguanta las heladas"]);
  });
  it("si no hay otro motivo, usa el compartido", () => {
    expect(motivoCorto({ motivos: ["rota_bien"] }, { ciclo_dias: 150 }, { evitar: new Set(["rota_bien"]) })).toBe(
      "Va bien después de lo que sembraste",
    );
  });
});
