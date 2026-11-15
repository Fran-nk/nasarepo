"use client";

import { useState } from "react";
import { obtenerElNino, obtenerRiego, obtenerSemaforo, obtenerSemana, obtenerVsNormal } from "@/app/front/lib/api/cliente";
import { useConsulta, useUbicacion } from "@/app/front/lib/hooks";
import { capitalizar, fraseRiego, fraseVsNormal, nombreMes } from "@/app/front/lib/mensajes";
import { EFECTO_NINO, ESTADO_NINO, RIEGO, SEMAFORO, SEMAFORO_RESPUESTA } from "@/app/front/lib/textos";
import { IconoClima, type NombreIconoClima } from "./IconosClima";

type Nivel = "normal" | "atencion" | "peligro";

interface Widget {
  id: string;
  icono: NombreIconoClima;
  etiqueta: string;
  /** Respuesta en una o dos palabras, en grande. */
  valor: string;
  nivel: Nivel;
  /** Frase que se ve al tocar el widget. */
  detalle: string;
  queHacer?: string;
}

const PUNTO: Record<Nivel, string> = { normal: "", atencion: "bg-senal", peligro: "bg-terracota" };

/**
 * "Tu cultivo hoy": datos del clima que dependen del cultivo abierto (siembra, riego, El Niño y el mes),
 * como widgets de un vistazo en una cuadrícula de 2 × 2. Al tocar uno se ve el porqué y qué hacer.
 */
export function WidgetsCultivo() {
  const { punto, escenario, clave } = useUbicacion();
  const mes = new Date().getMonth() + 1;
  const k = (nombre: string) => (clave === null ? null : `${nombre}|${clave}`);
  const nino = useConsulta(k("nino"), () => obtenerElNino(punto, escenario));
  const semana = useConsulta(k("semana"), () => obtenerSemana(punto, escenario));
  const semaforo = useConsulta(k(`semaforo|${mes}`), () => obtenerSemaforo(punto, escenario, mes));
  const riego = useConsulta(k("riego"), () => obtenerRiego(punto, escenario));
  const vsNormal = useConsulta(k("vsnormal"), () => obtenerVsNormal(punto, escenario));
  const [abierto, setAbierto] = useState<string | null>(null);

  const widgets: (Widget | null)[] = [
    semaforo.datos
      ? {
          id: "siembra",
          icono: "siembra",
          etiqueta: "¿Siembro?",
          valor: { verde: "Sí", amarillo: "Con cuidado", rojo: "Todavía no" }[semaforo.datos.color],
          nivel: semaforo.datos.color === "rojo" ? "peligro" : semaforo.datos.color === "amarillo" ? "atencion" : "normal",
          detalle: `${SEMAFORO_RESPUESTA[semaforo.datos.color]} ${SEMAFORO[semaforo.datos.motivo]}`,
        }
      : null,
    riego.datos
      ? {
          id: "riego",
          icono: "riego",
          etiqueta: "¿Riego hoy?",
          valor: { si: "Sí", poco: "Poco", no: "No" }[riego.datos.regar],
          nivel: riego.datos.regar === "si" ? "atencion" : "normal",
          detalle: `${RIEGO[riego.datos.regar].respuesta} ${fraseRiego(riego.datos, semana.datos?.dias)} Humedad de la tierra: ${Math.round(riego.datos.humedad_suelo * 100)} %.`,
        }
      : null,
    nino.datos
      ? {
          id: "nino",
          icono: "nino",
          etiqueta: "El Niño",
          valor: { no_activo: "Tranquilo", vigilancia: "Vigilancia", alerta: "Alerta" }[nino.datos.estado],
          nivel: nino.datos.estado === "alerta" ? "peligro" : nino.datos.estado === "vigilancia" ? "atencion" : "normal",
          detalle:
            nino.datos.estado === "no_activo"
              ? "No hay El Niño ni La Niña ahora."
              : `${nino.datos.fenomeno === "nino_costero" ? "El Niño costero" : "La Niña costera"}: ${ESTADO_NINO[nino.datos.estado].nombre.toLowerCase()}. ${EFECTO_NINO[nino.datos.efecto_zona].respuesta}`,
          queHacer: nino.datos.estado === "no_activo" ? undefined : EFECTO_NINO[nino.datos.efecto_zona].queHacer,
        }
      : null,
    vsNormal.datos
      ? {
          id: "mes",
          icono: "comparar",
          etiqueta: capitalizar(nombreMes(vsNormal.datos.mes)),
          valor: { mas_seco: "Más seco", normal: "Normal", mas_lluvioso: "Más lluvioso" }[vsNormal.datos.lluvia],
          nivel: vsNormal.datos.lluvia === "normal" ? "normal" : "atencion",
          detalle: `${fraseVsNormal(vsNormal.datos)} Lluvia: ${vsNormal.datos.lluvia_mm} mm (lo normal: ${vsNormal.datos.lluvia_normal_mm} mm).`,
        }
      : null,
  ];
  const elegido = widgets.find((w) => w?.id === abierto) ?? null;

  return (
    <section aria-label="Tu cultivo hoy" className="flex flex-col gap-2">
      <h2 className="font-titulo text-[12px] leading-[16px] font-bold text-tinta uppercase">Tu cultivo hoy</h2>
      <ul className="grid grid-cols-2 gap-2 lg:gap-[6px]">
        {widgets.map((w, i) =>
          w ? (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => setAbierto(abierto === w.id ? null : w.id)}
                aria-expanded={abierto === w.id}
                className={`relative flex h-full w-full flex-col gap-1 rounded-[12px] border-[0.5px] border-borde bg-arena p-2.5 text-left transition-colors hover:bg-arena/70 ${
                  abierto === w.id ? "outline-2 outline-offset-1 outline-tinta" : ""
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <IconoClima nombre={w.icono} className="size-5 shrink-0 text-tinta lg:size-4" />
                  <span className="text-[11px] leading-[14px] font-semibold text-secundario uppercase lg:text-[9.5px] lg:leading-[12px]">
                    {w.etiqueta}
                  </span>
                </span>
                <span className="font-titulo text-[20px] leading-[22px] font-bold text-tinta lg:text-[17px] lg:leading-[19px]">
                  {w.valor}
                </span>
                {w.nivel !== "normal" && (
                  <span aria-hidden className={`absolute top-2.5 right-2.5 size-2 rounded-full ${PUNTO[w.nivel]}`} />
                )}
              </button>
            </li>
          ) : (
            <li key={`cargando-${i}`} className="h-[64px] animate-pulse rounded-[12px] bg-arena lg:h-[56px]" />
          ),
        )}
      </ul>
      {elegido && (
        <div className="flex flex-col gap-1 rounded-[12px] border-[0.5px] border-borde bg-white p-2.5 text-[13px] leading-[18px] text-tinta lg:text-[11px] lg:leading-[15px]">
          <p>{elegido.detalle}</p>
          {elegido.queHacer && (
            <p>
              <strong>Qué hacer:</strong> {elegido.queHacer}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
