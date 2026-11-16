"use client";

import { useEffect, useRef, useState } from "react";
import Map, {
  GeolocateControl,
  Layer,
  Marker,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
  useControl,
  type MapRef,
} from "react-map-gl/mapbox";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import area from "@turf/area";
import centroid from "@turf/centroid";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { Cultivo, TerrenoNuevo } from "@/app/frontcode/lib/almacen";
import { ESTILO_MAPBOX, TOKEN_MAPBOX as TOKEN } from "@/app/frontcode/lib/mapbox";
import { ICONOS_CHACRA } from "@/app/frontcode/lib/textos";
import type { ApiMapa } from "./ContextoMapa";
import { LeyendaMapa } from "./LeyendaMapa";
import { VentanaChacra } from "./VentanaChacra";
import { aplicarVista, type Vista } from "./vistaSatelite";

export interface MapaChacraProps {
  /** Todos los cultivos: se dibujan sus terrenos y un círculo con su ícono. */
  cultivos: Cultivo[];
  /** Cultivo abierto: el mapa empieza encuadrándolo. */
  abierto?: Cultivo;
  /** Punto inicial cuando todavía no hay cultivos (escenario de demo). */
  puntoInicial: { lat: number; lon: number };
  /** Se llama con funciones para manejar el mapa desde botones externos. */
  onListo?: (api: ApiMapa) => void;
  /** Se terminó de marcar un terreno nuevo (el mapa no lo guarda: lo hace el asistente). */
  onTerrenoNuevo?: (terreno: TerrenoNuevo) => void;
  /** Avisa si el mapa está en modo dibujo (para mostrar el botón "Listo"). */
  onDibujando?: (dibujando: boolean) => void;
  /** Muestra el selector Mapa / Satélite y los círculos de los cultivos (se ocultan al crear uno). */
  mostrarVista?: boolean;
}

/** Dónde se abre el cuadro de datos: al costado del polígono, o sobre el círculo si no cabe. */
interface PosicionVentana {
  cultivoId: number;
  lon: number;
  lat: number;
  anchor?: "left" | "right";
  offset: number;
}

const ANCHO_VENTANA = 264;

/** Caja [[oeste, sur], [este, norte]] que contiene el polígono. */
function limites(p: Polygon): [[number, number], [number, number]] {
  const xs = p.coordinates[0].map((c) => c[0]);
  const ys = p.coordinates[0].map((c) => c[1]);
  return [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
}

/**
 * En escritorio (Figma 38:622) el panel de 324 px va a 20 px del borde izquierdo, el menú arriba
 * y los controles de Mapbox a 34 px del borde derecho.
 */
const OCUPADO_IZQUIERDA = 20 + 324;
const OCUPADO_DERECHA = 34 + 300; // columna del clima (semana y alertas)

/** Márgenes para que el terreno quede en la parte visible (sin el panel ni los controles encima). */
function relleno() {
  const ancho = typeof window === "undefined" ? 0 : window.innerWidth;
  if (ancho < 1024) return { top: 30, bottom: 40, left: 30, right: 30 };
  return { top: 40, bottom: 60, left: OCUPADO_IZQUIERDA + 30, right: OCUPADO_DERECHA + 30 };
}

/** Textos de los controles de Mapbox en español. */
const TEXTOS_MAPA = {
  "NavigationControl.ZoomIn": "Acercar",
  "NavigationControl.ZoomOut": "Alejar",
  "NavigationControl.ResetBearing": "Brújula: volver a mirar al norte",
  "GeolocateControl.FindMyLocation": "Ver dónde estoy",
  "GeolocateControl.LocationNotAvailable": "No se puede saber dónde estás",
  "ScaleControl.Meters": "m",
  "ScaleControl.Kilometers": "km",
};

const TINTA = "#000000";
const PRADERA = "#b7bd7b";
const TERRACOTA = "#cb684d";
const ACTIVO = ["==", ["get", "active"], "true"];

/** Estilo del terreno (Figma): relleno pradera al 30 % y borde negro; terracota mientras se dibuja. */
const ESTILOS_DIBUJO = [
  {
    id: "gl-draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"]],
    paint: { "fill-color": PRADERA, "fill-opacity": 0.3 },
  },
  {
    id: "gl-draw-lines",
    type: "line",
    filter: ["any", ["==", "$type", "LineString"], ["==", "$type", "Polygon"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["case", ACTIVO, TERRACOTA, TINTA],
      "line-dasharray": ["case", ACTIVO, ["literal", [0.2, 2]], ["literal", [2, 0]]],
      "line-width": 3,
    },
  },
  {
    id: "gl-draw-point-outer",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: { "circle-radius": ["case", ACTIVO, 7, 5], "circle-color": "#fff" },
  },
  {
    id: "gl-draw-point-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: { "circle-radius": ["case", ACTIVO, 5, 3], "circle-color": TERRACOTA },
  },
  {
    id: "gl-draw-vertex-outer",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"], ["!=", "mode", "simple_select"]],
    paint: { "circle-radius": ["case", ACTIVO, 8, 6], "circle-color": "#fff" },
  },
  {
    id: "gl-draw-vertex-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"], ["!=", "mode", "simple_select"]],
    paint: { "circle-radius": ["case", ACTIVO, 6, 4], "circle-color": TERRACOTA },
  },
  {
    id: "gl-draw-midpoint",
    type: "circle",
    filter: ["all", ["==", "meta", "midpoint"]],
    paint: { "circle-radius": 4, "circle-color": TERRACOTA },
  },
];

interface DrawProps {
  onCrear: (f: Feature<Polygon>) => void;
  onModo: (modo: string) => void;
  onDraw: (d: MapboxDraw) => void;
}

function DrawControl(props: DrawProps) {
  // Los manejadores de eventos leen siempre las props más recientes.
  const ultimas = useRef(props);
  useEffect(() => {
    ultimas.current = props;
  });
  const [manejadores] = useState(() => ({
    crear: (e: { features: Feature[] }) => {
      const f = e.features[0] as Feature<Polygon> | undefined;
      if (f) ultimas.current.onCrear(f);
    },
    modo: (e: { mode: string }) => ultimas.current.onModo(e.mode),
  }));

  const draw = useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        // Sin botones propios: se dibuja con los botones del asistente. Draw solo tiene el terreno
        // que se está marcando; los guardados se dibujan como capa aparte.
        displayControlsDefault: false,
        defaultMode: "simple_select",
        styles: ESTILOS_DIBUJO,
      }),
    ({ map }) => {
      map.on("draw.create", manejadores.crear);
      map.on("draw.modechange", manejadores.modo);
    },
    ({ map }) => {
      map.off("draw.create", manejadores.crear);
      map.off("draw.modechange", manejadores.modo);
    },
    { position: "top-left" },
  );

  // Avisar una sola vez por instancia de Draw.
  useEffect(() => ultimas.current.onDraw(draw), [draw]);
  return null;
}

/** Terrenos guardados con el mismo estilo del dibujo (Figma): relleno pradera al 30 % y borde negro. */
function capaTerrenos(cultivos: Cultivo[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: cultivos
      .filter((c) => c.poligono)
      .map((c) => ({ type: "Feature", properties: { id: c.id }, geometry: c.poligono! })),
  };
}

export default function MapaChacra({
  cultivos,
  abierto,
  puntoInicial,
  onListo,
  onTerrenoNuevo,
  onDibujando,
  mostrarVista = true,
}: MapaChacraProps) {
  const mapaRef = useRef<MapRef>(null);
  const inicio = abierto ?? puntoInicial;
  const [vista, setVista] = useState<Vista>("mapa");
  const [cargado, setCargado] = useState(false);
  const [ventana, setVentana] = useState<PosicionVentana | null>(null);
  // En el celular el mapa es bajo: el cuadro va arriba del mapa en vez de flotar junto al polígono.
  const [compacto, setCompacto] = useState(false);

  useEffect(() => {
    const mapa = mapaRef.current?.getMap();
    // Tras recargar en caliente el mapa viejo queda sin estilo: no hay capas que cambiar.
    if (!cargado || !mapa?.style) return;
    aplicarVista(mapa, vista);
  }, [vista, cargado]);

  function abrirVentana(cultivoId: number) {
    const mapa = mapaRef.current;
    const c = cultivos.find((x) => x.id === cultivoId);
    if (!mapa || !c) return;
    const ancho = mapa.getContainer().clientWidth;
    const escritorio = window.innerWidth >= 1024;
    setCompacto(ancho < 640);
    // Espacio libre del mapa: en escritorio el panel está a la izquierda y los controles a la derecha.
    const limiteDerecho = escritorio ? ancho - OCUPADO_DERECHA - 16 : ancho - 16;
    const limiteIzquierdo = escritorio ? OCUPADO_IZQUIERDA + 16 : 16;
    if (c.poligono) {
      const [[oeste], [este]] = limites(c.poligono);
      const xEste = mapa.project([este, c.lat]).x;
      const xOeste = mapa.project([oeste, c.lat]).x;
      // Primero a la derecha del mapa: en escritorio, pegado al borde derecho del espacio libre (junto al clima),
      // a la altura del terreno; en el celular, al lado del terreno. Si no cabe, a la izquierda del terreno.
      if (xEste >= 0 && xEste + 16 + ANCHO_VENTANA <= limiteDerecho) {
        if (escritorio) {
          const y = mapa.project([c.lon, c.lat]).y;
          const punto = mapa.unproject([limiteDerecho - ANCHO_VENTANA, y]);
          setVentana({ cultivoId, lon: punto.lng, lat: punto.lat, anchor: "left", offset: 0 });
        } else {
          setVentana({ cultivoId, lon: este, lat: c.lat, anchor: "left", offset: 16 });
        }
        return;
      }
      if (xOeste <= limiteDerecho && xOeste - 16 - ANCHO_VENTANA >= limiteIzquierdo) {
        setVentana({ cultivoId, lon: oeste, lat: c.lat, anchor: "right", offset: 16 });
        return;
      }
    }
    setVentana({ cultivoId, lon: c.lon, lat: c.lat, offset: 28 });
  }

  function encuadrar(c: Cultivo) {
    const mapa = mapaRef.current;
    if (!mapa) return;
    if (c.poligono) mapa.fitBounds(limites(c.poligono), { padding: relleno(), maxZoom: 17 });
    else mapa.flyTo({ center: [c.lon, c.lat], zoom: 15, padding: relleno() });
  }

  /**
   * Al tocar el círculo de un cultivo: acerca el mapa hasta ver el terreno en primer plano y, al terminar
   * de moverse, abre su cuadro de datos al lado. En escritorio el terreno y el cuadro, juntos, quedan
   * centrados en el espacio libre entre el panel, la columna del clima, el menú y los controles.
   */
  function enfocarYAbrir(c: Cultivo) {
    const ref = mapaRef.current;
    if (!ref) return;
    const mapa = ref.getMap();
    setVentana(null);
    const base = relleno();
    const escritorio = window.innerWidth >= 1024;
    const separacion = 16;
    // Espacio que se reserva a la derecha del mapa para el cuadro de datos: el terreno se centra en lo que queda.
    const reserva = escritorio ? ANCHO_VENTANA + separacion : 0;

    let abierto = false;
    const abrir = () => {
      if (abierto) return;
      abierto = true;
      abrirVentana(c.id!);
    };
    mapa.once("moveend", abrir);
    // Si el mapa ya estaba ahí y no se mueve, abrir igual (pero nunca a medio vuelo: el cuadro quedaría mal puesto).
    window.setTimeout(() => {
      if (!mapa.isMoving()) abrir();
    }, 1600);

    if (c.poligono) {
      const caja = limites(c.poligono);
      // Zoom para que el terreno quepa dejando sitio al cuadro (y un margen igual al otro lado)…
      const camara = mapa.cameraForBounds(caja, {
        padding: { ...base, left: base.left + separacion, right: base.right + reserva + separacion },
        maxZoom: 18,
      });
      // …y el terreno centrado en el espacio que queda a la izquierda del cuadro.
      const centro: [number, number] = [(caja[0][0] + caja[1][0]) / 2, (caja[0][1] + caja[1][1]) / 2];
      mapa.flyTo({
        center: centro,
        zoom: camara?.zoom ?? 17,
        padding: { ...base, right: base.right + reserva },
        duration: 1000,
      });
    } else {
      mapa.flyTo({ center: [c.lon, c.lat], zoom: 17, padding: { ...base, right: base.right + reserva }, duration: 1000 });
    }
  }

  // La API del mapa se entrega una sola vez: siempre usa los cultivos más recientes.
  const funciones = useRef({ abrirVentana, encuadrar });
  useEffect(() => {
    funciones.current = { abrirVentana, encuadrar };
  });

  const enVentana = ventana ? cultivos.find((c) => c.id === ventana.cultivoId) : undefined;
  const abierta = ventana !== null && mostrarVista && !!enVentana;

  function alDraw(d: MapboxDraw) {
    // changeMode() hecho por código no dispara "draw.modechange", así que se avisa aquí.
    onListo?.({
      dibujar: () => {
        setVentana(null);
        d.deleteAll();
        d.changeMode("draw_polygon");
        onDibujando?.(true);
      },
      // Al salir del modo dibujo, Draw cierra el polígono (si tiene 3+ esquinas) y dispara draw.create.
      terminar: () => {
        d.changeMode("simple_select");
        onDibujando?.(false);
      },
      // En modo dibujo, trash() descarta el polígono a medio marcar sin avisar "draw.delete".
      cancelar: () => {
        if (d.getMode() === "draw_polygon") d.trash();
        if (d.getMode() !== "simple_select") d.changeMode("simple_select");
        d.deleteAll();
        onDibujando?.(false);
      },
      irA: (lat, lon, zoom = 15) => mapaRef.current?.flyTo({ center: [lon, lat], zoom, padding: relleno() }),
      encuadrar: (c) => funciones.current.encuadrar(c),
      mostrarDatos: (id) => funciones.current.abrirVentana(id),
    });
  }

  function alCrear(f: Feature<Polygon>) {
    const [lon, lat] = centroid(f).geometry.coordinates;
    onTerrenoNuevo?.({ lat, lon, poligono: f.geometry, area_ha: area(f) / 10_000, origen: "poligono" });
  }

  return (
    <div className="relative size-full">
      {mostrarVista && (
        <div className="absolute top-3 left-3 z-10 flex overflow-hidden rounded-full border border-borde bg-papel text-[14px] leading-[20px] font-semibold shadow-sm lg:top-auto lg:bottom-[40px] lg:left-[377px]">
          {(
            [
              ["mapa", "🗺️ Mapa"],
              ["satelite", "🛰️ Satélite"],
            ] as const
          ).map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={vista === valor}
              onClick={() => setVista(valor)}
              className={`px-3 py-2 ${vista === valor ? "bg-tinta text-white" : "text-tinta"}`}
            >
              {texto}
            </button>
          ))}
        </div>
      )}
      <Map
        ref={mapaRef}
        onLoad={() => setCargado(true)}
        mapboxAccessToken={TOKEN}
        initialViewState={
          abierto?.poligono
            ? { bounds: limites(abierto.poligono), fitBoundsOptions: { padding: relleno(), maxZoom: 17 } }
            : { longitude: inicio.lon, latitude: inicio.lat, zoom: abierto ? 15 : 12, padding: relleno() }
        }
        mapStyle={ESTILO_MAPBOX}
        locale={TEXTOS_MAPA}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Zoom, brújula, GPS y escala. En escritorio van abajo, a la izquierda del panel (ver globals.css). */}
        <NavigationControl position="top-right" visualizePitch />
        {/* Solo centra el mapa y muestra el punto azul; guardar un cultivo es con "Usar dónde estoy". */}
        <GeolocateControl position="top-right" positionOptions={{ enableHighAccuracy: true }} showAccuracyCircle />
        <ScaleControl position="top-right" unit="metric" maxWidth={100} />
        <Source id="terrenos" type="geojson" data={capaTerrenos(cultivos)}>
          <Layer id="terrenos-relleno" type="fill" paint={{ "fill-color": PRADERA, "fill-opacity": 0.3 }} />
          <Layer
            id="terrenos-borde"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{ "line-color": TINTA, "line-width": 3 }}
          />
        </Source>
        <DrawControl onCrear={alCrear} onDraw={alDraw} onModo={(modo) => onDibujando?.(modo === "draw_polygon")} />
        {/* Un círculo con el ícono de cada cultivo en el centro de su terreno: al tocarlo se ven sus datos. */}
        {mostrarVista &&
          cultivos.map((c) => (
            <Marker
              key={c.id}
              longitude={c.lon}
              latitude={c.lat}
              anchor="center"
              onClick={(e) => {
                // Que el clic no llegue al mapa (cerraría el cuadro).
                e.originalEvent.stopPropagation();
                if (abierta && ventana?.cultivoId === c.id) setVentana(null);
                else enfocarYAbrir(c);
              }}
            >
              <button
                type="button"
                aria-label={`Ver los datos de ${c.nombre}`}
                aria-expanded={abierta && ventana?.cultivoId === c.id}
                title={c.nombre}
                className="flex size-11 cursor-pointer items-center justify-center rounded-full border-[2.4px] border-white bg-petroleo text-[22px] shadow-[0_2px_5px_rgba(38,59,53,0.35)] transition-transform hover:scale-105"
              >
                {c.icono ?? ICONOS_CHACRA[0]}
              </button>
            </Marker>
          ))}
        {abierta && !compacto && enVentana && (
          <Popup
            longitude={ventana.lon}
            latitude={ventana.lat}
            anchor={ventana.anchor}
            offset={ventana.offset}
            closeButton={false}
            maxWidth="none"
            className="ventana-chacra"
            onClose={() => setVentana(null)}
          >
            <VentanaChacra cultivo={enVentana} onCerrar={() => setVentana(null)} />
          </Popup>
        )}
      </Map>
      {/* Minileyenda a la izquierda de la columna de zoom, brújula, GPS y escala (abajo en escritorio, arriba en el celular). */}
      {mostrarVista && (
        <LeyendaMapa vista={vista} className="absolute top-3 right-[58px] z-10 lg:top-auto lg:right-[94px] lg:bottom-[58px]" />
      )}
      {abierta && compacto && enVentana && (
        <div className="absolute inset-x-3 top-14 z-20 max-h-[calc(100%-68px)] overflow-y-auto [scrollbar-width:none] [&>section]:w-full">
          <VentanaChacra cultivo={enVentana} onCerrar={() => setVentana(null)} />
        </div>
      )}
    </div>
  );
}
