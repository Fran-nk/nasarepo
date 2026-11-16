"use client";

import { useId, useState, type PointerEvent } from "react";
import type { RespuestaElNino } from "@/app/frontcode/lib/contratos/tipos";

/**
 * Los datos detrás de "¿Cómo está El Niño hoy?": temperatura del mar medida vs. lo normal,
 * la diferencia día a día de los últimos 3 meses (con los umbrales) y dónde cae en la escala.
 * Todo sale de NASA POWER; los enlaces llevan a los datos y al aviso oficial del ENFEN.
 */

const fmtCorto = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "UTC" });
const fechaCorta = (iso: string) => fmtCorto.format(new Date(`${iso}T12:00:00Z`)).replace(".", "");
const signo = (n: number, d = 1) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(d)}`;

/** Escalas tipo ICEN: cada tramo con su color (de menos a más intenso). */
const ESCALA_CALIDA = [
  { nombre: "Normal", desde: -Infinity, color: "bg-arena" },
  { nombre: "Débil", desde: 0.4, color: "bg-terracota/30" },
  { nombre: "Moderado", desde: 1, color: "bg-terracota/55" },
  { nombre: "Fuerte", desde: 1.7, color: "bg-terracota/80" },
  { nombre: "Extraord.", desde: 3, color: "bg-terracota-fuerte" },
];
const ESCALA_FRIA = [
  { nombre: "Fuerte", hasta: -1.4, color: "bg-petroleo-fuerte" },
  { nombre: "Moderado", hasta: -1.2, color: "bg-petroleo/70" },
  { nombre: "Débil", hasta: -1, color: "bg-petroleo/40" },
  { nombre: "Normal", hasta: Infinity, color: "bg-arena" },
];
/** Líneas de umbral del gráfico (el +0.4 queda muy pegado a 0: sus números van en la escala). */
const UMBRALES = [
  { valor: 1.7, nombre: "fuerte" },
  { valor: 3, nombre: "extraord." },
];

/* ---------- 1 · Mar ahora vs. lo normal ---------- */

function Comparacion({ datos }: { datos: RespuestaElNino }) {
  const diferencia = datos.mar_c - datos.mar_normal_c;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5">
      <div className="flex flex-col gap-0.5 rounded-[10px] border-[0.8px] border-borde bg-arena px-2.5 py-2">
        <span className="text-[11px] leading-[13px] font-semibold text-secundario uppercase">Mar ahora</span>
        <span className="font-titulo text-[24px] leading-[26px] font-bold text-tinta">{datos.mar_c.toFixed(1)} °C</span>
        <span className="text-[11px] leading-[13px] text-secundario">último mes</span>
      </div>
      <div className="flex flex-col items-center justify-center px-0.5">
        <span
          className={`rounded-[1.5px] px-1.5 py-0.5 font-titulo text-[13px] leading-[16px] font-bold ${
            diferencia >= 0.4 ? "bg-terracota-fuerte text-white" : diferencia <= -1 ? "bg-petroleo-fuerte text-white" : "bg-arena text-tinta"
          }`}
        >
          {signo(diferencia)} °C
        </span>
      </div>
      <div className="flex flex-col gap-0.5 rounded-[10px] border-[0.8px] border-borde bg-white px-2.5 py-2">
        <span className="text-[11px] leading-[13px] font-semibold text-secundario uppercase">Lo normal</span>
        <span className="font-titulo text-[24px] leading-[26px] font-bold text-tinta">{datos.mar_normal_c.toFixed(1)} °C</span>
        <span className="text-[11px] leading-[13px] text-secundario">2001–2025</span>
      </div>
    </div>
  );
}

/* ---------- 2 · Diferencia día a día ---------- */

const ANCHO = 280;
const ALTO = 136;
const M = { izq: 6, der: 50, arr: 10, aba: 20 };

function Grafico({ serie }: { serie: RespuestaElNino["serie"] }) {
  const id = useId();
  const [foco, setFoco] = useState<number | null>(null);
  const valores = serie.map((d) => d.anomalia_c);
  const yMin = Math.min(-1, Math.floor(Math.min(...valores) - 0.3));
  const yMax = Math.max(3.5, Math.ceil(Math.max(...valores) + 0.3));
  const x = (i: number) => M.izq + (i / Math.max(1, serie.length - 1)) * (ANCHO - M.izq - M.der);
  const y = (v: number) => M.arr + ((yMax - v) / (yMax - yMin)) * (ALTO - M.arr - M.aba);
  const y0 = y(0);

  const linea = serie.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.anomalia_c).toFixed(1)}`).join("");
  const area = `${linea}L${x(serie.length - 1).toFixed(1)},${y0}L${x(0).toFixed(1)},${y0}Z`;
  const ultimo = serie.length - 1;
  const medio = Math.floor(ultimo / 2);
  const activo = foco ?? ultimo;

  function mover(e: PointerEvent<SVGSVGElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - caja.left) / caja.width) * ANCHO;
    const i = Math.round(((px - M.izq) / (ANCHO - M.izq - M.der)) * ultimo);
    setFoco(Math.min(ultimo, Math.max(0, i)));
  }

  const punto = serie[activo];
  const izquierdaTip = (x(activo) / ANCHO) * 100;

  return (
    <figure className="flex flex-col gap-1.5">
      <figcaption className="text-[12px] leading-[15px] font-semibold text-tinta">
        Cuánto más caliente que lo normal está el mar, día a día
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="block h-auto w-full touch-none select-none"
          role="img"
          aria-label={`Diferencia de la temperatura del mar con lo normal, del ${fechaCorta(serie[0].fecha)} al ${fechaCorta(serie[ultimo].fecha)}. Último valor: ${signo(serie[ultimo].anomalia_c)} grados.`}
          onPointerMove={mover}
          onPointerDown={mover}
          onPointerLeave={() => setFoco(null)}
        >
          <defs>
            <clipPath id={`${id}-arriba`}>
              <rect x={0} y={0} width={ANCHO} height={y0} />
            </clipPath>
            <clipPath id={`${id}-abajo`}>
              <rect x={0} y={y0} width={ANCHO} height={ALTO - y0} />
            </clipPath>
          </defs>

          {/* Umbrales (recesivos) con su nombre a la derecha */}
          {UMBRALES.filter((u) => u.valor < yMax).map((u) => (
            <g key={u.valor}>
              <line
                x1={M.izq}
                x2={ANCHO - M.der}
                y1={y(u.valor)}
                y2={y(u.valor)}
                className="stroke-borde-fuerte"
                strokeWidth={0.75}
                strokeDasharray="3 3"
              />
              <text x={ANCHO - M.der + 4} y={y(u.valor) + 3.5} className="fill-secundario text-[10px]">
                {u.nombre}
              </text>
            </g>
          ))}
          {/* Línea de lo normal */}
          <line x1={M.izq} x2={ANCHO - M.der} y1={y0} y2={y0} className="stroke-tinta" strokeWidth={1} />
          <text x={ANCHO - M.der + 4} y={y0 + 3.5} className="fill-tinta text-[10px] font-semibold">
            normal
          </text>

          {/* Área: cálido arriba (terracota), frío abajo (petróleo) */}
          <path d={area} className="fill-terracota/25" clipPath={`url(#${id}-arriba)`} />
          <path d={area} className="fill-petroleo/30" clipPath={`url(#${id}-abajo)`} />
          <path d={linea} fill="none" className="stroke-terracota-fuerte" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* Fechas */}
          {[0, medio, ultimo].map((i) => (
            <text
              key={i}
              x={x(i)}
              y={ALTO - 4}
              textAnchor={i === 0 ? "start" : i === ultimo ? "end" : "middle"}
              className="fill-secundario text-[10px]"
            >
              {fechaCorta(serie[i].fecha)}
            </text>
          ))}

          {/* Cursor: línea vertical y punto con anillo del color de la superficie */}
          {foco !== null && (
            <line x1={x(activo)} x2={x(activo)} y1={M.arr} y2={ALTO - M.aba} className="stroke-tinta/40" strokeWidth={1} />
          )}
          <circle cx={x(activo)} cy={y(punto.anomalia_c)} r={4} className="fill-terracota-fuerte stroke-white" strokeWidth={2} />
        </svg>

        {/* Etiqueta del punto (el último, o el que se toca) */}
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-[6px] bg-tinta px-1.5 py-0.5 text-[11px] leading-[14px] font-semibold whitespace-nowrap text-white shadow-[0_1px_3px_rgba(38,59,53,0.3)]"
          style={{ left: `${Math.min(80, Math.max(14, izquierdaTip))}%` }}
        >
          {fechaCorta(punto.fecha)}: {signo(punto.anomalia_c)} °C
        </div>
      </div>
    </figure>
  );
}

/* ---------- 3 · Dónde cae en la escala ---------- */

function Escala({ valor, fenomeno }: { valor: number; fenomeno: RespuestaElNino["fenomeno"] }) {
  const fria = fenomeno === "nina_costera" && valor < 0;
  const tramos = fria
    ? ESCALA_FRIA.map((t, i) => ({ ...t, activo: valor <= t.hasta && (i === 0 || valor > ESCALA_FRIA[i - 1].hasta) }))
    : ESCALA_CALIDA.map((t, i) => ({
        ...t,
        activo: valor >= t.desde && (i === ESCALA_CALIDA.length - 1 || valor < ESCALA_CALIDA[i + 1].desde),
      }));
  const iActivo = tramos.findIndex((t) => t.activo);
  const cortes = fria ? ESCALA_FRIA.slice(0, -1).map((t) => t.hasta) : ESCALA_CALIDA.slice(1).map((t) => t.desde);

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[12px] leading-[15px] font-semibold text-tinta">
        Promedio de 3 meses: <span className="font-titulo text-[15px] font-bold">{signo(valor, 2)} °C</span>
      </p>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${tramos.length}, minmax(0, 1fr))` }}>
        {tramos.map((t, i) => (
          <div key={t.nombre} className="flex flex-col items-center gap-0.5">
            <span className="h-3 text-[10px] leading-3 text-tinta" aria-hidden>
              {i === iActivo ? "▼" : ""}
            </span>
            <span
              className={`h-3 w-full rounded-[3px] ${t.color} ${i === iActivo ? "outline-2 outline-offset-1 outline-tinta" : ""}`}
            />
            <span
              className={`text-center text-[10px] leading-[12px] ${i === iActivo ? "font-bold text-tinta" : "text-secundario"}`}
            >
              {t.nombre}
            </span>
          </div>
        ))}
      </div>
      {/* Umbrales en °C, en el borde entre tramos */}
      <div className="relative h-3 text-[10px] leading-3 text-secundario tabular-nums" aria-label="Umbrales en grados">
        {cortes.map((c, i) => (
          <span key={c} className="absolute -translate-x-1/2" style={{ left: `${((i + 1) / tramos.length) * 100}%` }}>
            {signo(c)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Todo junto ---------- */

export function GraficoMar({ datos }: { datos: RespuestaElNino }) {
  return (
    <div className="flex flex-col gap-3">
      <Comparacion datos={datos} />
      {datos.serie.length > 1 && <Grafico serie={datos.serie} />}
      <Escala valor={datos.anomalia_c} fenomeno={datos.fenomeno} />

      <div className="rounded-[10px] bg-papel px-2.5 py-2 text-[12px] leading-[16px] text-secundario">
        <p>
          <strong className="text-tinta">De dónde sale:</strong> temperatura de la superficie del mar en {datos.puntos.length}{" "}
          puntos frente a la costa norte (zona Niño 1+2), medida por la NASA, comparada con su promedio 2001–2025. Último dato:{" "}
          {fechaCorta(datos.hasta)}.
        </p>
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          <a href={datos.datos_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-tinta underline">
            Ver los datos (NASA POWER)
          </a>
          <a href={datos.aviso_oficial_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-tinta underline">
            Aviso oficial del ENFEN
          </a>
        </p>
      </div>

      <details className="text-[12px] leading-[16px] text-secundario">
        <summary className="cursor-pointer font-semibold text-tinta">Ver tabla semana por semana</summary>
        <table className="mt-1.5 w-full text-left">
          <thead>
            <tr className="text-tinta">
              <th className="py-0.5 font-semibold">Semana</th>
              <th className="py-0.5 text-right font-semibold">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {semanas(datos.serie).map((s) => (
              <tr key={s.fecha} className="border-t-[0.5px] border-borde">
                <td className="py-0.5">{fechaCorta(s.fecha)}</td>
                <td className="py-0.5 text-right tabular-nums">{signo(s.valor, 2)} °C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Promedio de cada 7 días (desde el último hacia atrás), del más nuevo al más antiguo. */
export function semanas(serie: RespuestaElNino["serie"]) {
  const filas: { fecha: string; valor: number }[] = [];
  for (let fin = serie.length; fin > 0; fin -= 7) {
    const tramo = serie.slice(Math.max(0, fin - 7), fin);
    filas.push({ fecha: tramo[0].fecha, valor: tramo.reduce((s, d) => s + d.anomalia_c, 0) / tramo.length });
  }
  return filas;
}
