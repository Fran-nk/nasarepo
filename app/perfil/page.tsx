"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MisSemillasChacra } from "@/app/frontcode/components/CultivosChacra";
import { Rotulo } from "@/app/frontcode/components/Titulo";
import { useMapa } from "@/app/frontcode/components/mapa/ContextoMapa";
import { SeccionCalendario } from "@/app/frontcode/components/secciones/SeccionCalendario";
import type { Cultivo } from "@/app/frontcode/lib/almacen";
import { ESCENARIOS, LISTA_ESCENARIOS } from "@/app/frontcode/lib/escenarios";
import { useCatalogo, useContexto, useUbicacion } from "@/app/frontcode/lib/hooks";
import { useCultivoActivo, useEscenario, useNombreUsuario } from "@/app/frontcode/lib/preferencias";
import { ICONOS_CHACRA, REGIONES, ZONAS } from "@/app/frontcode/lib/textos";

const TARJETA =
  "flex w-full flex-col rounded-[16px] border-[0.8px] border-borde bg-white p-3 shadow-[0_0.633px_0.475px_rgba(0,0,0,0.1),0_0.633px_0.317px_rgba(0,0,0,0.1)] lg:rounded-[12.667px] lg:p-[10px]";
const TITULO_TARJETA = "text-[16px] leading-[22px] font-semibold text-tinta lg:text-[14px] lg:leading-[20px]";
const FILA = "flex w-full items-center rounded-[8px] border-[0.8px] border-borde bg-arena py-[10px] pl-[7.6px] lg:rounded-[7.6px]";

/** Fila de "Mis Cultivos" (Figma 40:1078): ícono, nombre, lo último sembrado y la región. */
function FilaCultivo({ cultivo, abierto, onAbrir }: { cultivo: Cultivo; abierto: boolean; onAbrir: () => void }) {
  const { porId } = useCatalogo();
  const contexto = useContexto({ lat: cultivo.lat, lon: cultivo.lon });
  const zona = contexto.datos ? ZONAS[contexto.datos.zona] : undefined;
  const ultimo = cultivo.historial[0] ? porId.get(cultivo.historial[0]) : undefined;

  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-current={abierto ? "true" : undefined}
      className={`${FILA} text-left transition-colors hover:bg-arena/70 ${abierto ? "outline-2 outline-offset-1 outline-tinta" : ""}`}
    >
      <span className="flex min-w-0 items-center gap-[6.3px]">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-petroleo text-[20px] lg:size-[34px] lg:text-[17px]"
        >
          {cultivo.icono ?? ICONOS_CHACRA[0]}
        </span>
        <span className="flex min-w-0 flex-col justify-center gap-[5px]">
          <span className="truncate font-titulo text-[24px] leading-none font-bold text-tinta lg:text-[20.27px]">
            {cultivo.nombre}
          </span>
          <span className="flex items-center gap-[10px]">
            <span className="font-titulo text-[14px] leading-none font-medium whitespace-nowrap text-tinta lg:text-[13px]">
              {ultimo ? ultimo.nombre : "Sin cultivo anterior"}
            </span>
            {zona && (
              <span className="rounded-[1.5px] bg-senal px-[7.3px] py-[2.9px] font-titulo text-[11px] leading-[14px] font-bold whitespace-nowrap text-tinta uppercase lg:text-[11px]">
                {REGIONES[zona.region]}
              </span>
            )}
          </span>
        </span>
      </span>
    </button>
  );
}

/** Botón "+" (Figma 51:1694). */
function BotonMas({ onClick, etiqueta }: { onClick: () => void; etiqueta: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="tactil relative flex shrink-0 items-center justify-center rounded-[10px] bg-petroleo-fuerte p-[10px] active:bg-petroleo-fuerte/85 lg:rounded-[8.867px] lg:p-[6.334px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ícono SVG del diseño */}
      <img src="/iconos/plus.svg" alt="" width={15.201} height={15.201} />
    </button>
  );
}

/** Pestaña "Mi Perfil" (Figma 38:622): sus cultivos, sus semillas y qué sembrar ahora. El título va en el menú. */
export default function MiPerfil() {
  const router = useRouter();
  const { cultivo, cultivos } = useUbicacion();
  const [, setActivo] = useCultivoActivo();
  const [escenario, setEscenario] = useEscenario();
  const { iniciarAsistente } = useMapa();
  const [usuario, setUsuario] = useNombreUsuario();

  function abrir(c: Cultivo) {
    setActivo(c.id!);
    router.push("/");
  }

  return (
    <div className="surcos flex flex-col gap-5">
      {usuario && (
        <div className="flex items-baseline justify-between gap-3 px-1">
          <p className="min-w-0 truncate font-titulo text-[22px] leading-[26px] font-bold text-tinta">Hola, {usuario}</p>
          {/* Sin cuentas: "cambiar" olvida el nombre y vuelve a preguntarlo. Los cultivos no se tocan. */}
          <button
            type="button"
            onClick={() => setUsuario("")}
            className="tactil relative shrink-0 text-[13px] leading-[18px] font-semibold text-secundario underline underline-offset-2"
          >
            Cambiar nombre
          </button>
        </div>
      )}
      <section aria-label="Mis cultivos" className={TARJETA}>
        <h2 className={TITULO_TARJETA}>Mis Cultivos</h2>
        <ul className="flex flex-col gap-[5px] pt-2 lg:pt-[7.6px]">
          {cultivos.map((c) => (
            <li key={c.id}>
              <FilaCultivo cultivo={c} abierto={c.id === cultivo?.id} onAbrir={() => abrir(c)} />
            </li>
          ))}
          <li className={`${FILA} justify-center pr-[7.6px]`}>
            <BotonMas onClick={iniciarAsistente} etiqueta="Agregar otro cultivo" />
          </li>
        </ul>
      </section>

      <MisSemillasChacra />

      <Link
        href="/"
        className="flex min-h-12 items-center justify-center rounded-[10px] bg-petroleo-fuerte px-[10px] py-3 text-center text-[15px] leading-[20px] font-semibold text-[#fffdf6] active:bg-petroleo-fuerte/85 lg:rounded-[8.867px] lg:py-[8.867px] lg:text-[14px] lg:leading-[20px]"
      >
        ¿Qué siembro ahora?
      </Link>

      {/* Fuera del diseño de Figma: siguen alcanzables desde aquí. */}
      <section aria-label="Calendario" className={`${TARJETA} gap-3`}>
        <h2 className={TITULO_TARJETA}>Calendario</h2>
        <SeccionCalendario />
      </section>

      {cultivos.length === 0 && (
        <section className={`${TARJETA} gap-2`} aria-label="Lugar de ejemplo">
          <Rotulo texto="Lugar de ejemplo" />
          <p className="text-[13px] leading-[18px] text-secundario">
            Mientras no marques tu cultivo, mostramos el clima real de este lugar.
          </p>
          {LISTA_ESCENARIOS.map((id) => (
            <label
              key={id}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] p-2 text-[14px] leading-[20px] text-tinta hover:bg-arena/40"
            >
              <input
                type="radio"
                name="escenario"
                checked={escenario === id}
                onChange={() => setEscenario(id)}
                className="size-5 accent-tinta"
              />
              {ESCENARIOS[id].nombre}
            </label>
          ))}
        </section>
      )}
    </div>
  );
}
