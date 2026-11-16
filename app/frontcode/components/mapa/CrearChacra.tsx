"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { PreguntaCultivosAnteriores, PreguntaMisSemillas } from "@/app/frontcode/components/CultivosChacra";
import { CAMPO } from "@/app/frontcode/components/estilos";
import { BOTON_PIE_PRINCIPAL, BOTON_PIE_SECUNDARIO } from "@/app/frontcode/components/SelectorSemillas";
import { nombreCultivo } from "@/app/frontcode/lib/almacen";
import { useCultivos } from "@/app/frontcode/lib/hooks";
import { useCultivoActivo, useNombreUsuario } from "@/app/frontcode/lib/preferencias";
import { useMapa } from "./ContextoMapa";
import { usarUbicacionActual } from "./ubicacion";

const POSICION = "fixed bottom-[82px] left-1/2 z-30 -translate-x-1/2 lg:bottom-[37px]";
const TARJETA = `${POSICION} flex w-[calc(100%-32px)] max-w-[420px] flex-col gap-3 overflow-clip rounded-[20px] border border-white bg-papel px-5 pt-[18px] pb-4 shadow-[0_6px_20px_rgba(38,59,53,0.25)]`;
const BOTON_PRINCIPAL =
  "rounded-[14px] bg-tinta px-4 py-3.5 text-[16px] leading-[24px] font-semibold text-white active:bg-tinta/90";
const BOTON_TEXTO = "text-[14px] leading-[20px] font-semibold text-tinta underline underline-offset-2";

function FormularioInicio({ pedirNombre, pedirCultivo, nombreSugerido, onListo, onCancelar }: {
  pedirNombre: boolean;
  pedirCultivo: boolean;
  nombreSugerido: string;
  onListo: (datos: { nombre: string; cultivo: string }) => void;
  onCancelar?: () => void;
}) {
  const id = useId();
  const [nombre, setNombre] = useState("");
  const [cultivo, setCultivo] = useState("");

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (pedirNombre && !nombre.trim()) return;
    onListo({ nombre: nombre.trim(), cultivo: cultivo.trim() || nombreSugerido });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-tinta/50 p-4 backdrop-blur-sm">
      <form onSubmit={enviar} aria-label="Datos iniciales" className="flex w-full max-w-[440px] flex-col gap-4 rounded-[20px] bg-papel p-6 shadow-xl">
        <h1 className="font-titulo text-[28px] leading-[32px] font-bold text-tinta">
          {pedirNombre ? "Hola, empecemos por tu chacra" : "Tu nuevo cultivo"}
        </h1>
        {pedirNombre && (
          <>
            <p className="text-[14px] leading-[20px] text-secundario">Tu nombre y los datos de tu chacra se guardan en este dispositivo.</p>
            <label htmlFor={`${id}-nombre`} className="flex flex-col gap-2 font-semibold text-tinta">
              ¿Cómo te llamas?
              <input id={`${id}-nombre`} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" maxLength={40} required className={CAMPO} />
            </label>
          </>
        )}
        {pedirCultivo && <label htmlFor={`${id}-cultivo`} className="flex flex-col gap-2 font-semibold text-tinta">
          {pedirNombre ? "¿Cómo se llama tu primera chacra?" : "¿Cómo se llama tu nuevo cultivo?"}
          <input id={`${id}-cultivo`} value={cultivo} onChange={(e) => setCultivo(e.target.value)} autoComplete="off" maxLength={40} placeholder={nombreSugerido} className={CAMPO} />
          <span className="text-[12px] font-normal text-secundario">Si lo dejas vacío, se llamará “{nombreSugerido}”.</span>
        </label>}
        <button type="submit" className={BOTON_PRINCIPAL}>{pedirCultivo ? "Seguir: marcar mi terreno" : "Entrar"}</button>
        {onCancelar && <button type="button" onClick={onCancelar} className="text-[14px] text-secundario">Cancelar</button>}
      </form>
    </div>
  );
}

/**
 * Asistente para crear un cultivo (también con los botones "+"):
 * 1. pide el nombre de la persona y la primera chacra;
 * 2. marca el terreno en el mapa o con GPS;
 * 3. pregunta por cultivos anteriores y semillas disponibles;
 * 4. abre las recomendaciones.
 */
export function CrearChacra() {
  const { apiRef, dibujando, paso, setPaso, cultivoNuevo, setCultivoNuevo, nombreNuevo, iniciarAsistente, empezarTerreno, cancelarAsistente } =
    useMapa();
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

  if (usuario === undefined || cultivos === undefined) return null;
  const sugerido = nombreCultivo(cultivos.length);

  if (usuario === null && (paso === null || paso === "datos")) {
    return <FormularioInicio pedirNombre pedirCultivo={!hayCultivos} nombreSugerido={sugerido} onListo={({ nombre, cultivo }) => {
      setUsuario(nombre);
      if (hayCultivos) setPaso(null);
      else empezarTerreno(cultivo);
    }} />;
  }

  if (paso === "datos") {
    return <FormularioInicio pedirNombre={false} pedirCultivo nombreSugerido={sugerido} onListo={({ cultivo }) => {
      empezarTerreno(cultivo);
    }} onCancelar={hayCultivos ? cancelar : undefined} />;
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
      {nombreNuevo && <p className="text-[13px] font-semibold text-secundario">{nombreNuevo}</p>}
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
