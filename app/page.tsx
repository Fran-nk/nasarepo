"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { HistorialCultivos } from "@/components/HistorialCultivos";
import type { MapaChacraProps } from "@/components/mapa/MapaChacra";
import { TarjetaCargando, TarjetaDato, TarjetaError } from "@/components/tarjetas/TarjetaDato";
import { obtenerContexto } from "@/lib/api/cliente";
import { db, type Chacra } from "@/lib/almacen";
import { useConsulta, useUbicacion } from "@/lib/hooks";
import { HAY_TOKEN_MAPBOX } from "@/lib/mapbox";
import { formatoMiles } from "@/lib/mensajes";
import { ZONAS } from "@/lib/textos";

const MapaChacra = dynamic<MapaChacraProps>(() => import("@/components/mapa/MapaChacra"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-2xl bg-stone-200" />,
});

type ApiMapa = Parameters<NonNullable<MapaChacraProps["onListo"]>>[0];

function guardarChacra(c: Chacra | null) {
  if (c) void db.chacra.put(c);
  else void db.chacra.delete("principal");
}

export default function MiChacra() {
  const { punto, escenario, chacra, cargada, clave } = useUbicacion();
  const apiMapa = useRef<ApiMapa | null>(null);
  const [errorGps, setErrorGps] = useState<string | null>(null);
  const contexto = useConsulta(clave, () => obtenerContexto(punto, escenario));

  function usarUbicacion() {
    setErrorGps(null);
    if (!("geolocation" in navigator)) {
      setErrorGps("Tu celular no permite saber la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        guardarChacra({ id: "principal", lat, lon, origen: "ubicacion" });
        apiMapa.current?.irA(lat, lon);
      },
      () => setErrorGps("No pudimos saber dónde estás. Revisa que el GPS esté prendido y da permiso."),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  const ctx = contexto.datos;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">🏡 Mi chacra</h1>

      {HAY_TOKEN_MAPBOX && !cargada ? (
        <div className="h-72 animate-pulse rounded-2xl bg-stone-200" />
      ) : HAY_TOKEN_MAPBOX ? (
        // Se monta solo cuando ya se leyó la chacra guardada, para centrar el mapa y dibujar su polígono.
        <MapaChacra
          chacra={chacra}
          puntoInicial={punto}
          onCambio={guardarChacra}
          onListo={(api) => (apiMapa.current = api)}
        />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-4 text-base text-stone-600">
          <p className="text-lg font-semibold">🗺️ El mapa no está configurado</p>
          <p className="mt-1">
            Falta el token de Mapbox. Agrega <code className="rounded bg-stone-100 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> en{" "}
            <code className="rounded bg-stone-100 px-1">.env.local</code> y reinicia la app. Mientras tanto puedes usar tu ubicación.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {HAY_TOKEN_MAPBOX && (
          <button
            type="button"
            onClick={() => apiMapa.current?.dibujar()}
            className="rounded-2xl bg-green-700 px-3 py-4 text-lg font-bold text-white active:bg-green-800"
          >
            ✏️ Dibujar mi terreno
          </button>
        )}
        <button
          type="button"
          onClick={usarUbicacion}
          className={`rounded-2xl border-2 border-green-700 bg-white px-3 py-4 text-lg font-bold text-green-800 ${HAY_TOKEN_MAPBOX ? "" : "col-span-2"}`}
        >
          📍 Usar dónde estoy
        </button>
      </div>
      {HAY_TOKEN_MAPBOX && (
        <p className="-mt-2 text-base text-stone-500">
          Para dibujar: toca cada esquina de tu terreno y toca otra vez la primera esquina para cerrar.
        </p>
      )}
      {errorGps && <p className="rounded-xl bg-red-50 p-3 text-base text-red-800">{errorGps}</p>}

      {contexto.cargando && <TarjetaCargando texto="Buscando tu zona…" />}
      {contexto.error && <TarjetaError texto={contexto.error} />}
      {ctx && (
        <TarjetaDato
          emoji="⛰️"
          pregunta="¿Dónde está tu chacra?"
          respuesta={`Zona ${ZONAS[ctx.zona].nombre}, a ${formatoMiles(ctx.altitud_m)} m de altura`}
          tono="verde"
          datos={[
            { etiqueta: "Latitud", valor: punto.lat.toFixed(5) },
            { etiqueta: "Longitud", valor: punto.lon.toFixed(5) },
            { etiqueta: "Altitud", valor: `${ctx.altitud_m} m s. n. m.` },
            { etiqueta: "Zona (Pulgar Vidal)", valor: ctx.zona },
            ...(chacra?.area_ha ? [{ etiqueta: "Área", valor: `${chacra.area_ha.toFixed(3)} ha` }] : []),
          ]}
          fuente="Altitud: modelo de elevación · Zonas: Pulgar Vidal"
        >
          <p className="text-lg text-stone-700">📌 {ctx.lugar}</p>
          <p className="text-base text-stone-600">{ZONAS[ctx.zona].descripcion}</p>
          {chacra?.area_ha !== undefined && (
            <p className="mt-1 text-lg text-stone-700">
              📐 Tu terreno mide <strong>{chacra.area_ha < 0.1 ? `${Math.round(chacra.area_ha * 10_000)} m²` : `${chacra.area_ha.toFixed(1)} hectáreas`}</strong>
            </p>
          )}
          {!chacra && (
            <p className="mt-1 text-base text-amber-800">Todavía no marcaste tu terreno: usamos el lugar de la demostración.</p>
          )}
        </TarjetaDato>
      )}

      <HistorialCultivos sugeridos={ctx?.cultivos_comunes ?? []} />

      <Link
        href="/recomendaciones"
        className="rounded-2xl bg-green-700 px-4 py-5 text-center text-xl font-bold text-white shadow active:bg-green-800"
      >
        🌱 ¿Qué siembro ahora?
      </Link>
    </div>
  );
}
