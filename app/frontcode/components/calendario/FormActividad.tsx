"use client";

import { useState } from "react";
import { db, type TipoActividad } from "@/app/frontcode/lib/almacen";
import { useCatalogo, useMisSemillas } from "@/app/frontcode/lib/hooks";
import { hoyISO } from "@/app/frontcode/lib/mensajes";
import { ACTIVIDADES, AVISOS } from "@/app/frontcode/lib/textos";
import { useAviso } from "@/app/frontcode/components/Avisos";
import { BOTON_OSCURO, CAMPO, ROTULO_BLOQUE } from "@/app/frontcode/components/estilos";

/** Anotar lo que hizo en la chacra (RF 8). Se guarda solo en el celular. */
export function FormActividad({ onListo }: { onListo: () => void }) {
  const { semillas } = useCatalogo();
  const mias = useMisSemillas();
  const [tipo, setTipo] = useState<TipoActividad | null>(null);
  const [semillaId, setSemillaId] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const avisar = useAviso();

  const ordenadas = [...semillas].sort((a, b) => Number(mias.has(b.id)) - Number(mias.has(a.id)) || a.nombre.localeCompare(b.nombre));

  async function guardar() {
    if (!tipo) return setError("Elige qué hiciste.");
    if (tipo === "sembre" && !semillaId) return setError("Elige qué sembraste.");
    await db.actividades.add({ tipo, fecha, semillaId: semillaId || undefined, nota: nota.trim() || undefined });
    avisar({ texto: AVISOS.actividadGuardada });
    onListo();
  }

  return (
    <section className="flex flex-col">
      <h3 className="font-titulo text-[20px] leading-[24px] font-bold text-tinta">¿Qué hiciste?</h3>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {(Object.keys(ACTIVIDADES) as TipoActividad[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTipo(t);
              setError(null);
            }}
            aria-pressed={tipo === t}
            className={`flex flex-col items-center gap-1 rounded-[12px] border p-2 text-[13px] leading-[15px] font-semibold text-tinta transition-colors ${
              tipo === t ? "border-tinta bg-pradera/30" : "border-borde bg-arena hover:bg-arena/70"
            }`}
          >
            <span className="text-[24px] leading-none" aria-hidden>
              {ACTIVIDADES[t].emoji}
            </span>
            {ACTIVIDADES[t].nombre}
          </button>
        ))}
      </div>

      <label className={`mt-3 block ${ROTULO_BLOQUE}`}>
        ¿En qué cultivo? {tipo !== "sembre" && <span className="font-normal text-secundario normal-case">(opcional)</span>}
        <select
          value={semillaId}
          onChange={(e) => setSemillaId(e.target.value)}
          className={`mt-1 ${CAMPO} font-sans font-normal normal-case`}
        >
          <option value="">— Todo el terreno —</option>
          {ordenadas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji} {s.nombre}
              {mias.has(s.id) ? " ✓" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className={`mt-3 block ${ROTULO_BLOQUE}`}>
        ¿Cuándo?
        <input
          type="date"
          value={fecha}
          max={hoyISO()}
          onChange={(e) => setFecha(e.target.value)}
          className={`mt-1 ${CAMPO} font-sans font-normal normal-case`}
        />
      </label>

      <label className={`mt-3 block ${ROTULO_BLOQUE}`}>
        Nota <span className="font-normal text-secundario normal-case">(opcional)</span>
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ej.: 2 sacos de guano de isla"
          className={`mt-1 ${CAMPO} font-sans font-normal normal-case`}
        />
      </label>

      {error && <p className="mt-2 text-[13px] leading-[18px] font-semibold text-terracota-fuerte">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => void guardar()} className={`${BOTON_OSCURO} flex-1`}>
          Guardar
        </button>
        <button type="button" onClick={onListo} className="flex-1 rounded-[12px] border border-borde py-3 text-[14px] leading-[20px] font-semibold text-secundario hover:bg-arena/60">
          Cancelar
        </button>
      </div>
    </section>
  );
}
