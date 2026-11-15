import { STATS } from "@/lib/textos";

type Stat = keyof typeof STATS;

const COLORES: Record<Stat, string> = {
  agua: "bg-sky-500",
  frio: "bg-indigo-400",
  calor: "bg-orange-500",
};

/** Barra de 0 a 5 (estilo ficha coleccionable). */
export function BarraStat({ stat, valor, compacta = false }: { stat: Stat; valor: number; compacta?: boolean }) {
  const info = STATS[stat];
  return (
    <div className="flex items-center gap-2" aria-label={`${info.nombre}: ${valor} de 5`}>
      <span className={compacta ? "text-sm" : "text-lg"} aria-hidden>
        {info.emoji}
      </span>
      {!compacta && <span className="w-36 shrink-0 text-base text-stone-700">{info.nombre}</span>}
      <div className="flex flex-1 gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`${compacta ? "h-2" : "h-4"} flex-1 rounded-sm ${n <= valor ? COLORES[stat] : "bg-stone-200"}`} />
        ))}
      </div>
    </div>
  );
}
