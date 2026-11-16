"use client";

import { Volver } from "@/app/frontcode/components/Volver";
import { ListaRecomendaciones } from "@/app/frontcode/components/ListaRecomendaciones";

/** Qué sembrar en el cultivo abierto (la misma lista que se ve en "Mi Cultivo"). */
export default function Recomendaciones() {
  return (
    <div className="flex flex-col gap-4">
      <Volver href="/" texto="Mi cultivo" />
      <ListaRecomendaciones />
    </div>
  );
}
