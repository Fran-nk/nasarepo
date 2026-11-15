import { IconoLinea, type NombreIconoLinea } from "@/app/front/components/IconoLinea";
import { STATS } from "@/app/front/lib/textos";

type Stat = keyof typeof STATS;

const COLORES: Record<Stat, string> = {
  agua: "bg-petroleo",
  frio: "bg-tinta/60",
  calor: "bg-terracota",
};

const ICONOS: Record<Stat, NombreIconoLinea> = { agua: "gota", frio: "copo", calor: "sol" };

/** Barra de 0 a 5 con su ícono de línea (estilo ficha coleccionable). */
export function BarraStat({ stat, valor, compacta = false }: { stat: Stat; valor: number; compacta?: boolean }) {
  const info = STATS[stat];
  return (
    <div className="flex items-center gap-2" aria-label={`${info.nombre}: ${valor} de 5`}>
      <IconoLinea nombre={ICONOS[stat]} className={`shrink-0 text-tinta ${compacta ? "size-3.5" : "size-4"}`} />
      {!compacta && <span className="w-32 shrink-0 text-[14px] leading-[20px] text-tinta">{info.nombre}</span>}
      <div className="flex flex-1 gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`${compacta ? "h-2" : "h-3"} flex-1 rounded-[1.5px] ${n <= valor ? COLORES[stat] : "bg-arena"}`} />
        ))}
      </div>
    </div>
  );
}
