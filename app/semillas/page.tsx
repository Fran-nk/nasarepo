"use client";

import { useState } from "react";
import { TarjetaSemilla } from "@/components/semillas/TarjetaSemilla";
import { TarjetaCargando } from "@/components/tarjetas/TarjetaDato";
import { buscar } from "@/lib/busqueda/fonetica";
import { useCatalogo, useMisSemillas, useRecomendaciones } from "@/lib/hooks";
import type { Semilla } from "@/lib/contratos/tipos";

const PESTANAS = [
  { id: "mias", texto: "Mis semillas" },
  { id: "recomendadas", texto: "Para mí" },
  { id: "todas", texto: "Todas" },
  { id: "rescate", texto: "⭐ En rescate" },
] as const;

type Pestana = (typeof PESTANAS)[number]["id"];

export default function Semillero() {
  const { semillas, porId, cargando } = useCatalogo();
  const mias = useMisSemillas();
  const rec = useRecomendaciones();
  const [pestana, setPestana] = useState<Pestana>("todas");
  const [texto, setTexto] = useState("");

  let lista: Semilla[] = [];
  if (pestana === "todas") lista = semillas;
  if (pestana === "mias") lista = semillas.filter((s) => mias.has(s.id));
  if (pestana === "rescate") lista = semillas.filter((s) => s.rareza === "en_rescate");
  if (pestana === "recomendadas")
    lista = (rec.datos?.recomendaciones ?? []).map((r) => porId.get(r.semillaId)).filter((s): s is Semilla => !!s);
  if (texto) lista = buscar(texto, lista, 50);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">🌱 Semillero</h1>
        <p className="text-base text-stone-600">Conoce cada semilla: qué necesita, qué aguanta y cómo guardarla.</p>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-base font-semibold ${pestana === p.id ? "bg-green-700 text-white" : "border border-stone-300 bg-white text-stone-700"}`}
          >
            {p.texto}
            {p.id === "mias" && mias.size > 0 && ` (${mias.size})`}
          </button>
        ))}
      </div>

      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="🔎 Buscar semilla…"
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-lg outline-none focus:border-green-700"
        aria-label="Buscar semilla"
      />

      {pestana === "rescate" && (
        <p className="rounded-2xl bg-violet-100 p-3 text-base text-violet-900">
          Plantas nativas que se siembran cada vez menos. Sembrarlas ayuda a que no desaparezcan.
        </p>
      )}

      {cargando || (pestana === "recomendadas" && rec.cargando) ? (
        <TarjetaCargando />
      ) : lista.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-center text-lg text-stone-600">
          {pestana === "mias" && !texto
            ? "Todavía no agregaste semillas. Abre una ficha y toca “Tengo esta semilla”."
            : "No hay semillas para mostrar."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {lista.map((s) => (
            <TarjetaSemilla key={s.id} semilla={s} tengo={mias.has(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
