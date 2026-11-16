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
import { protegerQuitar } from "./quitarDibujo";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { actualizarTerreno, type Cultivo, type TerrenoNuevo } from "@/app/front/lib/almacen";
import { useAviso } from "@/app/front/components/Avisos";
import { BOTON_ARENA, BOTON_OSCURO } from "@/app/front/components/estilos";
import { ESTILO_MAPBOX, TOKEN_MAPBOX as TOKEN } from "@/app/front/lib/mapbox";
import { ICONOS_CHACRA } from "@/app/front/lib/textos";
import type { ApiMapa } from "./ContextoMapa";
import { LeyendaMapa } from "./LeyendaMapa";
import { VentanaChacra } from "./VentanaChacra";
import { aplicarVista, type Vista } from "./vistaSatelite";
import { datosTerreno } from "./terreno";

/** id del terreno que se está editando dentro de Draw. */
const ID_EDICION = "terreno-en-edicion";

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
  /** El panel izquierdo está ensanchado (Semillas): el mapa corre su centro para no quedar tapado. */
  panelAncho?: boolean;
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
 * y los controles de Mapbox a 34 px del borde derecho. En Semillas el panel crece `--panel-extra`.
 */
const OCUPADO_DERECHA = 34 + 300; // columna del clima (semana y alertas)

/** Cuánto creció el panel ahora mismo (0 o 306 px), leído de la variable CSS que lo controla. */
function extraPanel(): number {
  if (typeof window === "undefined") return 0;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--panel-extra")) || 0;
}

function ocupadoIzquierda() {
  return 20 + 324 + extraPanel();
}

/** Márgenes para que el terreno quede en la parte visible (sin el panel ni los controles encima). */
function relleno() {
  const ancho = typeof window === "undefined" ? 0 : window.innerWidth;
  if (ancho < 1024) return { top: 30, bottom: 40, left: 30, right: 30 };
  return { top: 40, bottom: 60, left: ocupadoIzquierda() + 30, right: OCUPADO_DERECHA + 30 };
}

/** Curva "move" (0.25, 1, 0.5, 1) aproximada para Mapbox, que pide una función. */
const curvaMover = (t: number) => 1 - Math.pow(1 - t, 4);

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
      // protegerQuitar: al desmontar el mapa, Draw no debe preguntar por capas de un estilo ya borrado.
      protegerQuitar(
        new MapboxDraw({
          // Sin botones propios: se dibuja con los botones del asistente. Draw solo tiene el terreno
          // que se está marcando; los guardados se dibujan como capa aparte.
          displayControlsDefault: false,
          defaultMode: "simple_select",
          styles: ESTILOS_DIBUJO,
        }),
      ),
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
  panelAncho = false,
}: MapaChacraProps) {
  const mapaRef = useRef<MapRef>(null);

  // Cuando el panel crece o vuelve, el centro del mapa se corre lo mismo y a la vez (misma duración y curva),
  // así lo que se miraba no queda tapado. Solo cambia el margen izquierdo: no hay zoom ni salto.
  const extraAplicado = useRef(0);
  useEffect(() => {
    const mapa = mapaRef.current?.getMap();
    const extra = extraPanel();
    const cambio = extra - extraAplicado.current;
    extraAplicado.current = extra;
    if (!mapa || cambio === 0) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const margen = mapa.getPadding();
    mapa.easeTo({
      padding: { ...margen, left: Math.max(0, (margen.left ?? 0) + cambio) },
      duration: reducido ? 0 : cambio > 0 ? 300 : 220,
      easing: curvaMover,
    });
  }, [panelAncho]);
  const inicio = abierto ?? puntoInicial;
  const [vista, setVista] = useState<Vista>("mapa");
  const [cargado, setCargado] = useState(false);
  const [ventana, setVentana] = useState<PosicionVentana | null>(null);
  // En el celular el mapa es bajo: el cuadro va arriba del mapa en vez de flotar junto al polígono.
  const [compacto, setCompacto] = useState(false);
  // Terreno que se está editando (sus puntos se mueven con Draw); mientras tanto no se dibuja su copia guardada.
  const [editando, setEditando] = useState<number | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const avisar = useAviso();

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
    const limiteIzquierdo = escritorio ? ocupadoIzquierda() + 16 : 16;
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
    const mapa = mapaRef.current?.getMap();
    if (!mapa) return;
    if (c.poligono) {
      const caja = limites(c.poligono);
      const vista = { pitch: mapa.getPitch(), bearing: mapa.getBearing(), maxZoom: 17 };
      if (mapa.cameraForBounds(caja, { ...vista, padding: relleno() })) mapa.fitBounds(caja, { ...vista, padding: relleno() });
      else mapa.flyTo({ center: [c.lon, c.lat], zoom: 15, padding: relleno() });
    } else mapa.flyTo({ center: [c.lon, c.lat], zoom: 15, padding: relleno() });
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
      // El mapa está inclinado (3D): Mapbox calcula el encuadre en plano si no se le dan la inclinación
      // y el giro de ahora, y entonces el terreno queda grande o corrido. Con ellos cabe entero.
      const vista = { pitch: mapa.getPitch(), bearing: mapa.getBearing(), maxZoom: 18, duration: 1000 };
      // Primero dejando sitio al cuadro de datos a la derecha; si no cabe (pantalla angosta), sin reservarlo.
      const conCuadro = { ...base, left: base.left + separacion, right: base.right + reserva + separacion };
      const opciones = [conCuadro, base, { top: 20, bottom: 20, left: 20, right: 20 }];
      const padding = opciones.find((p) => mapa.cameraForBounds(caja, { ...vista, padding: p }));
      if (padding) mapa.fitBounds(caja, { ...vista, padding });
      else mapa.flyTo({ center: [c.lon, c.lat], zoom: 15, duration: 1000 });
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
    drawRef.current = d;
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
    const datos = datosTerreno(f);
    if (datos) onTerrenoNuevo?.({ ...datos, origen: "poligono" });
    // El terreno guardado se dibuja en su propia capa: la copia en Draw se quita para que no quede una
    // forma suelta que, al moverle los puntos, parezca otro terreno (los cambios no se guardaban).
    const id = f.id;
    window.setTimeout(() => {
      if (id !== undefined && drawRef.current?.get(String(id))) drawRef.current.delete(String(id));
    }, 0);
  }

  /* ---------- Editar la forma de un terreno guardado ---------- */

  function editarTerreno(c: Cultivo) {
    const d = drawRef.current;
    if (!d || !c.poligono || c.id === undefined) return;
    setVentana(null);
    d.deleteAll();
    d.add({ type: "Feature", id: ID_EDICION, properties: {}, geometry: c.poligono });
    d.changeMode("direct_select", { featureId: ID_EDICION });
    setEditando(c.id);
  }

  function salirDeEdicion() {
    const d = drawRef.current;
    if (d) {
      if (d.getMode() !== "simple_select") d.changeMode("simple_select");
      d.deleteAll();
    }
    setEditando(null);
  }

  async function guardarTerreno() {
    const c = cultivos.find((x) => x.id === editando);
    const datos = datosTerreno(drawRef.current?.get(ID_EDICION));
    salirDeEdicion();
    if (!c || c.id === undefined) return;
    if (!datos) {
      avisar({ texto: "El terreno necesita al menos 3 puntos: no se cambió.", icono: "equis" });
      return;
    }
    const anterior = { lat: c.lat, lon: c.lon, poligono: c.poligono, area_ha: c.area_ha };
    await actualizarTerreno(c.id, datos);
    avisar({ texto: "Terreno actualizado", deshacer: () => void actualizarTerreno(c.id!, anterior) });
  }

  /** Tocar el relleno de un terreno hace lo mismo que tocar su círculo (salvo mientras se dibuja o se edita). */
  function alTocarMapa(e: { features?: { layer?: { id?: string }; properties?: { id?: unknown } | null }[] }) {
    if (editando !== null || (drawRef.current && drawRef.current.getMode() !== "simple_select")) return;
    const id = Number(e.features?.find((f) => f.layer?.id === "terrenos-relleno")?.properties?.id);
    const c = cultivos.find((x) => x.id === id);
    if (c) enfocarYAbrir(c);
  }

  return (
    <div className="relative size-full">
      {mostrarVista && (
        <div className="absolute top-3 left-3 z-10 flex rounded-full border border-borde bg-papel text-[14px] leading-[20px] font-semibold shadow-sm junto-al-panel lg:top-auto lg:bottom-[40px] lg:left-[377px]">
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
              className={`tactil relative rounded-full px-3 py-2 ${vista === valor ? "bg-tinta text-white" : "text-tinta"}`}
            >
              {texto}
            </button>
          ))}
        </div>
      )}
      <Map
        ref={mapaRef}
        onLoad={() => setCargado(true)}
        interactiveLayerIds={mostrarVista ? ["terrenos-relleno"] : []}
        onClick={alTocarMapa}
        mapboxAccessToken={TOKEN}
        initialViewState={
          abierto?.poligono
            ? {
                bounds: limites(abierto.poligono),
                fitBoundsOptions: { padding: relleno(), maxZoom: 17 },
              }
            : {
                longitude: inicio.lon,
                latitude: inicio.lat,
                zoom: abierto ? 15 : 12,
                padding: relleno(),
              }
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
        <Source id="terrenos" type="geojson" data={capaTerrenos(cultivos.filter((c) => c.id !== editando))}>
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
          cultivos
            .filter((c) => c.id !== editando)
            .map((c) => (
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
                className="tactil relative flex size-11 cursor-pointer items-center justify-center rounded-full border-[2.4px] border-white bg-petroleo text-[22px] shadow-[0_2px_5px_rgba(38,59,53,0.35)] transition-transform hover:scale-105"
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
            <VentanaChacra
              cultivo={enVentana}
              onCerrar={() => setVentana(null)}
              onEditarTerreno={enVentana.poligono ? () => editarTerreno(enVentana) : undefined}
            />
          </Popup>
        )}
      </Map>
      {/* Minileyenda a la izquierda de la columna de zoom, brújula, GPS y escala (abajo en escritorio, arriba en el celular). */}
      {mostrarVista && (
        <LeyendaMapa vista={vista} className="absolute top-3 right-[58px] z-10 lg:top-auto lg:right-[94px] lg:bottom-[58px]" />
      )}
      {abierta && compacto && enVentana && (
        <div className="absolute inset-x-3 top-14 z-20 max-h-[calc(100%-68px)] overflow-y-auto [scrollbar-width:none] [&>section]:w-full">
          <VentanaChacra
            cultivo={enVentana}
            onCerrar={() => setVentana(null)}
            onEditarTerreno={enVentana.poligono ? () => editarTerreno(enVentana) : undefined}
          />
        </div>
      )}
      {/* Barra de edición: arriba, en el espacio libre entre el panel y el clima (como los avisos). */}
      {editando !== null && (
        <div className="despues-del-panel pointer-events-none absolute inset-x-3 top-14 z-30 flex justify-center lg:top-[18px] lg:right-[334px]">
          <div
            role="region"
            aria-label="Editar terreno"
            className="pointer-events-auto flex w-full max-w-[360px] flex-col gap-2 rounded-[12px] bg-white p-3 shadow-[0_6px_20px_rgba(38,59,53,0.3)]"
          >
            <p className="text-[14px] leading-[20px] text-tinta">
              <strong className="font-titulo text-[16px]">Mueve los puntos</strong> de las esquinas para cambiar tu terreno.
              Toca un punto medio para agregar una esquina.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={salirDeEdicion} className={BOTON_ARENA}>
                Cancelar
              </button>
              <button type="button" onClick={() => void guardarTerreno()} className={BOTON_OSCURO}>
                Guardar terreno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
