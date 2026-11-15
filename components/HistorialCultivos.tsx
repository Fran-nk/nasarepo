"use client";

import { useState } from "react";
import { BuscadorCultivo } from "@/components/BuscadorCultivo";
import { guardarCultivoHistorial } from "@/lib/almacen";
import { useCatalogo, useHistorial } from "@/lib/hooks";
import { HISTORIAL_ETIQUETAS } from "@/lib/textos";

/** Los 3 últimos cultivos sembrados en la chacra (entrada de la red neuronal). */
export function HistorialCultivos({ sugeridos }: { sugeridos: string[] }) {
  const historial = useHistorial();
  const { semillas, porId } = useCatalogo();
  const [editando, setEditando] = useState<0 | 1 | 2 | null>(null);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold">🌾 ¿Qué sembraste antes?</h2>
      <p className="text-base text-stone-600">Nos ayuda a recomendarte una buena rotación.</p>

      <ol className="mt-3 flex flex-col gap-2">
        {HISTORIAL_ETIQUETAS.map((etiqueta, i) => {
          const pos = i as 0 | 1 | 2;
          const semilla = historial[pos] ? porId.get(historial[pos]!) : undefined;
          return (
            <li key={etiqueta}>
              <button
                type="button"
                onClick={() => setEditando(editando === pos ? null : pos)}
                className="flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-left"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-base font-bold text-white">
                  {i + 1}
                </span>
                <span className="flex-1">
                  <span className="block text-sm text-stone-500">{etiqueta}</span>
                  <span className="block text-lg font-semibold">
                    {semilla ? `${semilla.emoji} ${semilla.nombre}` : historial[pos] === null ? "Ninguno / no sé" : "…"}
                  </span>
                </span>
                <span className="text-base font-semibold text-green-800">Cambiar</span>
              </button>
              {editando === pos && (
                <BuscadorCultivo
                  semillas={semillas}
                  sugeridos={sugeridos}
                  onCerrar={() => setEditando(null)}
                  onElegir={(id) => {
                    void guardarCultivoHistorial(pos, id);
                    setEditando(null);
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
