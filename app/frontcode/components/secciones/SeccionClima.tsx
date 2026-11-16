"use client";

import { TarjetaCargando, TarjetaError } from "@/app/frontcode/components/tarjetas/TarjetaDato";
import {
  TarjetaAlertas,
  TarjetaElNino,
  TarjetaRiego,
  TarjetaSemaforo,
  TarjetaVsNormal,
} from "@/app/frontcode/components/tarjetas/TarjetasClima";
import {
  obtenerAlertas,
  obtenerElNino,
  obtenerRiego,
  obtenerSemaforo,
  obtenerSemana,
  obtenerVsNormal,
} from "@/app/frontcode/lib/api/cliente";
import { ClimaSemana } from "@/app/frontcode/components/tarjetas/ClimaSemana";
import { useConsulta, useUbicacion } from "@/app/frontcode/lib/hooks";
import type { ReactNode } from "react";

function Bloque<T>({
  c,
  children,
}: {
  c: { datos?: T; error?: string; cargando: boolean; reintentar: () => void };
  children: (d: T) => ReactNode;
}) {
  if (c.error) return <TarjetaError detalle={c.error} onReintentar={c.reintentar} />;
  if (!c.datos) return <TarjetaCargando />;
  return <>{children(c.datos)}</>;
}

/** Las 6 tarjetas del clima de la chacra (alertas, El Niño, semana, siembra, riego, vs. lo normal). */
export function SeccionClima() {
  const { punto, clave } = useUbicacion();
  const mes = new Date().getMonth() + 1;

  // Sin clave (IndexedDB aún cargando) no se pide nada.
  const k = (nombre: string) => (clave === null ? null : `${nombre}|${clave}`);
  const alertas = useConsulta(k("alertas"), () => obtenerAlertas(punto));
  const nino = useConsulta(k("nino"), () => obtenerElNino(punto));
  const semana = useConsulta(k("semana"), () => obtenerSemana(punto));
  const semaforo = useConsulta(k(`semaforo|${mes}`), () => obtenerSemaforo(punto, mes));
  const riego = useConsulta(k("riego"), () => obtenerRiego(punto));
  const vsNormal = useConsulta(k("vsnormal"), () => obtenerVsNormal(punto));

  return (
    <div className="surcos flex flex-col gap-3">
      <Bloque c={alertas}>{(d) => <TarjetaAlertas datos={d} />}</Bloque>
      <Bloque c={nino}>{(d) => <TarjetaElNino datos={d} />}</Bloque>
      {/* En escritorio el clima de la semana flota arriba a la derecha del mapa. */}
      <ClimaSemana className="w-full lg:hidden" />
      <Bloque c={semaforo}>{(d) => <TarjetaSemaforo datos={d} />}</Bloque>
      <Bloque c={riego}>{(d) => <TarjetaRiego datos={d} semana={semana.datos} />}</Bloque>
      <Bloque c={vsNormal}>{(d) => <TarjetaVsNormal datos={d} />}</Bloque>
    </div>
  );
}
