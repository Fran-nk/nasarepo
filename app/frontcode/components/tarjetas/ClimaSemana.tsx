"use client";

import { useState } from "react";
import { obtenerSemana } from "@/app/frontcode/lib/api/cliente";
import { useConsulta, useUbicacion } from "@/app/frontcode/lib/hooks";
import { capitalizar, nombreDia } from "@/app/frontcode/lib/mensajes";
import { IconoCielo } from "./IconoCielo";

/**
 * Clima de la semana en pocas palabras: el cielo de cada día con su máxima y mínima,
 * y "Ver más datos" con la lluvia de cada día. Íconos de línea en color tinta, sin colores fuertes.
 */
export function ClimaSemana({ className = "" }: { className?: string }) {
  const { punto, escenario, clave } = useUbicacion();
  const semana = useConsulta(clave === null ? null : `semana|${clave}`, () => obtenerSemana(punto, escenario));
  const [masDatos, setMasDatos] = useState(false);
  const dias = semana.datos?.dias ?? [];
  const total = dias.reduce((s, d) => s + d.lluvia_mm, 0);

  return (
    <section
      aria-label="Clima de la semana"
      aria-busy={semana.cargando}
      className={`flex w-[300px] flex-col items-start gap-2 ${className}`}
    >
      {/* Sin fondo: el título va resaltado en blanco para leerse sobre el mapa (como la leyenda). */}
      <h2 className="bg-white px-1.5 py-px font-titulo text-[12px] leading-[16px] font-bold text-tinta uppercase shadow-[0_1px_3px_rgba(38,59,53,0.25)]">
        Clima de la semana
      </h2>

      {semana.error && <p className="bg-white px-1.5 py-px text-[12px] leading-[16px] text-secundario">😕 No pudimos traer el clima.</p>}
      {!semana.datos && !semana.error && <div className="h-[86px] w-full animate-pulse rounded-[12px] bg-arena" />}

      {dias.length > 0 && (
        <ul className="grid w-full grid-cols-7 gap-1 text-center">
          {dias.map((d) => (
            <li key={d.fecha} className="flex flex-col items-center gap-1 rounded-[10px] bg-arena py-1.5">
              <span className="text-[10px] leading-[14px] font-semibold text-secundario uppercase">
                {nombreDia(d.fecha).slice(0, 3)}
              </span>
              <IconoCielo cielo={d.cielo} className="size-6 text-tinta" />
              <span className="text-[12px] leading-[14px] font-semibold text-tinta">{Math.round(d.tmax)}°</span>
              <span className="text-[11px] leading-[14px] text-secundario">{Math.round(d.tmin)}°</span>
            </li>
          ))}
        </ul>
      )}

      {semana.datos && (
        <>
          <button
            type="button"
            onClick={() => setMasDatos(!masDatos)}
            aria-expanded={masDatos}
            className="flex items-center gap-2 bg-white px-1.5 py-px text-left text-[12px] leading-[18px] font-semibold text-tinta shadow-[0_1px_3px_rgba(38,59,53,0.25)] hover:bg-arena"
          >
            Ver más datos
            {/* eslint-disable-next-line @next/next/no-img-element -- ícono SVG del diseño (flecha hacia arriba = abierto) */}
            <img
              src="/iconos/datos-desplegados.svg"
              alt=""
              width={14}
              height={14}
              className={`transition-transform ${masDatos ? "" : "rotate-180"}`}
            />
          </button>
          {masDatos && (
            <div className="flex w-full flex-col gap-1 rounded-[10px] bg-papel p-2 text-[12px] leading-[16px] text-tinta shadow-[0_1px_3px_rgba(38,59,53,0.25)]">
              {dias.map((d) => (
                <div key={d.fecha} className="flex justify-between gap-2">
                  <span className="text-secundario">{capitalizar(nombreDia(d.fecha))}</span>
                  <span>
                    {d.lluvia_mm} mm · {Math.round(d.prob_lluvia * 100)}% de lluvia
                  </span>
                </div>
              ))}
              <div className="mt-1 flex justify-between gap-2 border-t border-borde pt-1 font-semibold">
                <span>Lluvia de la semana</span>
                <span>{total.toFixed(1)} mm</span>
              </div>
              <p className="text-[11px] leading-[15px] text-secundario">Fuente: {semana.datos.fuente}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
