"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { FormActividad } from "@/components/calendario/FormActividad";
import { LineaTiempo } from "@/components/calendario/LineaTiempo";
import { db } from "@/lib/almacen";
import { useCatalogo } from "@/lib/hooks";
import { capitalizar, fechaCorta } from "@/lib/mensajes";
import { ACTIVIDADES } from "@/lib/textos";

export default function Calendario() {
  const actividades = useLiveQuery(() => db.actividades.orderBy("fecha").reverse().toArray(), []);
  const { porId } = useCatalogo();
  const [anotando, setAnotando] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">📅 Calendario de mi chacra</h1>
        <p className="text-base text-stone-600">Cuándo sembraste, cuándo cosechas y lo que hiciste.</p>
      </div>

      {anotando ? (
        <FormActividad onListo={() => setAnotando(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAnotando(true)}
          className="rounded-2xl bg-green-700 px-4 py-4 text-xl font-bold text-white shadow active:bg-green-800"
        >
          ✏️ Anotar actividad
        </button>
      )}

      {actividades && <LineaTiempo actividades={actividades} porId={porId} />}

      {actividades && actividades.length > 0 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-bold">📝 Lo que anoté</h2>
          <ul className="flex flex-col divide-y divide-stone-100">
            {actividades.map((a) => {
              const s = a.semillaId ? porId.get(a.semillaId) : undefined;
              return (
                <li key={a.id} className="flex items-center gap-3 py-2">
                  <span className="text-2xl" aria-hidden>
                    {ACTIVIDADES[a.tipo].emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold">
                      {ACTIVIDADES[a.tipo].nombre}
                      {s && ` · ${s.emoji} ${s.nombre}`}
                    </p>
                    <p className="text-base text-stone-500">
                      {capitalizar(fechaCorta(a.fecha))}
                      {a.nota && ` · ${a.nota}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => a.id !== undefined && void db.actividades.delete(a.id)}
                    className="rounded-full px-2 py-1 text-xl text-stone-400 hover:bg-stone-100"
                    aria-label="Borrar actividad"
                  >
                    🗑️
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
