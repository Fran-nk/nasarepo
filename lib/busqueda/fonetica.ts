/**
 * Búsqueda tolerante a la ortografía (RF 12).
 * Iguala sonidos que se confunden al escribir: LL/Y/I, H muda, B/V, S/C/Z,
 * G/J (ante e/i), QU/K/C fuerte, SH/CH, Ñ/NI, W/U y letras dobles.
 */

/** Convierte una palabra a su "clave de sonido". */
export function normalizarFonetico(texto: string): string {
  let s = texto.toLowerCase().trim();
  s = s.replace(/ñ/g, "ni");
  s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); // quita tildes y diéresis
  s = s.replace(/[^a-z]/g, "");

  s = s.replace(/sh/g, "§").replace(/ch/g, "§"); // sh y ch suenan igual (kiwisha = kiwicha)
  s = s.replace(/h/g, ""); // h muda
  s = s.replace(/ll/g, "i").replace(/y/g, "i"); // ll, y, i
  s = s.replace(/gu([ei])/g, "G$1").replace(/g([ei])/g, "j$1").replace(/G/g, "g"); // ge/gi = je/ji
  s = s.replace(/qu([ei])/g, "k$1").replace(/q/g, "k");
  s = s.replace(/c([ei])/g, "s$1").replace(/c/g, "k"); // ce/ci = se/si; ca/co/cu = ka/ko/ku
  s = s.replace(/z/g, "s").replace(/x/g, "ks");
  s = s.replace(/v/g, "b").replace(/w/g, "u");
  s = s.replace(/§/g, "ch");
  s = s.replace(/(.)\1+/g, "$1"); // letras dobles
  return s;
}

/** Distancia de edición (Levenshtein). */
export function distancia(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

function tolerancia(largo: number): number {
  if (largo <= 3) return 0;
  if (largo <= 6) return 1;
  return 2;
}

/** Puntaje de coincidencia (menor = mejor) o null si no coincide. */
export function puntajeCoincidencia(consulta: string, nombre: string): number | null {
  const q = normalizarFonetico(consulta);
  const n = normalizarFonetico(nombre);
  if (!q) return null;
  if (n === q) return 0;
  if (n.startsWith(q)) return 0.5; // escribiendo la palabra
  const tol = tolerancia(q.length);
  const completa = distancia(q, n);
  // comparar también contra el inicio del nombre (búsqueda mientras escribe)
  const prefijo = distancia(q, n.slice(0, q.length));
  // plural: "abas" ~ "aba"
  const sinS = q.endsWith("s") ? distancia(q.slice(0, -1), n) : Infinity;
  const mejor = Math.min(completa, prefijo + 0.5, sinS);
  return mejor <= tol ? 1 + mejor : null;
}

export interface ConNombres {
  id: string;
  nombre: string;
  nombres_locales: string[];
}

/** Busca en nombre y nombres locales; devuelve ordenado de mejor a peor. */
export function buscar<T extends ConNombres>(consulta: string, items: T[], limite = 8): T[] {
  if (!normalizarFonetico(consulta)) return [];
  return items
    .map((item) => {
      const puntajes = [item.nombre, ...item.nombres_locales]
        .map((n) => puntajeCoincidencia(consulta, n))
        .filter((p): p is number => p !== null);
      return { item, p: puntajes.length ? Math.min(...puntajes) : null };
    })
    .filter((x): x is { item: T; p: number } => x.p !== null)
    .sort((a, b) => a.p - b.p)
    .slice(0, limite)
    .map((x) => x.item);
}
