"use client";

import Link from "next/link";
import { useState } from "react";
import { CabeceraCultivo } from "@/app/front/components/CabeceraCultivo";
import { EditarCultivo } from "@/app/front/components/EditarCultivo";
import { ListaRecomendaciones } from "@/app/front/components/ListaRecomendaciones";
import { WidgetsCultivo } from "@/app/front/components/tarjetas/WidgetsCultivo";
import { useUbicacion } from "@/app/front/lib/hooks";

/** Pestaña Mapa, "Mi Cultivo" (Figma 51:1342): el cultivo abierto, qué se sembró antes y qué sembrar ahora. */
export default function MiCultivo() {
  const { cultivo } = useUbicacion();
  const [editando, setEditando] = useState(false);

  // Sin cultivos se ve el asistente sobre el mapa (ver Armazon), no este panel.
  if (!cultivo) return null;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/perfil" className="w-max text-[18px] leading-[28px] font-semibold text-tinta">
        ← Perfil
      </Link>
      {/* Nombre y, debajo, lo sembrado antes. El lápiz edita nombre, ícono y lo sembrado; otro cultivo se agrega en "Mi Perfil". */}
      <CabeceraCultivo cultivo={cultivo} onEditar={() => setEditando(true)} />
      {editando && <EditarCultivo cultivo={cultivo} onCerrar={() => setEditando(false)} />}
      {/* Clima que depende de este cultivo: siembra, riego, El Niño y el mes. */}
      <WidgetsCultivo />
      <ListaRecomendaciones />
      <Link
        href="/clima"
        className="rounded-[12px] border border-borde py-3 text-center text-[14px] leading-[20px] font-semibold text-tinta active:bg-arena/60 lg:hidden"
      >
        🌦️ ¿Cómo viene el clima?
      </Link>
    </div>
  );
}
