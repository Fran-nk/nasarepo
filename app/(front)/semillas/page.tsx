"use client";

import { useState } from "react";
import { CAMPO, FICHA_ARENA, TARJETA_BLANCA } from "@/app/front/components/estilos";
import { IconoLinea } from "@/app/front/components/IconoLinea";
import { Titulo } from "@/app/front/components/Titulo";
import { TarjetaSemilla } from "@/app/front/components/semillas/TarjetaSemilla";
import { TarjetaCargando } from "@/app/front/components/tarjetas/TarjetaDato";
import { buscar } from "@/app/front/lib/busqueda/fonetica";
import { useCatalogo, useMisSemillas, useRecomendaciones } from "@/app/front/lib/hooks";
import type { Semilla } from "@/app/front/lib/contratos/tipos";

const PESTANAS = [
  { id: "mias", texto: "Mías" },
  { id: "recomendadas", texto: "Para mí" },
  { id: "todas", texto: "Todas" },
  { id: "rescate", texto: "En rescate" },
] as const;

type Pestana = (typeof PESTANAS)[number]["id"];

export default function Semillero() {
  const { semillas, porId, cargando } = useCatalogo();
  const mias = useMisSemillas();
  const rec = useRecomendaciones();
  const [pestana, setPestana] = useState<Pestana>("todas");
  const [texto, setTexto] = useState("");

  let lista: Semilla[] = [];
  if (pestana === "todas") lista = semillas;
  if (pestana === "mias") lista = semillas.filter((s) => mias.has(s.id));
  if (pestana === "rescate") lista = semillas.filter((s) => s.rareza === "en_rescate");
  if (pestana === "recomendadas")
    lista = (rec.datos?.recomendaciones ?? []).map((r) => porId.get(r.semillaId)).filter((s): s is Semilla => !!s);
  if (texto) lista = buscar(texto, lista, 50);

  return (
    <div className="flex flex-col gap-4">
      <Titulo texto="Semillero" />

      {/* Filtros con el mismo estilo que el menú: bloque tinta el elegido, arena con borde los demás; esquinas rectas. */}
      <div className="flex gap-1" role="tablist" aria-label="Qué semillas ver">
        {PESTANAS.map((p) => {
          const activa = pestana === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setPestana(p.id)}
              className={`tactil relative h-[34px] flex-auto border px-1.5 font-titulo text-[14px] leading-none font-bold whitespace-nowrap transition-colors duration-200 ${
                activa ? "border-tinta bg-tinta text-white" : "border-tinta bg-arena text-tinta hover:bg-papel"
              }`}
            >
              {p.texto}
              {p.id === "mias" && mias.size > 0 && ` (${mias.size})`}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <IconoLinea nombre="lupa" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-tinta" />
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar semilla…"
          className={`${CAMPO} pl-11`}
          aria-label="Buscar semilla"
        />
      </div>

      {pestana === "rescate" && (
        <p className={`${FICHA_ARENA} flex gap-2 border-l-4 border-l-terracota text-[13px] leading-[18px] text-tinta`}>
          <IconoLinea nombre="estrella" className="size-4 shrink-0 text-tinta" />
          Plantas nativas que se siembran cada vez menos. Sembrarlas ayuda a que no desaparezcan.
        </p>
      )}

      {cargando || (pestana === "recomendadas" && rec.cargando) ? (
        <TarjetaCargando />
      ) : lista.length === 0 ? (
        <p className={`${TARJETA_BLANCA} text-center text-[14px] leading-[20px] text-secundario`}>
          {pestana === "mias" && !texto
            ? "Todavía no agregaste semillas. Abre una ficha y toca “Tengo esta semilla”."
            : "No hay semillas para mostrar."}
        </p>
      ) : (
        <div key={pestana} className="surcos grid grid-cols-1 gap-3 xl:grid-cols-2">
          {lista.map((s) => (
            <TarjetaSemilla key={s.id} semilla={s} tengo={mias.has(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
