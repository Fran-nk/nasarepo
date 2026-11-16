import { describe, expect, it } from "vitest";
import { buscar, normalizarFonetico } from "./fonetica";
import catalogo from "../../datos/semillas.json";

const semillas = catalogo.semillas;
const primero = (q: string) => buscar(q, semillas)[0]?.id;

describe("normalizarFonetico", () => {
  it("iguala LL, Y e I", () => {
    expect(normalizarFonetico("olluco")).toBe(normalizarFonetico("oyuco"));
    expect(normalizarFonetico("yuca")).toBe(normalizarFonetico("iuca"));
  });
  it("trata la H como muda", () => {
    expect(normalizarFonetico("haba")).toBe(normalizarFonetico("aba"));
  });
  it("iguala B/V, S/Z/C y K/C/QU", () => {
    expect(normalizarFonetico("cebada")).toBe(normalizarFonetico("sevada"));
    expect(normalizarFonetico("yuka")).toBe(normalizarFonetico("yuca"));
    expect(normalizarFonetico("quinua")).toBe(normalizarFonetico("kinua"));
  });
  it("iguala SH y CH, y quita tildes", () => {
    expect(normalizarFonetico("kiwisha")).toBe(normalizarFonetico("kiwicha"));
    expect(normalizarFonetico("Maíz")).toBe(normalizarFonetico("maiz"));
  });
});

describe("buscar en el catálogo", () => {
  it.each([
    ["oyuco", "olluco"],
    ["abas", "haba"],
    ["kiwisha", "kiwicha"],
    ["chocho", "tarwi"],
    ["yuka", "yuca"],
    ["sevada", "cebada"],
    ["kinua", "quinua"],
    ["boliche", "choloque"],
    ["cañiwa", "canihua"],
  ])("'%s' encuentra %s", (consulta, esperado) => {
    expect(primero(consulta)).toBe(esperado);
  });

  it("no devuelve nada para texto sin parecido", () => {
    expect(buscar("xxxxxx", semillas)).toHaveLength(0);
  });
});
