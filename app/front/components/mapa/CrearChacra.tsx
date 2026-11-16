"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { PreguntaCultivosAnteriores, PreguntaMisSemillas } from "@/app/front/components/CultivosChacra";
import { CAMPO } from "@/app/front/components/estilos";
import { BOTON_PIE_PRINCIPAL, BOTON_PIE_SECUNDARIO } from "@/app/front/components/SelectorSemillas";
import { nombreCultivo } from "@/app/front/lib/almacen";
import { useCultivos } from "@/app/front/lib/hooks";
import { useCultivoActivo, useNombreUsuario } from "@/app/front/lib/preferencias";
import { useMapa } from "./ContextoMapa";
import { usarUbicacionActual } from "./ubicacion";

const POSICION = "fixed bottom-[82px] left-1/2 z-30 -translate-x-1/2 lg:bottom-[37px]";
// En pantallas bajas la tarjeta no pasa del borde de arriba: se desplaza por dentro.
const TARJETA = `${POSICION} flex max-h-[calc(100dvh-100px)] w-[calc(100%-32px)] max-w-[420px] flex-col gap-3 overflow-y-auto overscroll-contain rounded-[20px] border border-white bg-papel px-5 pt-[18px] pb-4 shadow-[0_6px_20px_rgba(38,59,53,0.25)]`;
const BOTON_PRINCIPAL =
  "rounded-[14px] bg-tinta px-4 py-3.5 text-[16px] leading-[24px] font-semibold text-white active:bg-tinta/90 disabled:bg-tinta/40";
const BOTON_TEXTO = "text-[14px] leading-[20px] font-semibold text-tinta underline underline-offset-2";
const PASO = "text-[13px] leading-[16px] font-semibold text-secundario";

/** Pasos del asistente completo (la primera vez): datos, terreno, lo que sembró antes y sus semillas. */
const TOTAL_PASOS = 4;

/**
 * Inicio sin contraseña: la persona dice cómo se llama y cómo se llama su cultivo. Todo se guarda solo
 * en el celular. También sirve para nombrar cada cultivo nuevo (sin volver a pedir el nombre de la persona)
 * y para volver a escribir el nombre después de "Cambiar nombre" (sin pedir un cultivo si ya tiene).
 */
function FormularioInicio({
  pedirNombre,
  pedirCultivo,
  nombreSugerido,
  onListo,
  onCancelar,
}: {
  pedirNombre: boolean;
  pedirCultivo: boolean;
  nombreSugerido: string;
  onListo: (datos: { nombre: string; cultivo: string }) => void;
  onCancelar?: () => void;
}) {
  const id = useId();
  const [nombre, setNombre] = useState("");
  const [cultivo, setCultivo] = useState("");
  const falta = pedirNombre && !nombre.trim();

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (falta) return;
    onListo({ nombre: nombre.trim(), cultivo: cultivo.trim() || nombreSugerido });
  }

  // Una sola página sobre el mapa: vidrio que lo desenfoca, manchas de color en movimiento y la tarjeta encima.
  return (
    <div className="inicio-vidrio fixed inset-0 z-40 overflow-y-auto overscroll-contain">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <span className="mancha mancha-1" />
        <span className="mancha mancha-2" />
        <span className="mancha mancha-3" />
      </div>
      <div className="relative flex min-h-full items-center justify-center px-4 py-8">
        <form
          onSubmit={enviar}
          aria-label={pedirNombre ? "Entrar" : "Nombre del cultivo"}
          className="inicio-tarjeta flex w-full max-w-[440px] flex-col gap-4 rounded-[28px] px-6 pt-6 pb-5 sm:px-8 sm:pt-8"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-titulo text-[15px] leading-[18px] font-bold text-tinta">
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-full bg-tinta"
              >
                <span
                  className="block bg-[#fffdf6]"
                  style={{
                    width: 14.17,
                    height: 15,
                    mask: "url(/iconos/menu-semillas.svg) center / contain no-repeat",
                    WebkitMask: "url(/iconos/menu-semillas.svg) center / contain no-repeat",
                  }}
                />
              </span>
              Semilla Siguiente
            </span>
            {pedirCultivo && <span className={PASO}>Paso 1 de {TOTAL_PASOS}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-titulo text-[30px] leading-[34px] font-bold text-tinta sm:text-[34px] sm:leading-[38px]">
              {pedirNombre ? "Hola, empecemos por tu chacra" : "Tu nuevo cultivo"}
            </h1>
            {pedirNombre && (
              <p className="text-[15px] leading-[22px] text-secundario">
                No necesitas cuenta ni contraseña: tu nombre y tus datos se quedan en este celular.
              </p>
            )}
          </div>

          {pedirNombre && (
            <label htmlFor={`${id}-nombre`} className="flex flex-col gap-1.5">
              <span className="text-[16px] leading-[22px] font-semibold text-tinta">¿Cómo te llamas?</span>
              <input
                id={`${id}-nombre`}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="given-name"
                autoFocus
                maxLength={40}
                placeholder="Tu nombre"
                className={`${CAMPO} bg-white/80`}
              />
            </label>
          )}

          {pedirCultivo && (
            <label htmlFor={`${id}-cultivo`} className="flex flex-col gap-1.5">
              <span className="text-[16px] leading-[22px] font-semibold text-tinta">¿Cómo se llama tu cultivo?</span>
              <input
                id={`${id}-cultivo`}
                value={cultivo}
                onChange={(e) => setCultivo(e.target.value)}
                autoComplete="off"
                autoFocus={!pedirNombre}
                maxLength={40}
                placeholder="Por ejemplo: Chacra de abajo"
                className={`${CAMPO} bg-white/80`}
              />
              <span className="text-[13px] leading-[18px] text-secundario">
                Si lo dejas vacío, se llamará “{nombreSugerido}”.
              </span>
            </label>
          )}

          <button type="submit" disabled={falta} className={`${BOTON_PRINCIPAL} mt-1`}>
            {pedirCultivo ? "Seguir: marcar mi terreno" : "Entrar"}
          </button>
          {onCancelar && (
            <button type="button" onClick={onCancelar} className="text-[14px] leading-[20px] text-secundario">
              Cancelar, no agregar un cultivo
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

/**
 * Asistente para crear un cultivo (también con los botones "+"):
 * 1. la primera vez, el inicio: nombre de la persona y del cultivo (después, solo el del cultivo);
 * 2. se marcan las esquinas del terreno (o se usa la ubicación del celular): ahí se guarda el cultivo;
 * 3. en ventanas de pantalla completa se pregunta qué sembró antes y qué semillas tiene (se pueden saltar);
 * 4. al terminar se abre el cultivo con sus recomendaciones.
 */
export function CrearChacra() {
  const {
    apiRef,
    dibujando,
    paso,
    setPaso,
    cultivoNuevo,
    setCultivoNuevo,
    nombreNuevo,
    iniciarAsistente,
    empezarTerreno,
    cancelarAsistente,
  } = useMapa();
  const cultivos = useCultivos();
  const hayCultivos = (cultivos?.length ?? 0) > 0;
  const [usuario, setUsuario] = useNombreUsuario();
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
      nombreNuevo,
    );
  }

  function cancelar() {
    intentoGps.current++;
    setError(null);
    setBuscandoGps(false);
    cancelarAsistente();
  }

  // Mientras no se sabe si ya entró (primer dibujo) o si tiene cultivos, no se muestra nada.
  if (usuario === undefined || cultivos === undefined) return null;
  const sugerido = nombreCultivo(cultivos.length);

  // Inicio: sin nombre. Si ya tiene cultivos (cambió de nombre), solo se pide el nombre.
  if (usuario === null && (paso === null || paso === "datos")) {
    return (
      <FormularioInicio
        pedirNombre
        pedirCultivo={!hayCultivos}
        nombreSugerido={sugerido}
        onListo={({ nombre, cultivo }) => {
          setUsuario(nombre);
          if (!hayCultivos) empezarTerreno(cultivo);
          else setPaso(null);
        }}
      />
    );
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

  // Cultivo nuevo (con "+" o "Crear mi cultivo"): solo su nombre.
  if (paso === "datos") {
    return (
      <FormularioInicio
        pedirNombre={false}
        pedirCultivo
        nombreSugerido={sugerido}
        onListo={({ cultivo }) => empezarTerreno(cultivo)}
        onCancelar={cancelar}
      />
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
    const etiqueta = `¡Tu cultivo ya está marcado! · Paso ${pregunta + 3} de ${TOTAL_PASOS}`;
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
      <p className={PASO}>
        Paso 2 de {TOTAL_PASOS}
        {nombreNuevo && ` · ${nombreNuevo}`}
      </p>
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
      {/* Volver al paso anterior (el nombre del cultivo) o, si ya tiene cultivos, cancelar. */}
      <button
        type="button"
        onClick={() => {
          intentoGps.current++;
          setError(null);
          setBuscandoGps(false);
          apiRef.current?.cancelar();
          setPaso("datos");
        }}
        className="text-[14px] leading-[20px] text-secundario"
      >
        Volver
      </button>
    </section>
  );
}
