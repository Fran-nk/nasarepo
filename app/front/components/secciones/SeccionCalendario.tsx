"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { FormActividad } from "@/app/front/components/calendario/FormActividad";
import { LineaTiempo } from "@/app/front/components/calendario/LineaTiempo";
import { BOTON_OSCURO, FICHA_ARENA, ROTULO_BLOQUE } from "@/app/front/components/estilos";
import { db } from "@/app/front/lib/almacen";
import { useCatalogo } from "@/app/front/lib/hooks";
import { capitalizar, fechaCorta } from "@/app/front/lib/mensajes";
import { ACTIVIDADES, AVISOS } from "@/app/front/lib/textos";
import { useAviso } from "@/app/front/components/Avisos";
import type { Actividad } from "@/app/front/lib/almacen";

/** Línea de tiempo de cultivos y actividades anotadas. */
export function SeccionCalendario() {
  const actividades = useLiveQuery(() => db.actividades.orderBy("fecha").reverse().toArray(), []);
  const { porId } = useCatalogo();
  const [anotando, setAnotando] = useState(false);
  const avisar = useAviso();

  // Borrar es inmediato pero se puede deshacer: un toque sin querer no cuesta un registro.
  async function borrar(a: Actividad) {
    if (a.id === undefined) return;
    await db.actividades.delete(a.id);
    avisar({ texto: AVISOS.actividadBorrada, icono: "basura", deshacer: () => void db.actividades.put(a) });
  }

  return (
    <div className="flex flex-col gap-3">
      {anotando ? (
        <FormActividad onListo={() => setAnotando(false)} />
      ) : (
        <button type="button" onClick={() => setAnotando(true)} className={`${BOTON_OSCURO} flex items-center justify-center gap-2`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ícono SVG del diseño (Figma 74:201) */}
          <img src="/iconos/lapiz.svg" alt="" width={16} height={16} className="size-4 shrink-0" />
          Anotar actividad
        </button>
      )}

      {actividades && <LineaTiempo actividades={actividades} porId={porId} />}

      {actividades && actividades.length > 0 && (
        <section aria-label="Lo que anoté" className="flex flex-col gap-1.5">
          <h3 className={ROTULO_BLOQUE}>Lo que anoté</h3>
          <ul className="flex flex-col gap-1.5">
            {actividades.map((a) => {
              const s = a.semillaId ? porId.get(a.semillaId) : undefined;
              return (
                <li key={a.id} className={`${FICHA_ARENA} flex items-center gap-2.5 border-[0.8px] py-2`}>
                  <span className="text-[20px] leading-none" aria-hidden>
                    {ACTIVIDADES[a.tipo].emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-titulo text-[16px] leading-[20px] font-bold text-tinta">
                      {ACTIVIDADES[a.tipo].nombre}
                      {s && ` · ${s.nombre}`}
                    </p>
                    <p className="text-[13px] leading-[16px] text-secundario">
                      {capitalizar(fechaCorta(a.fecha))}
                      {a.nota && ` · ${a.nota}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void borrar(a)}
                    className="tactil relative flex size-8 shrink-0 items-center justify-center rounded-[8px] text-tinta hover:bg-papel"
                    aria-label="Borrar actividad"
                    title="Borrar actividad"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- ícono SVG del diseño (Figma 74:301) */}
                    <img src="/iconos/basura.svg" alt="" width={16} height={16} className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
