"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Navegacion } from "@/app/front/components/Navegacion";
import { ClimaFijo } from "@/app/front/components/tarjetas/ClimaFijo";
import { SoloCliente } from "@/app/front/components/SoloCliente";
import { ProveedorMapa, useMapa } from "@/app/front/components/mapa/ContextoMapa";
import { CrearChacra } from "@/app/front/components/mapa/CrearChacra";
import type { MapaChacraProps } from "@/app/front/components/mapa/MapaChacra";
import { crearCultivo } from "@/app/front/lib/almacen";
import { useUbicacion } from "@/app/front/lib/hooks";
import { useCultivoActivo } from "@/app/front/lib/preferencias";
import { HAY_TOKEN_MAPBOX } from "@/app/front/lib/mapbox";

const MapaChacra = dynamic<MapaChacraProps>(() => import("@/app/front/components/mapa/MapaChacra"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-arena" />,
});

/** El mapa ocupa todo el fondo y se mantiene montado al cambiar de pestaña. */
function MapaFondo({ inicio }: { inicio: boolean }) {
  const { punto, cultivo, cultivos, cargada } = useUbicacion();
  const { apiRef, setDibujando, paso, setPaso, setCultivoNuevo } = useMapa();
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
      <div className="flex size-full items-center justify-center bg-arena p-6 text-center lg:pl-[344px]">
        <p className="max-w-sm text-[14px] leading-[20px] text-secundario">
          🗺️ El mapa no está configurado: falta <code className="rounded bg-papel px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> en{" "}
          <code className="rounded bg-papel px-1">.env.local</code>.
        </p>
      </div>
    );
  }
  // Se monta solo cuando ya se leyeron los cultivos, para centrar el mapa en el abierto.
  if (!cargada) return <div className="size-full animate-pulse bg-arena" />;
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
        void crearCultivo(terreno).then((id) => {
          setCultivoNuevo(id);
          setActivo(id);
          setPaso("cultivos");
        });
      }}
      mostrarVista={!inicio}
    />
  );
}

/**
 * Estructura de todas las pantallas (diseño "Territorio" de Figma):
 * - mapa de fondo;
 * - panel de papel de 324 px con el contenido de la pestaña (a la izquierda en escritorio, como hoja en el celular);
 * - menú pegado encima del panel, como pestañas (Figma 65:54), y selector Mapa / Satélite abajo, junto al panel.
 */
export function Armazon({ children }: { children: ReactNode }) {
  return (
    <ProveedorMapa>
      <Pantallas>{children}</Pantallas>
    </ProveedorMapa>
  );
}

function Pantallas({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const { cultivos, cargada } = useUbicacion();
  const { paso } = useMapa();
  // Asistente: creando un cultivo (con un "+", desde cualquier pestaña) o en la pestaña Mapa sin cultivos.
  // Al comienzo solo se ven el mapa, el menú y "Crear mi cultivo".
  const inicio = paso !== null || (ruta === "/" && cargada && cultivos.length === 0);

  return (
    <>
      <div className={`fixed inset-x-0 top-0 lg:inset-0 lg:h-auto ${inicio ? "bottom-0" : "h-[45dvh]"}`}>
        <MapaFondo inicio={inicio} />
      </div>

      {inicio ? (
        HAY_TOKEN_MAPBOX && <CrearChacra />
      ) : (
        <main className="relative z-10 mt-[42dvh] flex min-h-[58dvh] flex-col rounded-t-[20px] bg-papel px-5 pt-6 pb-24 shadow-[0_-4px_16px_rgba(38,59,53,0.12)] lg:fixed lg:top-[66px] lg:bottom-[18px] lg:left-[20px] lg:mt-0 lg:min-h-0 lg:w-[324px] lg:overflow-y-auto lg:rounded-[10px] lg:[scrollbar-width:none] lg:px-[15px] lg:py-5 lg:shadow-none">
          <SoloCliente>{children}</SoloCliente>
        </main>
      )}

      {/*
        Clima de la semana y alertas: siempre a la vista, en cualquier pestaña (en escritorio, arriba a la derecha;
        en el celular están en la pestaña del clima). Termina antes de la leyenda y los controles.
      */}
      {!inicio && <ClimaFijo className="fixed top-[18px] right-[34px] z-20 hidden max-h-[calc(100dvh-273px)] lg:flex" />}

      <Navegacion />
    </>
  );
}
