"use client";

import Link from "next/link";
import { ListaRecomendaciones } from "@/components/ListaRecomendaciones";

/** Qué sembrar en el cultivo abierto (la misma lista que se ve en "Mi Cultivo"). */
export default function Recomendaciones() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="w-max text-[18px] leading-[28px] font-semibold text-tinta">
        ← Mi cultivo
      </Link>
      <ListaRecomendaciones />
    </div>
  );
}
