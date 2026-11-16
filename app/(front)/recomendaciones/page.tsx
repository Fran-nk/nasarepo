"use client";

import { Volver } from "@/app/front/components/Volver";
import { ListaRecomendaciones } from "@/app/front/components/ListaRecomendaciones";

/** Qué sembrar en el cultivo abierto (la misma lista que se ve en "Mi Cultivo"). */
export default function Recomendaciones() {
  return (
    <div className="flex flex-col gap-4">
      <Volver href="/" texto="Mi cultivo" />
      <ListaRecomendaciones />
    </div>
  );
}
