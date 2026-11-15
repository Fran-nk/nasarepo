"use client";

import { useEffect, useRef, useState } from "react";
import Map, { GeolocateControl, Marker, NavigationControl, useControl, type MapRef } from "react-map-gl/mapbox";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import area from "@turf/area";
import centroid from "@turf/centroid";
import type { Feature, Polygon } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { Chacra } from "@/lib/almacen";
import { TOKEN_MAPBOX as TOKEN } from "@/lib/mapbox";

export interface MapaChacraProps {
  chacra?: Chacra;
  /** Punto inicial cuando todavía no hay chacra (escenario de demo). */
  puntoInicial: { lat: number; lon: number };
  onCambio: (c: Chacra | null) => void;
  /** Se llama con una función para activar el modo dibujo desde un botón externo. */
  onListo?: (api: { dibujar: () => void; borrar: () => void; irA: (lat: number, lon: number) => void }) => void;
}

interface DrawProps {
  onCrear: (f: Feature<Polygon>) => void;
  onBorrar: () => void;
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
    borrar: () => ultimas.current.onBorrar(),
  }));

  const draw = useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
        defaultMode: "simple_select",
      }),
    ({ map }) => {
      map.on("draw.create", manejadores.crear);
      map.on("draw.update", manejadores.crear);
      map.on("draw.delete", manejadores.borrar);
    },
    ({ map }) => {
      map.off("draw.create", manejadores.crear);
      map.off("draw.update", manejadores.crear);
      map.off("draw.delete", manejadores.borrar);
    },
    { position: "top-left" },
  );

  // Avisar una sola vez por instancia de Draw.
  useEffect(() => ultimas.current.onDraw(draw), [draw]);
  return null;
}

export default function MapaChacra({ chacra, puntoInicial, onCambio, onListo }: MapaChacraProps) {
  const mapaRef = useRef<MapRef>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const inicio = chacra ?? puntoInicial;

  function alDraw(d: MapboxDraw) {
    drawRef.current = d;
    if (chacra?.poligono && d.getAll().features.length === 0) {
      d.add({ type: "Feature", properties: {}, geometry: chacra.poligono });
    }
    onListo?.({
      dibujar: () => d.changeMode("draw_polygon"),
      borrar: () => {
        d.deleteAll();
        onCambio(null);
      },
      irA: (lat, lon) => mapaRef.current?.flyTo({ center: [lon, lat], zoom: 15 }),
    });
  }

  function alCrear(f: Feature<Polygon>) {
    // Solo un terreno a la vez: quitar los demás polígonos.
    const d = drawRef.current;
    if (d) for (const otro of d.getAll().features) if (otro.id !== f.id) d.delete(String(otro.id));
    const [lon, lat] = centroid(f).geometry.coordinates;
    onCambio({
      id: "principal",
      lat,
      lon,
      poligono: f.geometry,
      area_ha: area(f) / 10_000,
      origen: "poligono",
    });
  }

  return (
    <div className="h-72 overflow-hidden rounded-2xl border border-stone-300">
      <Map
        ref={mapaRef}
        mapboxAccessToken={TOKEN}
        initialViewState={{ longitude: inicio.lon, latitude: inicio.lat, zoom: chacra ? 15 : 12 }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <GeolocateControl
          position="top-right"
          onGeolocate={(e) =>
            onCambio({ id: "principal", lat: e.coords.latitude, lon: e.coords.longitude, origen: "ubicacion" })
          }
        />
        <DrawControl onCrear={alCrear} onBorrar={() => onCambio(null)} onDraw={alDraw} />
        {chacra?.origen === "ubicacion" && (
          <Marker longitude={chacra.lon} latitude={chacra.lat} anchor="bottom">
            <span className="text-3xl">📍</span>
          </Marker>
        )}
      </Map>
    </div>
  );
}
