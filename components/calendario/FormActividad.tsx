"use client";

import { useState } from "react";
import { db, type TipoActividad } from "@/lib/almacen";
import { useCatalogo, useMisSemillas } from "@/lib/hooks";
import { hoyISO } from "@/lib/mensajes";
import { ACTIVIDADES } from "@/lib/textos";

/** Anotar lo que hizo en la chacra (RF 8). Se guarda solo en el celular. */
export function FormActividad({ onListo }: { onListo: () => void }) {
  const { semillas } = useCatalogo();
  const mias = useMisSemillas();
  const [tipo, setTipo] = useState<TipoActividad | null>(null);
  const [semillaId, setSemillaId] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ordenadas = [...semillas].sort((a, b) => Number(mias.has(b.id)) - Number(mias.has(a.id)) || a.nombre.localeCompare(b.nombre));

  async function guardar() {
    if (!tipo) return setError("Elige qué hiciste.");
    if (tipo === "sembre" && !semillaId) return setError("Elige qué sembraste.");
    await db.actividades.add({ tipo, fecha, semillaId: semillaId || undefined, nota: nota.trim() || undefined });
    onListo();
  }

  return (
    <section className="rounded-2xl border-2 border-green-700 bg-white p-4">
      <h2 className="text-xl font-bold">✏️ ¿Qué hiciste?</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(Object.keys(ACTIVIDADES) as TipoActividad[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTipo(t);
              setError(null);
            }}
            aria-pressed={tipo === t}
            className={`flex flex-col items-center rounded-xl border-2 p-2 text-base font-semibold ${tipo === t ? "border-green-700 bg-green-50" : "border-stone-200"}`}
          >
            <span className="text-3xl" aria-hidden>
              {ACTIVIDADES[t].emoji}
            </span>
            {ACTIVIDADES[t].nombre}
          </button>
        ))}
      </div>

      <label className="mt-3 block text-base font-semibold text-stone-700">
        ¿En qué cultivo? {tipo !== "sembre" && <span className="font-normal text-stone-500">(opcional)</span>}
        <select
          value={semillaId}
          onChange={(e) => setSemillaId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-lg"
        >
          <option value="">— Toda la chacra —</option>
          {ordenadas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji} {s.nombre}
              {mias.has(s.id) ? " ✓" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block text-base font-semibold text-stone-700">
        ¿Cuándo?
        <input
          type="date"
          value={fecha}
          max={hoyISO()}
          onChange={(e) => setFecha(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-3 text-lg"
        />
      </label>

      <label className="mt-3 block text-base font-semibold text-stone-700">
        Nota <span className="font-normal text-stone-500">(opcional)</span>
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ej.: 2 sacos de guano de isla"
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-3 text-lg"
        />
      </label>

      {error && <p className="mt-2 text-base font-semibold text-red-700">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => void guardar()} className="flex-1 rounded-xl bg-green-700 py-3 text-lg font-bold text-white">
          Guardar
        </button>
        <button type="button" onClick={onListo} className="flex-1 rounded-xl border border-stone-300 py-3 text-lg text-stone-600">
          Cancelar
        </button>
      </div>
    </section>
  );
}
