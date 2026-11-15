"use client";

import type { Actividad } from "@/lib/almacen";
import type { Semilla } from "@/lib/contratos/tipos";
import { ACTIVIDADES } from "@/lib/textos";

const MESES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Índice de mes absoluto (año*12 + mes) para comparar fechas por mes. */
const mesAbs = (iso: string) => {
  const [a, m] = iso.split("-").map(Number);
  return a * 12 + (m - 1);
};

function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

interface Fila {
  clave: string;
  titulo: string;
  emoji: string;
  inicio?: number; // mes de siembra
  cosecha?: number; // mes de cosecha
  marcas: Map<number, string[]>; // mes → emojis de actividades
}

/**
 * Línea de tiempo de 12 meses (desde 2 meses atrás): una fila por cada siembra
 * anotada (siembra 🌱 → crecimiento → cosecha 🧺) con las actividades encima.
 */
export function LineaTiempo({ actividades, porId }: { actividades: Actividad[]; porId: Map<string, Semilla> }) {
  const hoy = new Date();
  const mesHoy = hoy.getFullYear() * 12 + hoy.getMonth();
  const desde = mesHoy - 2;
  const columnas = Array.from({ length: 12 }, (_, i) => desde + i);

  const filas: Fila[] = [];
  const porSemilla = new Map<string, Fila>();
  const general: Fila = { clave: "general", titulo: "Toda la chacra", emoji: "🏡", marcas: new Map() };

  for (const a of [...actividades].sort((x, y) => x.fecha.localeCompare(y.fecha))) {
    const s = a.semillaId ? porId.get(a.semillaId) : undefined;
    let fila = general;
    if (s) {
      if (a.tipo === "sembre" || !porSemilla.has(s.id)) {
        fila = { clave: `${s.id}-${a.id}`, titulo: s.nombre, emoji: s.emoji, marcas: new Map() };
        if (a.tipo === "sembre") {
          fila.inicio = mesAbs(a.fecha);
          fila.cosecha = mesAbs(sumarDias(a.fecha, s.ciclo_dias));
        }
        porSemilla.set(s.id, fila);
        filas.push(fila);
      } else {
        fila = porSemilla.get(s.id)!;
      }
    }
    const m = mesAbs(a.fecha);
    fila.marcas.set(m, [...(fila.marcas.get(m) ?? []), ACTIVIDADES[a.tipo].emoji]);
  }
  if (general.marcas.size > 0) filas.push(general);

  if (filas.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-4 text-center text-lg text-stone-600">
        Todavía no anotaste nada. Toca “Anotar actividad” y empieza con lo que sembraste.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white p-3">
      <table className="w-full min-w-[22rem] border-separate border-spacing-0.5 text-center">
        <thead>
          <tr>
            <th className="w-24" />
            {columnas.map((c) => (
              <th key={c} className={`text-xs font-semibold ${c === mesHoy ? "rounded bg-green-700 text-white" : "text-stone-500"}`}>
                {MESES[c % 12]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.clave}>
              <th className="truncate pr-1 text-left text-sm font-semibold">
                {f.emoji} {f.titulo}
              </th>
              {columnas.map((c) => {
                const creciendo = f.inicio !== undefined && f.cosecha !== undefined && c >= f.inicio && c <= f.cosecha;
                const marcas = f.marcas.get(c);
                let simbolo = marcas?.join("") ?? "";
                if (!simbolo && c === f.cosecha) simbolo = "🧺";
                return (
                  <td
                    key={c}
                    className={`h-9 rounded text-sm ${creciendo ? "bg-green-200" : "bg-stone-50"} ${c === f.cosecha ? "bg-amber-200" : ""}`}
                    title={c === f.cosecha ? "Cosecha estimada" : undefined}
                  >
                    {simbolo}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-stone-500">🟩 Creciendo · 🟨 Cosecha estimada · el mes verde de arriba es hoy</p>
    </div>
  );
}
