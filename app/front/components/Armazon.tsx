"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { ProveedorAvisos } from "@/app/front/components/Avisos";
import { Navegacion } from "@/app/front/components/Navegacion";
import { AlertasMovil, ClimaFijo } from "@/app/front/components/tarjetas/ClimaFijo";
import { SinSenal } from "@/app/front/components/SinSenal";
import { SoloCliente } from "@/app/front/components/SoloCliente";
import { ProveedorMapa, useMapa } from "@/app/front/components/mapa/ContextoMapa";
import { CrearChacra } from "@/app/front/components/mapa/CrearChacra";
import type { MapaChacraProps } from "@/app/front/components/mapa/MapaChacra";
import { crearCultivo } from "@/app/front/lib/almacen";
import { useUbicacion } from "@/app/front/lib/hooks";
import { useCultivoActivo, useNombreUsuario } from "@/app/front/lib/preferencias";
import { HAY_TOKEN_MAPBOX } from "@/app/front/lib/mapbox";
import { ERRORES } from "@/app/front/lib/textos";

const MapaChacra = dynamic<MapaChacraProps>(() => import("@/app/front/components/mapa/MapaChacra"), {
  ssr: false,
  loading: () => <div className="esqueleto size-full" />,
});

/** El mapa ocupa todo el fondo y se mantiene montado al cambiar de pestaña. */
function MapaFondo({ inicio, panelAncho }: { inicio: boolean; panelAncho: boolean }) {
  const { punto, cultivo, cultivos, cargada } = useUbicacion();
  const { apiRef, setDibujando, paso, setPaso, setCultivoNuevo, nombreNuevo } = useMapa();
  const [, setActivo] = useCultivoActivo();

  // Sin cultivos el mapa muestra el lugar de la demostración: si cambia el escenario, vuela allá.
  const sinCultivos = cargada && cultivos.length === 0;
  useEffect(() => {
    if (sinCultivos) apiRef.current?.irA(punto.lat, punto.lon, 12);
  }, [sinCultivos, punto.lat, punto.lon, apiRef]);

  // Al abrir otro cultivo (desde Perfil o al crearlo) el mapa lo encuadra.
  const anterior = useRef(cultivo?.id);
  useEffect(() => {
    if (cultivo && cultivo.id !== anterior.current) apiRef.current?.encuadrar(cultivo);
    anterior.current = cultivo?.id;
  }, [cultivo, apiRef]);

  if (!HAY_TOKEN_MAPBOX) {
    return (
      <div className="flex size-full items-center justify-center bg-arena p-6 text-center lg:pl-[calc(344px+var(--panel-extra))]">
        <div className="flex max-w-sm flex-col gap-1">
          <p className="text-[14px] leading-[20px] text-tinta">{ERRORES.mapa}</p>
          {/* Pista solo para quien programa; el agricultor no necesita saber de configuraciones. */}
          {process.env.NODE_ENV !== "production" && (
            <p className="font-mono text-[11px] leading-[14px] text-secundario">Falta NEXT_PUBLIC_MAPBOX_TOKEN en .env.local</p>
          )}
        </div>
      </div>
    );
  }
  // Se monta solo cuando ya se leyeron los cultivos, para centrar el mapa en el abierto.
  if (!cargada) return <div className="esqueleto size-full" />;
  return (
    <MapaChacra
      cultivos={cultivos}
      abierto={cultivo}
      puntoInicial={punto}
      onListo={(a) => (apiRef.current = a)}
      onDibujando={setDibujando}
      // Terminado el terreno se guarda como cultivo nuevo y el asistente pregunta por sus cultivos.
      onTerrenoNuevo={(terreno) => {
        if (paso !== "terreno") return;
        void crearCultivo(terreno, nombreNuevo).then((id) => {
          setCultivoNuevo(id);
          setActivo(id);
          setPaso("cultivos");
        });
      }}
      mostrarVista={!inicio}
      panelAncho={panelAncho}
    />
  );
}

/**
 * Estructura de todas las pantallas (diseño "Territorio" de Figma):
 * - mapa de fondo;
 * - panel de papel de 324 px con el contenido de la pestaña (a la izquierda en escritorio, como hoja en el celular);
 *   en Semillas crece para mostrar 2 semillas por fila;
 * - menú pegado encima del panel, como pestañas (Figma 65:54), y selector Mapa / Satélite abajo, junto al panel.
 */
export function Armazon({ children }: { children: ReactNode }) {
  return (
    <ProveedorMapa>
      <ProveedorAvisos>
        <Pantallas>{children}</Pantallas>
      </ProveedorAvisos>
    </ProveedorMapa>
  );
}

function Pantallas({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const { cultivos, cargada } = useUbicacion();
  const { paso } = useMapa();
  // Asistente: creando un cultivo (con un "+", desde cualquier pestaña) o en la pestaña Mapa sin cultivos.
  // Al comienzo solo se ven el mapa, el menú y "Crear mi cultivo".
  // Sin nombre todavía (primera vez, o después de "Cambiar nombre"): se muestra el inicio en cualquier pestaña.
  const [usuario] = useNombreUsuario();
  const sinUsuario = usuario === null;
  const inicio = paso !== null || sinUsuario || (ruta === "/" && cargada && cultivos.length === 0);
  // En Semillas el panel se ensancha para una grilla de 2 semillas (ver .panel-lateral en globals.css).
  const panelAncho = !inicio && ruta.startsWith("/semillas");
  useLayoutEffect(() => {
    document.documentElement.dataset.panel = panelAncho ? "ancho" : "normal";
  }, [panelAncho]);

  return (
    <>
      <div className={`fixed inset-x-0 top-0 lg:inset-0 lg:h-auto ${inicio ? "bottom-0" : "h-[45dvh]"}`}>
        <MapaFondo inicio={inicio} panelAncho={panelAncho} />
      </div>

      {inicio ? (
        HAY_TOKEN_MAPBOX && <CrearChacra />
      ) : (
        <main className="relative z-10 mt-[42dvh] flex min-h-[58dvh] flex-col rounded-t-[20px] bg-papel px-5 pt-6 pb-24 shadow-[0_-4px_16px_rgba(38,59,53,0.12)] panel-lateral lg:fixed lg:top-[86px] lg:bottom-[18px] lg:left-[20px] lg:mt-0 lg:min-h-0 lg:overflow-y-auto lg:rounded-[10px] lg:[scrollbar-width:none] lg:px-[15px] lg:py-5 lg:shadow-none">
          <div className="panel-contenido flex flex-1 flex-col">
            <SoloCliente>
              {/* En el celular el peligro se ve primero, en cualquier pestaña (salvo en Clima, que ya lo muestra). */}
              <SinSenal />
              {ruta !== "/clima" && <AlertasMovil />}
              {children}
            </SoloCliente>
          </div>
        </main>
      )}

      {/*
        Clima de la semana y alertas: siempre a la vista, en cualquier pestaña (en escritorio, arriba a la derecha;
        en el celular están en la pestaña del clima). Termina antes de la leyenda y los controles.
      */}
      {!inicio && <ClimaFijo className="fixed top-[18px] right-[34px] z-20 hidden max-h-[calc(100dvh-273px)] lg:flex" />}

      {!sinUsuario && <Navegacion />}
    </>
  );
}
