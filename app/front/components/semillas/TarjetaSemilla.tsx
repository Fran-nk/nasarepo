import Link from "next/link";
import { CHIP, TARJETA_BLANCA } from "@/app/front/components/estilos";
import type { Semilla } from "@/app/front/lib/contratos/tipos";
import { CATEGORIAS, RAREZA } from "@/app/front/lib/textos";
import { BarraStat } from "./BarraStat";

/** Tarjeta de la lista del Semillero: dibujo en ficha arena a la izquierda; nombre, chips y barras a la derecha. */
export function TarjetaSemilla({ semilla, tengo }: { semilla: Semilla; tengo: boolean }) {
  const enRescate = semilla.rareza === "en_rescate";
  return (
    <Link
      href={`/semillas/${semilla.id}`}
      className={`${TARJETA_BLANCA} flex items-start gap-3 transition-transform active:scale-[0.99] ${enRescate ? "border-terracota" : ""}`}
    >
      <span
        aria-hidden
        className="flex size-[80px] shrink-0 items-center justify-center rounded-[12px] border-[0.5px] border-borde bg-arena text-[44px] lg:size-[68px] lg:text-[38px]"
      >
        {semilla.emoji}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 font-titulo text-[20px] leading-[22px] font-bold text-tinta">{semilla.nombre}</h2>
          {tengo && <span className={`${CHIP} shrink-0 bg-tinta text-white`}>La tengo</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          <span className={`${CHIP} ${CATEGORIAS[semilla.categoria].color}`}>{CATEGORIAS[semilla.categoria].nombre}</span>
          {semilla.rareza !== "comun" && <span className={`${CHIP} ${RAREZA[semilla.rareza].color}`}>{RAREZA[semilla.rareza].nombre}</span>}
        </div>
        <div className="flex flex-col gap-1 pt-0.5">
          <BarraStat stat="agua" valor={semilla.stats.agua} compacta />
          <BarraStat stat="frio" valor={semilla.stats.frio} compacta />
          <BarraStat stat="calor" valor={semilla.stats.calor} compacta />
        </div>
      </div>
    </Link>
  );
}
