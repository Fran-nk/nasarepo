"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { FormActividad } from "@/components/calendario/FormActividad";
import { LineaTiempo } from "@/components/calendario/LineaTiempo";
import { BOTON_OSCURO, FICHA_ARENA, ROTULO_BLOQUE } from "@/components/estilos";
import { IconoLinea } from "@/components/IconoLinea";
import { db } from "@/lib/almacen";
import { useCatalogo } from "@/lib/hooks";
import { capitalizar, fechaCorta } from "@/lib/mensajes";
import { ACTIVIDADES } from "@/lib/textos";

/** Línea de tiempo de cultivos y actividades anotadas. */
export function SeccionCalendario() {
  const actividades = useLiveQuery(() => db.actividades.orderBy("fecha").reverse().toArray(), []);
  const { porId } = useCatalogo();
  const [anotando, setAnotando] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {anotando ? (
        <FormActividad onListo={() => setAnotando(false)} />
      ) : (
        <button type="button" onClick={() => setAnotando(true)} className={`${BOTON_OSCURO} flex items-center justify-center gap-2`}>
          <IconoLinea nombre="lapiz" className="size-4 shrink-0" />
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
                <li key={a.id} className={`${FICHA_ARENA} flex items-center gap-2.5 py-2`}>
                  <span className="text-[20px] leading-none" aria-hidden>
                    {ACTIVIDADES[a.tipo].emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-titulo text-[16px] leading-[20px] font-bold text-tinta">
                      {ACTIVIDADES[a.tipo].nombre}
                      {s && ` · ${s.nombre}`}
                    </p>
                    <p className="text-[12px] leading-[16px] text-secundario">
                      {capitalizar(fechaCorta(a.fecha))}
                      {a.nota && ` · ${a.nota}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => a.id !== undefined && void db.actividades.delete(a.id)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-tinta hover:bg-papel"
                    aria-label="Borrar actividad"
                    title="Borrar actividad"
                  >
                    <IconoLinea nombre="basura" className="size-4" />
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
