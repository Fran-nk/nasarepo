"use client";

import { useState } from "react";
import { BotonVoz } from "@/app/front/components/BotonVoz";
import { cambiarIcono, type Cultivo } from "@/app/front/lib/almacen";
import { useContexto } from "@/app/front/lib/hooks";
import { formatoMiles } from "@/app/front/lib/mensajes";
import { ICONOS_CHACRA, REGIONES, ZONAS } from "@/app/front/lib/textos";

export function tamanoTerreno(ha: number) {
  return ha < 0.1 ? `${formatoMiles(Math.round(ha * 10_000))} m²` : `${ha.toFixed(1)} ha`;
}

/** Texto resaltado en blanco, sin redondeo (mismo estilo que la leyenda y el clima). */
const RESALTADO = "bg-white px-1.5 py-px shadow-[0_1px_3px_rgba(38,59,53,0.25)]";
const ROTULO = `${RESALTADO} font-titulo text-[12px] leading-[16px] font-bold text-tinta uppercase`;

/** Ficha arena con un dato: etiqueta pequeña y valor en grande (como los widgets de "Tu cultivo hoy"). */
function Ficha({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-[10px] border border-borde bg-arena px-2.5 py-2 shadow-[0_1px_3px_rgba(38,59,53,0.3)]">
      <span className="text-[10px] leading-[13px] font-semibold text-secundario uppercase">{etiqueta}</span>
      <span className="font-titulo text-[17px] leading-[20px] font-bold text-tinta">{valor}</span>
    </div>
  );
}

/**
 * Cuadro que se abre al tocar el círculo de un cultivo en el mapa. Sin fondo propio: los textos van
 * resaltados en blanco y los datos en fichas arena. "Ver más datos" despliega el resto y el ícono.
 */
export function VentanaChacra({ cultivo, onCerrar }: { cultivo: Cultivo; onCerrar: () => void }) {
  const contexto = useContexto({ lat: cultivo.lat, lon: cultivo.lon });
  const [mas, setMas] = useState(false);
  const ctx = contexto.datos;
  const zona = ctx ? ZONAS[ctx.zona] : undefined;
  const icono = cultivo.icono ?? ICONOS_CHACRA[0];

  const textoVoz =
    ctx && zona
      ? [
          `${cultivo.nombre} está en la zona ${zona.nombre}, en la ${REGIONES[zona.region].toLowerCase()}, a ${formatoMiles(ctx.altitud_m)} metros de altura`,
          ctx.lugar,
          zona.descripcion,
          cultivo.area_ha !== undefined && `Tu terreno mide ${tamanoTerreno(cultivo.area_ha).replace("ha", "hectáreas")}`,
        ]
          .filter(Boolean)
          .join(". ")
      : "";

  return (
    <section aria-label={`Datos de ${cultivo.nombre}`} className="flex w-[264px] flex-col items-start gap-2">
      {/* Zona y región (el ícono y el nombre ya se ven en el círculo del mapa y en el panel) */}
      <div className="flex w-full items-start gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          {zona ? (
            <>
              <span className={`${RESALTADO} font-titulo text-[20px] leading-[24px] font-bold text-tinta`}>Zona {zona.nombre}</span>
              <span className="bg-senal px-2 py-0.5 font-titulo text-[11px] leading-[14px] font-bold text-tinta uppercase shadow-[0_1px_3px_rgba(38,59,53,0.25)]">
                {REGIONES[zona.region]}
              </span>
            </>
          ) : contexto.error ? (
            <span className={`${RESALTADO} text-[12px] leading-[16px] text-terracota`}>😕 No pudimos saber tu zona.</span>
          ) : (
            <span className="h-6 w-32 animate-pulse bg-arena" />
          )}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className={`${RESALTADO} flex size-7 shrink-0 items-center justify-center text-[14px] text-tinta hover:bg-arena`}
        >
          ✕
        </button>
      </div>

      {ctx && (
        <span className={`${RESALTADO} flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold text-tinta`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ícono SVG del diseño */}
          <img src="/iconos/marcador-territorial.svg" alt="" width={14} height={14} className="shrink-0" />
          {ctx.lugar}
        </span>
      )}

      {ctx && (
        <div className="flex w-full gap-1.5">
          <Ficha etiqueta="Altitud" valor={`${formatoMiles(ctx.altitud_m)} m`} />
          {cultivo.area_ha !== undefined && <Ficha etiqueta="Tu terreno" valor={tamanoTerreno(cultivo.area_ha)} />}
        </div>
      )}

      <button
        type="button"
        onClick={() => setMas(!mas)}
        aria-expanded={mas}
        className={`${RESALTADO} flex items-center gap-2 text-[12px] leading-[18px] font-semibold text-tinta hover:bg-arena`}
      >
        Ver más datos
        {/* eslint-disable-next-line @next/next/no-img-element -- ícono SVG del diseño (flecha hacia arriba = abierto) */}
        <img
          src="/iconos/datos-desplegados.svg"
          alt=""
          width={14}
          height={14}
          className={`transition-transform ${mas ? "" : "rotate-180"}`}
        />
      </button>

      {mas && ctx && zona && (
        <>
          <span className={`${RESALTADO} text-[12px] leading-[16px] text-secundario`}>{zona.descripcion}</span>
          <div className="flex w-full gap-1.5">
            <Ficha etiqueta="Latitud" valor={cultivo.lat.toFixed(4)} />
            <Ficha etiqueta="Longitud" valor={cultivo.lon.toFixed(4)} />
          </div>
          <div className="flex w-full gap-1.5">
            <Ficha etiqueta="Altura exacta" valor={`${formatoMiles(ctx.altitud_m)} m s. n. m.`} />
            <Ficha etiqueta="Pulgar Vidal" valor={zona.nombre} />
          </div>

          <span className={ROTULO}>Ícono de tu cultivo</span>
          <div className="grid w-full grid-cols-6 gap-1.5">
            {ICONOS_CHACRA.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => void cambiarIcono(cultivo.id!, e)}
                aria-pressed={icono === e}
                aria-label={`Usar ${e} como ícono`}
                className={`flex aspect-square items-center justify-center rounded-[10px] border text-[20px] ${
                  icono === e ? "border-tinta bg-pradera" : "border-borde bg-arena hover:bg-papel"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <span className={`${RESALTADO} text-[11px] leading-[15px] text-secundario`}>
              Fuente: modelo de elevación · Pulgar Vidal
            </span>
            <BotonVoz texto={textoVoz} pequeno className="bg-white" />
          </div>
        </>
      )}
    </section>
  );
}
