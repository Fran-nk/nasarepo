"use client";

import { useState } from "react";
import { buscar } from "@/lib/busqueda/fonetica";
import type { Semilla } from "@/lib/contratos/tipos";

interface Props {
  semillas: Semilla[];
  /** ids sugeridos (cultivos comunes en la zona, RF 6) */
  sugeridos: string[];
  onElegir: (id: string | null) => void;
  onCerrar: () => void;
}

/** Elegir un cultivo: chips de la zona + búsqueda tolerante a la ortografía (RF 12). */
export function BuscadorCultivo({ semillas, sugeridos, onElegir, onCerrar }: Props) {
  const [texto, setTexto] = useState("");
  const resultados = texto ? buscar(texto, semillas) : [];
  const chips = sugeridos.map((id) => semillas.find((s) => s.id === id)).filter((s): s is Semilla => !!s);

  return (
    <div className="mt-3 rounded-2xl border-2 border-green-700 bg-white p-3">
      <label className="block text-base font-semibold text-stone-700" htmlFor="buscar-cultivo">
        Escribe el nombre como lo dices
      </label>
      <input
        id="buscar-cultivo"
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ej.: oyuco, abas, chocho…"
        className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-3 text-lg outline-none focus:border-green-700"
        autoComplete="off"
      />

      {texto && (
        <ul className="mt-2 flex flex-col gap-1">
          {resultados.length === 0 && <li className="p-2 text-stone-500">No encontramos ese cultivo. Prueba con otro nombre.</li>}
          {resultados.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onElegir(s.id)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left text-lg hover:bg-green-50"
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="font-semibold">{s.nombre}</span>
                {s.nombres_locales.length > 0 && (
                  <span className="truncate text-base text-stone-500">({s.nombres_locales.slice(0, 2).join(", ")})</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!texto && chips.length > 0 && (
        <>
          <p className="mt-3 text-base text-stone-600">Se siembran mucho en tu zona:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {chips.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onElegir(s.id)}
                className="rounded-full border border-stone-300 bg-stone-50 px-3 py-2 text-lg active:bg-green-100"
              >
                {s.emoji} {s.nombre}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onElegir(null)}
          className="flex-1 rounded-xl border border-stone-300 py-3 text-lg font-semibold text-stone-700"
        >
          🚫 Ninguno
        </button>
        <button type="button" onClick={onCerrar} className="flex-1 rounded-xl py-3 text-lg text-stone-500">
          Cancelar
        </button>
      </div>
    </div>
  );
}
