"use client";

import type { Actividad } from "@/app/frontcode/lib/almacen";
import type { Semilla } from "@/app/frontcode/lib/contratos/tipos";
import { ACTIVIDADES } from "@/app/frontcode/lib/textos";

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
  const general: Fila = { clave: "general", titulo: "Todo el terreno", emoji: "🏡", marcas: new Map() };

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
      <p className="rounded-[12px] border-[0.5px] border-dashed border-borde bg-arena/50 p-3 text-center text-[13px] leading-[18px] text-secundario">
        Todavía no anotaste nada. Toca “Anotar actividad” y empieza con lo que sembraste.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto [scrollbar-width:none]">
      <table className="w-full min-w-[18rem] border-separate border-spacing-0.5 text-center">
        <thead>
          <tr>
            <th className="w-20" />
            {columnas.map((c) => (
              <th
                key={c}
                className={`font-titulo text-[12px] leading-[16px] font-bold ${c === mesHoy ? "bg-tinta text-white" : "text-secundario"}`}
              >
                {MESES[c % 12]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.clave}>
              <th className="max-w-20 truncate pr-1 text-left font-titulo text-[13px] leading-[16px] font-bold text-tinta">
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
                    className={`h-8 rounded-[3px] text-[13px] ${c === f.cosecha ? "bg-senal" : creciendo ? "bg-pradera/60" : "bg-arena"}`}
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
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-[14px] text-secundario">
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-2.5 rounded-[2px] bg-pradera/60" />
          Creciendo
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-2.5 rounded-[2px] bg-senal" />
          Cosecha estimada
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-2.5 rounded-[2px] bg-tinta" />
          Este mes
        </span>
      </p>
    </div>
  );
}
