"use client";

import { TarjetaCargando, TarjetaError } from "@/components/tarjetas/TarjetaDato";
import {
  TarjetaAlertas,
  TarjetaElNino,
  TarjetaRiego,
  TarjetaSemaforo,
  TarjetaVsNormal,
} from "@/components/tarjetas/TarjetasClima";
import {
  obtenerAlertas,
  obtenerElNino,
  obtenerRiego,
  obtenerSemaforo,
  obtenerSemana,
  obtenerVsNormal,
} from "@/lib/api/cliente";
import { ClimaSemana } from "@/components/tarjetas/ClimaSemana";
import { useConsulta, useUbicacion } from "@/lib/hooks";
import type { ReactNode } from "react";

function Bloque<T>({ c, children }: { c: { datos?: T; error?: string; cargando: boolean }; children: (d: T) => ReactNode }) {
  if (c.error) return <TarjetaError texto={c.error} />;
  if (!c.datos) return <TarjetaCargando />;
  return <>{children(c.datos)}</>;
}

/** Las 6 tarjetas del clima de la chacra (alertas, El Niño, semana, siembra, riego, vs. lo normal). */
export function SeccionClima() {
  const { punto, escenario, clave } = useUbicacion();
  const mes = new Date().getMonth() + 1;

  // Sin clave (IndexedDB aún cargando) no se pide nada.
  const k = (nombre: string) => (clave === null ? null : `${nombre}|${clave}`);
  const alertas = useConsulta(k("alertas"), () => obtenerAlertas(punto, escenario));
  const nino = useConsulta(k("nino"), () => obtenerElNino(punto, escenario));
  const semana = useConsulta(k("semana"), () => obtenerSemana(punto, escenario));
  const semaforo = useConsulta(k(`semaforo|${mes}`), () => obtenerSemaforo(punto, escenario, mes));
  const riego = useConsulta(k("riego"), () => obtenerRiego(punto, escenario));
  const vsNormal = useConsulta(k("vsnormal"), () => obtenerVsNormal(punto, escenario));

  return (
    <div className="flex flex-col gap-4">
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
