"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { Vista } from "./vistaSatelite";

/*
 * Colores y texturas copiados del estilo de Mapbox Studio del equipo ("Nasa app"):
 * si se cambia el estilo, hay que actualizar estas muestras.
 */
const FONDO = "#eadcc2";
const CAPA_AGUA = "hsla(189, 20%, 55%, 0.4)";

/** Campos de cultivo: verde oliva con triángulos (capas "chacras - base" y "chacras - textura"). */
function MuestraCultivo() {
  return (
    <svg viewBox="0 0 24 16" className="size-full" aria-hidden>
      <defs>
        <pattern id="leyenda-triangulos" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 6 L3 0 L6 6 Z" fill="hsl(98, 25%, 43%)" fillOpacity="0.6" />
        </pattern>
      </defs>
      <rect width="24" height="16" fill="hsl(78, 45%, 38%)" stroke="hsl(85, 50%, 22%)" strokeWidth="1" />
      <rect width="24" height="16" fill="url(#leyenda-triangulos)" />
    </svg>
  );
}

/** Ciudad o pueblo: fondo claro con calles grises. */
function MuestraCiudad() {
  return (
    <svg viewBox="0 0 24 16" className="size-full" aria-hidden>
      <rect width="24" height="16" fill={FONDO} />
      <path d="M0 5 H24 M0 11 H24 M8 0 V16 M17 0 V16" stroke="#666666" strokeWidth="1.2" />
    </svg>
  );
}

/** Curvas de nivel: líneas verdes finas que muestran la forma del cerro. */
function MuestraCurvas() {
  return (
    <svg viewBox="0 0 24 16" className="size-full" aria-hidden>
      <rect width="24" height="16" fill={FONDO} />
      <path
        d="M1 13 C6 9 10 12 14 8 S21 4 23 3 M1 8 C5 5 9 7 12 4 S18 1 20 1"
        fill="none"
        stroke="hsl(145, 48%, 34%)"
        strokeWidth="1"
      />
    </svg>
  );
}

function Relleno({ estilo }: { estilo: CSSProperties }) {
  return <span aria-hidden className="block size-full" style={estilo} />;
}

/** Terrenos marcados en la app (mismo estilo que la capa "terrenos" del mapa). */
function MuestraTusCultivos() {
  return <span aria-hidden className="block size-full border-2 border-black bg-[#b7bd7b]/30" />;
}

const ELEMENTOS: { texto: string; muestra: ReactNode }[] = [
  { texto: "Tus cultivos", muestra: <MuestraTusCultivos /> },
  { texto: "Campos de cultivo", muestra: <MuestraCultivo /> },
  { texto: "Pasto", muestra: <Relleno estilo={{ background: "hsl(66, 34%, 61%)" }} /> },
  { texto: "Matorral", muestra: <Relleno estilo={{ background: "#528984" }} /> },
  { texto: "Bosque, árboles", muestra: <Relleno estilo={{ background: "hsl(39, 22%, 23%)" }} /> },
  { texto: "Ríos y lagos", muestra: <Relleno estilo={{ background: `linear-gradient(${CAPA_AGUA}, ${CAPA_AGUA}), ${FONDO}` }} /> },
  { texto: "Ciudad o pueblo", muestra: <MuestraCiudad /> },
  { texto: "Forma del cerro", muestra: <MuestraCurvas /> },
];

/**
 * Minileyenda del mapa: qué es cada color o textura (cultivos, ciudad, agua…).
 * Sin fondo, para tapar lo menos posible: cada nombre va resaltado en blanco para leerse sobre cualquier color.
 * Va a la izquierda de los controles de zoom y GPS, alineada a la derecha: primero el nombre y luego la muestra.
 * En escritorio siempre se ve; en el celular se abre y cierra con un botón pequeño para no tapar el mapa.
 */
export function LeyendaMapa({ vista, className = "" }: { vista: Vista; className?: string }) {
  const [abierta, setAbierta] = useState(false);
  const elementos = vista === "satelite" ? ELEMENTOS.slice(0, 1) : ELEMENTOS;

  return (
    <section aria-label="Leyenda del mapa" className={`flex w-max flex-col items-end gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => setAbierta(!abierta)}
        aria-expanded={abierta}
        aria-label={abierta ? "Ocultar la leyenda del mapa" : "Ver qué es cada color del mapa"}
        title={abierta ? "Ocultar la leyenda" : "Ver qué es cada color"}
        className="flex size-8 items-center justify-center rounded-full bg-white shadow-[0_2px_6px_rgba(38,59,53,0.25)] lg:hidden"
      >
        <span aria-hidden className="grid grid-cols-2 gap-px">
          <span className="block size-[7px] rounded-[1px] bg-[hsl(78,45%,38%)]" />
          <span className="block size-[7px] rounded-[1px] bg-[#528984]" />
          <span className="block size-[7px] rounded-[1px] bg-[hsl(39,22%,23%)]" />
          <span className="block size-[7px] rounded-[1px] bg-[#666666]" />
        </span>
      </button>
      <ul className={`flex-col items-end gap-1.5 ${abierta ? "flex" : "hidden"} lg:flex`}>
        {elementos.map((e) => (
          <li key={e.texto} className="flex items-center gap-2">
            <span className="bg-white px-1.5 py-px text-[12px] leading-[16px] font-semibold text-tinta shadow-[0_1px_3px_rgba(38,59,53,0.25)]">
              {e.texto}
            </span>
            <span className="block h-4 w-6 shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_#fff,0_1px_3px_rgba(38,59,53,0.35)]">
              {e.muestra}
            </span>
          </li>
        ))}
        {vista === "satelite" && (
          <li>
            <span className="bg-white px-1.5 py-px text-[11px] leading-[15px] text-secundario shadow-[0_1px_3px_rgba(38,59,53,0.25)]">
              En satélite se ve la foto real del terreno.
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}
