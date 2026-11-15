"use client";

import Link from "next/link";
import { BotonVoz } from "@/components/BotonVoz";
import { TarjetaCargando } from "@/components/tarjetas/TarjetaDato";
import { alternarMiSemilla } from "@/lib/almacen";
import { useCatalogo, useMisSemillas } from "@/lib/hooks";
import { formatoMiles } from "@/lib/mensajes";
import { useModo } from "@/lib/preferencias";
import { CATEGORIAS, RAREZA } from "@/lib/textos";
import { BarraStat } from "./BarraStat";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="mb-2 text-lg font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

function duracion(dias: number): string {
  if (dias >= 365) {
    const anios = Math.round(dias / 365);
    return anios === 1 ? "1 año" : `${anios} años`;
  }
  const meses = Math.round(dias / 30);
  return meses === 1 ? "1 mes" : `${meses} meses`;
}

/** Ficha completa de una semilla (estilo coleccionable, diseño propio). */
export function FichaSemilla({ id }: { id: string }) {
  const { porId, cargando } = useCatalogo();
  const mias = useMisSemillas();
  const [modo] = useModo();
  const s = porId.get(id);

  if (cargando) return <TarjetaCargando />;
  if (!s)
    return (
      <p className="rounded-2xl bg-white p-4 text-lg">
        No encontramos esta semilla. <Link href="/semillas" className="font-semibold text-green-800 underline">Volver</Link>
      </p>
    );

  const tengo = mias.has(s.id);
  const enRescate = s.rareza === "en_rescate";
  const nombres = (ids: string[]) =>
    ids
      .map((x) => porId.get(x))
      .filter((x) => !!x)
      .map((x) => `${x!.emoji} ${x!.nombre}`);
  const bien = nombres(s.despues_de_bien);
  const mal = nombres(s.despues_de_mal);
  const textoVoz = [
    s.nombre,
    s.historia_rescate,
    `Necesita agua: ${s.stats.agua} de 5. Aguanta el frío: ${s.stats.frio} de 5. Aguanta el calor: ${s.stats.calor} de 5.`,
    `Crece entre ${s.altura_min_m} y ${s.altura_max_m} metros de altura.`,
    s.habilidades.join(". "),
    `Cómo guardar tu semilla: ${s.guardar_semilla}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <div className="flex flex-col gap-3">
      <Link href="/semillas" className="text-lg font-semibold text-green-800">
        ← Semillero
      </Link>

      <header className={`rounded-3xl border-4 p-4 text-center ${enRescate ? "border-violet-500 bg-violet-50" : "border-amber-300 bg-amber-50"}`}>
        <div className="flex justify-end">
          <BotonVoz texto={textoVoz} />
        </div>
        <div className="text-7xl" aria-hidden>
          {s.emoji}
        </div>
        <h1 className="mt-2 text-3xl font-bold">{s.nombre}</h1>
        {s.nombres_locales.length > 0 && (
          <p className="text-base text-stone-600">También le dicen: {s.nombres_locales.join(", ")}</p>
        )}
        {modo === "avanzado" && <p className="text-base italic text-stone-500">{s.cientifico} · {s.familia}</p>}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${CATEGORIAS[s.categoria].color}`}>
            {CATEGORIAS[s.categoria].nombre}
          </span>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${RAREZA[s.rareza].color}`}>{RAREZA[s.rareza].nombre}</span>
          {s.perenne && <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-900">Vive varios años</span>}
        </div>
      </header>

      {enRescate && s.historia_rescate && (
        <section className="rounded-2xl bg-violet-600 p-4 text-white">
          <h2 className="text-lg font-bold">⭐ ¿Por qué rescatarla?</h2>
          <p className="mt-1 text-lg">{s.historia_rescate}</p>
        </section>
      )}

      <Seccion titulo="📋 Sus características">
        <div className="flex flex-col gap-2">
          <BarraStat stat="agua" valor={s.stats.agua} />
          <BarraStat stat="frio" valor={s.stats.frio} />
          <BarraStat stat="calor" valor={s.stats.calor} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-stone-50 p-2">
            <dt className="text-sm text-stone-500">⛰️ Crece a</dt>
            <dd className="text-lg font-bold">
              {formatoMiles(s.altura_min_m)}–{formatoMiles(s.altura_max_m)} m
            </dd>
          </div>
          <div className="rounded-xl bg-stone-50 p-2">
            <dt className="text-sm text-stone-500">🧺 {s.perenne ? "Primera cosecha en" : "Se cosecha en"}</dt>
            <dd className="text-lg font-bold">{duracion(s.ciclo_dias)}</dd>
          </div>
        </dl>
      </Seccion>

      {s.habilidades.length > 0 && (
        <Seccion titulo="✨ Habilidades">
          <ul className="flex flex-col gap-1 text-lg">
            {s.habilidades.map((h) => (
              <li key={h}>✔️ {h}</li>
            ))}
          </ul>
        </Seccion>
      )}

      {!s.perenne && (bien.length > 0 || mal.length > 0) && (
        <Seccion titulo="🔄 Rotación">
          {bien.length > 0 && (
            <p className="text-lg">
              <span className="font-semibold text-green-800">👍 Siémbrala después de: </span>
              {bien.join(", ")}
            </p>
          )}
          {mal.length > 0 && (
            <p className="mt-2 text-lg">
              <span className="font-semibold text-red-700">👎 No la siembres después de: </span>
              {mal.join(", ")}
            </p>
          )}
        </Seccion>
      )}
      {s.perenne && (
        <Seccion titulo="🌳 Cómo sembrarla">
          <p className="text-lg">Vive varios años: siémbrala en el borde de la chacra, como sombra o junto a otros árboles. No entra en la rotación.</p>
        </Seccion>
      )}

      <Seccion titulo="🍽️ Para qué sirve">
        <div className="flex flex-wrap gap-2">
          {s.usos.map((u) => (
            <span key={u} className="rounded-full bg-stone-100 px-3 py-1 text-lg">
              {u}
            </span>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="🫙 Cómo guardar tu semilla">
        <p className="text-lg">{s.guardar_semilla}</p>
      </Seccion>

      <button
        type="button"
        onClick={() => void alternarMiSemilla(s.id)}
        className={`sticky bottom-24 rounded-2xl px-4 py-4 text-xl font-bold shadow-lg ${tengo ? "border-2 border-green-700 bg-white text-green-800" : "bg-green-700 text-white"}`}
      >
        {tengo ? "✅ La tengo (tocar para quitar)" : "➕ Tengo esta semilla"}
      </button>
    </div>
  );
}
