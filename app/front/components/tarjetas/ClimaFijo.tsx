"use client";

import { useState } from "react";
import { obtenerAlertas } from "@/app/front/lib/api/cliente";
import { useConsulta, useUbicacion } from "@/app/front/lib/hooks";
import { rangoDias } from "@/app/front/lib/mensajes";
import { ALERTAS, ERRORES } from "@/app/front/lib/textos";
import { BotonReintentar } from "./TarjetaDato";
import { ClimaSemana } from "./ClimaSemana";
import { IconoClima } from "./IconosClima";

/** Título resaltado en blanco, sin redondeo (mismo estilo que la leyenda y "Clima de la semana"). */
export const TITULO_RESALTADO =
  "bg-white px-1.5 py-px font-titulo text-[13px] leading-[16px] font-bold text-tinta uppercase shadow-[0_1px_3px_rgba(38,59,53,0.25)]";

/**
 * Alertas de peligro como widget: cada alerta en una ficha terracota con texto claro, su ícono, qué pasa y cuándo.
 * `compacta` (celular, arriba del panel): sin título y solo si hay alertas, para avisar sin ocupar sitio cuando no hay peligro.
 */
function AlertasWidget({ compacta = false }: { compacta?: boolean }) {
  const { punto, clave } = useUbicacion();
  const alertas = useConsulta(clave === null ? null : `alertas|${clave}`, () => obtenerAlertas(punto));
  const [abierta, setAbierta] = useState<string | null>(null);
  const lista = [...(alertas.datos?.alertas ?? [])].sort((a, b) =>
    a.nivel === b.nivel ? 0 : a.nivel === "peligro" ? -1 : 1,
  );

  if (compacta && lista.length === 0) return null;

  return (
    <section
      aria-label="Alertas"
      aria-busy={alertas.cargando}
      role={compacta ? "alert" : undefined}
      className="flex w-full flex-col items-start gap-1.5"
    >
      {!compacta && <h2 className={TITULO_RESALTADO}>Alertas</h2>}
      {alertas.error && (
        <div className="flex items-center gap-2">
          <p className="bg-white px-1.5 py-px text-[13px] leading-[16px] text-tinta">{ERRORES.alertas}</p>
          <BotonReintentar onClick={alertas.reintentar} />
        </div>
      )}
      {alertas.cargando && <div className="esqueleto h-[52px] w-full rounded-[12px]" />}
      {alertas.datos && lista.length === 0 && (
        <div className="flex w-full items-center gap-2.5 rounded-[12px] bg-arena px-3 py-2.5">
          <IconoClima nombre="tranquilo" className="size-6 shrink-0 text-tinta" />
          <p className="font-titulo text-[16px] leading-[20px] font-bold text-tinta">Sin alertas estos días</p>
        </div>
      )}
      {lista.map((a) => {
        const id = `${a.tipo}-${a.desde}`;
        const info = ALERTAS[a.tipo];
        const abiertaEsta = abierta === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setAbierta(abiertaEsta ? null : id)}
            aria-expanded={abiertaEsta}
            className={`animar-alerta flex w-full flex-col gap-1.5 rounded-[12px] border-l-4 bg-terracota-fuerte px-3 py-2.5 text-left shadow-[0_1px_3px_rgba(38,59,53,0.3)] transition-colors hover:bg-terracota-fuerte/90 ${
              a.nivel === "peligro" ? "border-tinta" : "border-senal"
            }`}
          >
            <span className="flex w-full items-center gap-2.5">
              <IconoClima nombre="alerta" className="size-6 shrink-0 text-papel" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-titulo text-[16px] leading-[20px] font-bold text-papel">{info.nombre}</span>
                <span className="text-[13px] leading-[16px] text-papel">
                  {a.nivel === "peligro" ? "¡Peligro! · " : "Atención · "}
                  {rangoDias(a.desde, a.hasta)}
                </span>
              </span>
              {/* Flecha del diseño (hacia arriba = abierto), pintada clara con una máscara. */}
              <span
                aria-hidden
                className={`block size-[14px] shrink-0 bg-papel transition-transform ${abiertaEsta ? "" : "rotate-180"}`}
                style={{
                  mask: "url(/iconos/datos-desplegados.svg) center / contain no-repeat",
                  WebkitMask: "url(/iconos/datos-desplegados.svg) center / contain no-repeat",
                }}
              />
            </span>
            {abiertaEsta && (
              <span className="rounded-[8px] bg-papel px-2 py-1.5 text-[13px] leading-[16px] text-tinta">
                <strong>Qué hacer:</strong> {info.queHacer}
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}

/**
 * Clima que se ve siempre, en cualquier pestaña (en escritorio, arriba a la derecha):
 * la semana y las alertas de peligro. Lo demás del clima depende del cultivo y va en "Mi Cultivo".
 */
export function ClimaFijo({ className = "" }: { className?: string }) {
  return (
    <aside aria-label="Clima" className={`w-[300px] flex-col gap-4 overflow-y-auto [scrollbar-width:none] ${className}`}>
      <ClimaSemana className="w-full shrink-0" />
      <AlertasWidget />
    </aside>
  );
}

/** Alertas en el celular: arriba del panel, en todas las pestañas (el clima completo está en su propia pantalla). */
export function AlertasMovil() {
  return (
    <div className="mb-4 lg:hidden">
      <AlertasWidget compacta />
    </div>
  );
}
