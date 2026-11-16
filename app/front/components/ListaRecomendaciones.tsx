"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BotonVoz } from "@/app/front/components/BotonVoz";
import { BOTON_ARENA, CHIP, FICHA_ARENA, ROTULO_BLOQUE, ROTULO_FICHA, VALOR_FICHA } from "@/app/front/components/estilos";
import { IconoLinea, type NombreIconoLinea } from "@/app/front/components/IconoLinea";
import { BarraStat } from "@/app/front/components/semillas/BarraStat";
import { duracion } from "@/app/front/components/semillas/FichaSemilla";
import { TarjetaCargando, TarjetaError } from "@/app/front/components/tarjetas/TarjetaDato";
import type { Recomendacion, Semilla } from "@/app/front/lib/contratos/tipos";
import { useCatalogo, useMisSemillas, useRecomendaciones } from "@/app/front/lib/hooks";
import { CATEGORIAS, MOTIVOS, RAREZA } from "@/app/front/lib/textos";

/** Qué tan buena opción es, en palabras (el puntaje va de 0 a 1). */
function calidad(puntaje: number) {
  if (puntaje >= 0.75) return "Muy buena";
  if (puntaje >= 0.5) return "Buena";
  return "Regular";
}

/**
 * "Te recomendamos sembrar": las 3 mejores semillas para el cultivo abierto, en filas mínimas
 * (puesto, dibujo y nombre). Al tocar una se abre a la derecha del panel el detalle completo.
 */
export function ListaRecomendaciones() {
  const rec = useRecomendaciones();
  const { porId } = useCatalogo();
  const mias = useMisSemillas();
  const [elegida, setElegida] = useState<string | null>(null);
  const top = (rec.datos?.recomendaciones ?? []).slice(0, 5);
  const abierta = top.find((r) => r.semillaId === elegida);
  const semillaAbierta = abierta ? porId.get(abierta.semillaId) : undefined;

  return (
    <section aria-label="Te recomendamos sembrar" className="flex flex-col gap-3">
      <h2 className="font-titulo text-[24px] leading-[30px] font-bold text-tinta">Te recomendamos sembrar</h2>

      {rec.cargando && <TarjetaCargando texto="Pensando qué te conviene…" />}
      {rec.error && <TarjetaError texto={rec.error} />}
      {rec.datos?.avisos?.map((aviso) => <p key={aviso} className="text-sm text-secundario">{aviso}</p>)}

      <ol className="flex flex-col gap-1.5">
        {top.map((r, i) => {
          const s = porId.get(r.semillaId);
          if (!s) return null;
          const activa = elegida === s.id;
          const notas = [r.en_rescate && "En rescate", mias.has(s.id) && "Ya la tienes"].filter(Boolean).join(" · ");
          return (
            <li key={r.semillaId}>
              <button
                type="button"
                onClick={() => setElegida(activa ? null : s.id)}
                aria-expanded={activa}
                className={`flex w-full items-center gap-2.5 rounded-[12px] border p-2 text-left transition-colors ${
                  activa ? "border-tinta bg-white" : "border-borde bg-arena hover:bg-arena/70"
                }`}
              >
                <span className="flex size-6 shrink-0 items-center justify-center bg-tinta font-titulo text-[14px] leading-none font-bold text-white">
                  {i + 1}
                </span>
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border-[0.5px] border-borde bg-white text-[24px] leading-none"
                >
                  {s.emoji}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-titulo text-[18px] leading-[22px] font-bold text-tinta">{s.nombre}</span>
                  {notas && <span className="text-[11px] leading-[14px] text-secundario">{notas}</span>}
                </span>
                <IconoLinea
                  nombre="flecha"
                  className={`size-4 shrink-0 text-tinta transition-transform duration-200 ${activa ? "translate-x-0.5" : ""}`}
                />
              </button>
            </li>
          );
        })}
      </ol>

      {rec.datos && top.length === 0 && (
        <p className={`${FICHA_ARENA} text-[14px] leading-[20px] text-tinta`}>No encontramos una recomendación para este cultivo todavía.</p>
      )}

      {abierta && semillaAbierta && (
        <DetalleRecomendacion
          key={abierta.semillaId}
          recomendacion={abierta}
          semilla={semillaAbierta}
          puesto={top.indexOf(abierta) + 1}
          tengo={mias.has(semillaAbierta.id)}
          onCerrar={() => setElegida(null)}
        />
      )}
    </section>
  );
}

/** Ficha arena con un dato (como los widgets de "Tu cultivo hoy"). */
function Dato({ icono, etiqueta, valor }: { icono: NombreIconoLinea; etiqueta: string; valor: string }) {
  return (
    <div className={`${FICHA_ARENA} flex flex-col gap-1`}>
      <span className="flex items-center gap-1.5">
        <IconoLinea nombre={icono} className="size-4 shrink-0 text-tinta" />
        <span className={ROTULO_FICHA}>{etiqueta}</span>
      </span>
      <span className={VALOR_FICHA}>{valor}</span>
    </div>
  );
}

/**
 * Desplegable con el detalle de una recomendación. En escritorio se abre a la derecha del panel
 * (mismo alto y estilo que el panel); en el celular ocupa toda la pantalla.
 */
function DetalleRecomendacion({
  recomendacion: r,
  semilla: s,
  puesto,
  tengo,
  onCerrar,
}: {
  recomendacion: Recomendacion;
  semilla: Semilla;
  puesto: number;
  tengo: boolean;
  onCerrar: () => void;
}) {
  const porQue = r.motivos.map((m) => MOTIVOS[m]);

  useEffect(() => {
    function alTeclado(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [onCerrar]);

  return createPortal(
    <aside
      aria-label={`Detalle de ${s.nombre}`}
      className="fixed inset-0 z-40 flex flex-col gap-4 overflow-y-auto bg-papel px-5 pt-5 pb-8 transition-[opacity,translate] duration-300 ease-out [scrollbar-width:none] starting:-translate-x-3 starting:opacity-0 motion-reduce:transition-none lg:inset-auto lg:top-[66px] lg:bottom-[18px] lg:left-[356px] lg:z-20 lg:w-[320px] lg:rounded-[10px] lg:px-[15px] lg:py-5 lg:shadow-[0_4px_16px_rgba(38,59,53,0.18)]"
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-[72px] shrink-0 items-center justify-center rounded-[12px] border-[0.5px] border-borde bg-arena text-[40px]"
        >
          {s.emoji}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
          <h3 className="font-titulo text-[26px] leading-[28px] font-bold text-tinta">
            <span className="sr-only">Recomendación {puesto}: </span>
            {s.nombre}
          </h3>
          <div className="flex flex-wrap gap-1">
            <span className={`${CHIP} ${CATEGORIAS[s.categoria].color}`}>{CATEGORIAS[s.categoria].nombre}</span>
            {r.en_rescate && <span className={`${CHIP} ${RAREZA.en_rescate.color}`}>{RAREZA.en_rescate.nombre}</span>}
            {tengo && <span className={`${CHIP} bg-tinta text-white`}>Ya la tienes</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar detalle"
            className="flex size-8 items-center justify-center rounded-[8px] border border-borde text-tinta hover:bg-arena"
          >
            <IconoLinea nombre="equis" className="size-4" />
          </button>
          <BotonVoz texto={`${s.nombre}. ${porQue.join(" ")}`} pequeno className="bg-white" />
        </div>
      </header>

      <section className="flex flex-col gap-1.5">
        <h4 className={ROTULO_BLOQUE}>¿Por qué?</h4>
        <ul className="flex flex-col gap-1.5">
          {porQue.map((t) => (
            <li key={t} className="flex gap-2 text-[14px] leading-[20px] text-tinta">
              <IconoLinea nombre="check" className="mt-[2px] size-4 shrink-0 text-tinta" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-1.5">
        <Dato icono="estrella" etiqueta="Qué tan buena" valor={calidad(r.puntaje)} />
        <Dato icono="reloj" etiqueta={s.perenne ? "Primera cosecha" : "Cosecha en"} valor={duracion(s.ciclo_dias)} />
      </div>

      <section className="flex flex-col gap-2">
        <h4 className={ROTULO_BLOQUE}>Lo que necesita</h4>
        <BarraStat stat="agua" valor={s.stats.agua} />
        <BarraStat stat="frio" valor={s.stats.frio} />
        <BarraStat stat="calor" valor={s.stats.calor} />
      </section>

      {r.en_rescate && s.historia_rescate && (
        <p className="rounded-[12px] bg-tinta p-3 text-[13px] leading-[18px] text-papel">{s.historia_rescate}</p>
      )}

      <Link href={`/semillas/${s.id}`} className={`${BOTON_ARENA} mt-auto`}>
        Ver ficha completa →
      </Link>
    </aside>,
    document.body,
  );
}
