import Link from "next/link";
import type { Semilla } from "@/lib/contratos/tipos";
import { CATEGORIAS, RAREZA } from "@/lib/textos";
import { BarraStat } from "./BarraStat";

/** Tarjeta pequeña de la grilla del Semillero. */
export function TarjetaSemilla({ semilla, tengo }: { semilla: Semilla; tengo: boolean }) {
  const enRescate = semilla.rareza === "en_rescate";
  return (
    <Link
      href={`/semillas/${semilla.id}`}
      className={`relative flex flex-col gap-2 rounded-2xl border-2 bg-white p-3 shadow-sm active:scale-[0.98] ${enRescate ? "border-violet-500" : "border-stone-200"}`}
    >
      {tengo && (
        <span className="absolute right-2 top-2 rounded-full bg-green-700 px-2 py-0.5 text-xs font-bold text-white">La tengo</span>
      )}
      <span className="text-center text-5xl" aria-hidden>
        {semilla.emoji}
      </span>
      <span className="text-center text-lg font-bold leading-tight">{semilla.nombre}</span>
      <div className="flex flex-wrap justify-center gap-1">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORIAS[semilla.categoria].color}`}>
          {CATEGORIAS[semilla.categoria].nombre}
        </span>
        {semilla.rareza !== "comun" && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RAREZA[semilla.rareza].color}`}>
            {RAREZA[semilla.rareza].nombre}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <BarraStat stat="agua" valor={semilla.stats.agua} compacta />
        <BarraStat stat="frio" valor={semilla.stats.frio} compacta />
        <BarraStat stat="calor" valor={semilla.stats.calor} compacta />
      </div>
    </Link>
  );
}
