"use client";

import Link from "next/link";
import { useState } from "react";
import { CabeceraCultivo } from "@/app/frontcode/components/CabeceraCultivo";
import { EditarCultivo } from "@/app/frontcode/components/EditarCultivo";
import { ListaRecomendaciones } from "@/app/frontcode/components/ListaRecomendaciones";
import { WidgetsCultivo } from "@/app/frontcode/components/tarjetas/WidgetsCultivo";
import { useUbicacion } from "@/app/frontcode/lib/hooks";

/** Pestaña Mapa, "Mi Cultivo" (Figma 89:905): el cultivo abierto, cómo está hoy y, lo principal, qué sembrar ahora. */
export default function MiCultivo() {
  const { cultivo } = useUbicacion();
  const [editando, setEditando] = useState(false);

  // Sin cultivos se ve el asistente sobre el mapa (ver Armazon), no este panel.
  if (!cultivo) return null;

  return (
    <div className="surcos flex flex-col gap-4">
      {/* Nombre y, debajo, lo sembrado antes. El lápiz edita nombre, ícono y lo sembrado; otro cultivo se agrega en "Mi Perfil". */}
      <CabeceraCultivo cultivo={cultivo} onEditar={() => setEditando(true)} />
      {editando && <EditarCultivo cultivo={cultivo} onCerrar={() => setEditando(false)} />}
      {/* Clima que depende de este cultivo: siembra, riego, El Niño y el mes. */}
      <WidgetsCultivo />
      <ListaRecomendaciones />
      <Link
        href="/clima"
        className="min-h-12 rounded-[12px] border border-borde py-3 text-center text-[14px] leading-[20px] font-semibold text-tinta active:bg-arena/60 lg:hidden"
      >
        🌦️ ¿Cómo viene el clima?
      </Link>
    </div>
  );
}
