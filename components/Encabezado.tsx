"use client";

import { USAR_MOCKS } from "@/lib/api/cliente";
import { ESCENARIOS, LISTA_ESCENARIOS } from "@/lib/escenarios";
import { useEscenario, useModo } from "@/lib/preferencias";
import { APP_NOMBRE, MODO } from "@/lib/textos";

/** Barra superior: nombre, interruptor Sencillo/Avanzado y menú de escenarios de demo. */
export function Encabezado() {
  const [modo, setModo] = useModo();
  const [escenario, setEscenario] = useEscenario();

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2">
        <span className="text-2xl" aria-hidden>
          🌱
        </span>
        <span className="flex-1 truncate text-base font-bold text-green-900">
          <span className="sr-only sm:not-sr-only">{APP_NOMBRE}</span>
        </span>

        <div role="group" aria-label="Nivel de detalle" className="flex rounded-full bg-stone-100 p-1 text-sm">
          {(["sencillo", "avanzado"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              aria-pressed={modo === m}
              className={`rounded-full px-3 py-1.5 font-semibold ${modo === m ? "bg-green-700 text-white" : "text-stone-600"}`}
            >
              {MODO[m]}
            </button>
          ))}
        </div>

        {USAR_MOCKS && (
          <details className="relative">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-xl hover:bg-stone-100" aria-label="Escenario de demostración">
              ⚙️
            </summary>
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-stone-200 bg-white p-3 shadow-lg">
              <p className="mb-2 text-sm font-semibold text-stone-500">Escenario de demostración</p>
              {LISTA_ESCENARIOS.map((id) => (
                <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-base hover:bg-stone-50">
                  <input
                    type="radio"
                    name="escenario"
                    checked={escenario === id}
                    onChange={() => setEscenario(id)}
                    className="h-5 w-5 accent-green-700"
                  />
                  {ESCENARIOS[id].nombre}
                </label>
              ))}
            </div>
          </details>
        )}
      </div>
      {USAR_MOCKS && (
        <p className="bg-amber-100 px-4 py-1 text-center text-sm text-amber-900">
          Datos de prueba · {ESCENARIOS[escenario].nombre}
        </p>
      )}
    </header>
  );
}
