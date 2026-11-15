"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PreguntaCultivosAnteriores, PreguntaMisSemillas } from "@/app/front/components/CultivosChacra";
import { BOTON_PIE_PRINCIPAL, BOTON_PIE_SECUNDARIO } from "@/app/front/components/SelectorSemillas";
import { useCultivos } from "@/app/front/lib/hooks";
import { useCultivoActivo } from "@/app/front/lib/preferencias";
import { useMapa } from "./ContextoMapa";
import { usarUbicacionActual } from "./ubicacion";

const POSICION = "fixed bottom-[82px] left-1/2 z-30 -translate-x-1/2 lg:bottom-[37px]";
const TARJETA = `${POSICION} flex w-[calc(100%-32px)] max-w-[420px] flex-col gap-3 overflow-clip rounded-[20px] border border-white bg-papel px-5 pt-[18px] pb-4 shadow-[0_6px_20px_rgba(38,59,53,0.25)]`;
const BOTON_PRINCIPAL =
  "rounded-[14px] bg-tinta px-4 py-3.5 text-[16px] leading-[24px] font-semibold text-white active:bg-tinta/90";
const BOTON_TEXTO = "text-[14px] leading-[20px] font-semibold text-tinta underline underline-offset-2";

/**
 * Asistente para crear un cultivo (también con los botones "+"):
 * 1. sin cultivos, sobre el mapa solo se ve el botón "Crear mi cultivo";
 * 2. se marcan las esquinas del terreno (o se usa la ubicación del celular): ahí se guarda el cultivo;
 * 3. en ventanas de pantalla completa se pregunta qué sembró antes y qué semillas tiene (se pueden saltar);
 * 4. al terminar se abre el cultivo con sus recomendaciones.
 */
export function CrearChacra() {
  const { apiRef, dibujando, paso, setPaso, cultivoNuevo, setCultivoNuevo, iniciarAsistente, cancelarAsistente } =
    useMapa();
  const hayCultivos = (useCultivos()?.length ?? 0) > 0;
  const [, setActivo] = useCultivoActivo();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [pregunta, setPregunta] = useState<0 | 1>(0);
  // Cada búsqueda del GPS tiene un número; al cancelar se invalida la que esté pendiente.
  const intentoGps = useRef(0);

  function usarGps() {
    setError(null);
    setBuscandoGps(true);
    apiRef.current?.cancelar();
    const intento = ++intentoGps.current;
    usarUbicacionActual(
      apiRef.current,
      (mensaje) => {
        setBuscandoGps(false);
        setError(mensaje);
      },
      (id) => {
        setBuscandoGps(false);
        setCultivoNuevo(id);
        setActivo(id);
        setPaso((p) => (p === "terreno" ? "cultivos" : p));
      },
      () => intento === intentoGps.current,
    );
  }

  function cancelar() {
    intentoGps.current++;
    setError(null);
    setBuscandoGps(false);
    cancelarAsistente();
  }

  if (paso === null) {
    return (
      <button
        type="button"
        onClick={iniciarAsistente}
        className={`${POSICION} flex w-max items-center gap-3 rounded-[14px] bg-tinta px-6 py-4 text-[18px] leading-[24px] font-semibold whitespace-nowrap text-white shadow-[0_6px_20px_rgba(38,59,53,0.35)] active:bg-tinta/90`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ícono SVG del diseño */}
        <img src="/iconos/map-pinned.svg" alt="" width={34} height={34} className="size-6" />
        Crear mi cultivo
      </button>
    );
  }

  if (paso === "cultivos" && cultivoNuevo !== null) {
    // Dos preguntas seguidas, cada una se puede saltar. Lo elegido se guarda al momento.
    const terminar = () => {
      setPregunta(0);
      setPaso(null);
    };
    // Terminado el formulario (o saltado), se abre el cultivo nuevo con sus semillas recomendadas.
    const verRecomendaciones = () => {
      setActivo(cultivoNuevo);
      terminar();
      router.push("/");
    };
    const etiqueta = `¡Tu cultivo ya está marcado! · Paso ${pregunta + 1} de 2`;
    return pregunta === 0 ? (
      <PreguntaCultivosAnteriores
        cultivoId={cultivoNuevo}
        etiqueta={etiqueta}
        onCerrar={terminar}
        pie={
          <>
            <button type="button" onClick={() => setPregunta(1)} className={BOTON_PIE_SECUNDARIO}>
              Saltar
            </button>
            <button type="button" onClick={() => setPregunta(1)} className={BOTON_PIE_PRINCIPAL}>
              Siguiente
            </button>
          </>
        }
      />
    ) : (
      <PreguntaMisSemillas
        etiqueta={etiqueta}
        onCerrar={terminar}
        pie={
          <>
            <button type="button" onClick={verRecomendaciones} className={BOTON_PIE_SECUNDARIO}>
              Saltar
            </button>
            <button type="button" onClick={verRecomendaciones} className={BOTON_PIE_PRINCIPAL}>
              Listo, ¿qué siembro?
            </button>
          </>
        }
      />
    );
  }

  // Paso "terreno"
  return (
    <section aria-label="Marcar mi cultivo" className={TARJETA}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-petroleo" />
      {buscandoGps ? (
        <p className="text-[16px] leading-[24px] text-tinta">📍 Buscando dónde estás…</p>
      ) : dibujando ? (
        <>
          <p className="text-[16px] leading-[24px] text-tinta">
            Toca en el mapa <strong>cada esquina</strong> de tu terreno. Cuando marques todas, toca “Listo”.
          </p>
          <button type="button" onClick={() => apiRef.current?.terminar()} className={BOTON_PRINCIPAL}>
            ✅ Listo, terminar mi terreno
          </button>
        </>
      ) : (
        <>
          <p className="text-[16px] leading-[24px] text-tinta">
            Para marcar tu terreno toca <strong>al menos 3 esquinas</strong> en el mapa.
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              apiRef.current?.dibujar();
            }}
            className={BOTON_PRINCIPAL}
          >
            ✏️ Marcar mi terreno otra vez
          </button>
        </>
      )}
      {!buscandoGps && (
        <button type="button" onClick={usarGps} className={BOTON_TEXTO}>
          📍 Estoy en mi terreno: usar dónde estoy
        </button>
      )}
      {error && <p className="rounded-[4px] bg-terracota/15 px-3 py-2 text-[14px] leading-[20px] text-tinta">{error}</p>}
      <button type="button" onClick={cancelar} className="text-[14px] leading-[20px] text-secundario">
        {hayCultivos ? "Cancelar, no agregar este cultivo" : "Volver"}
      </button>
    </section>
  );
}
