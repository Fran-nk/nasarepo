"use client";

import Link from "next/link";
import { BotonVoz } from "@/components/BotonVoz";
import { BarraStat } from "@/components/semillas/BarraStat";
import { TarjetaCargando, TarjetaError } from "@/components/tarjetas/TarjetaDato";
import { useCatalogo, useHistorial, useRecomendaciones } from "@/lib/hooks";
import { useModo } from "@/lib/preferencias";
import { MOTIVOS, RAREZA } from "@/lib/textos";

const MEDALLAS = ["🥇", "🥈", "🥉"];

export default function Recomendaciones() {
  const rec = useRecomendaciones();
  const { porId } = useCatalogo();
  const historial = useHistorial();
  const [modo] = useModo();
  const ultimo = historial[0] ? porId.get(historial[0]) : undefined;
  const top = (rec.datos?.recomendaciones ?? []).slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="text-lg font-semibold text-green-800">
        ← Mi chacra
      </Link>
      <div>
        <h1 className="text-2xl font-bold">🌱 Te recomendamos sembrar</h1>
        <p className="text-base text-stone-600">
          {ultimo
            ? `Pensando en tu clima y en que lo último que sembraste fue ${ultimo.nombre.toLowerCase()}.`
            : "Pensando en el clima de tu zona. Si nos dices qué sembraste antes, la recomendación mejora."}
        </p>
      </div>

      {rec.cargando && <TarjetaCargando texto="Pensando qué te conviene…" />}
      {rec.error && <TarjetaError texto={rec.error} />}

      {top.map((r, i) => {
        const s = porId.get(r.semillaId);
        if (!s) return null;
        const porQue = r.motivos.map((m) => MOTIVOS[m]);
        return (
          <article
            key={r.semillaId}
            className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${r.en_rescate ? "border-violet-500" : "border-stone-200"}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl" aria-hidden>
                {MEDALLAS[i]}
              </span>
              <span className="text-5xl" aria-hidden>
                {s.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold">{s.nombre}</h2>
                {r.en_rescate && (
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-sm font-semibold ${RAREZA.en_rescate.color}`}>
                    {RAREZA.en_rescate.nombre}
                  </span>
                )}
              </div>
              <BotonVoz texto={`${s.nombre}. ${porQue.join(" ")}`} />
            </div>

            <p className="mt-3 text-base font-semibold text-stone-500">¿Por qué?</p>
            <ul className="mt-1 flex flex-col gap-1 text-lg">
              {porQue.slice(0, 3).map((t) => (
                <li key={t}>✔️ {t}</li>
              ))}
            </ul>

            {modo === "avanzado" && (
              <div className="mt-3 rounded-xl border border-stone-200 p-3">
                <p className="text-base text-stone-600">
                  Puntaje: <span className="font-mono font-semibold text-stone-900">{Math.round(r.puntaje * 100)}/100</span> · Modelo:{" "}
                  {rec.datos?.modelo}
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  <BarraStat stat="agua" valor={s.stats.agua} />
                  <BarraStat stat="frio" valor={s.stats.frio} />
                  <BarraStat stat="calor" valor={s.stats.calor} />
                </div>
              </div>
            )}

            <Link href={`/semillas/${s.id}`} className="mt-3 block rounded-xl bg-stone-100 py-3 text-center text-lg font-semibold text-green-800">
              Ver ficha completa →
            </Link>
          </article>
        );
      })}

      {rec.datos && top.length === 0 && (
        <p className="rounded-2xl bg-white p-4 text-lg">No encontramos una recomendación para tu chacra todavía.</p>
      )}
    </div>
  );
}
