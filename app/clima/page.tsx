"use client";

import { TarjetaCargando, TarjetaError } from "@/components/tarjetas/TarjetaDato";
import {
  TarjetaAlertas,
  TarjetaElNino,
  TarjetaRiego,
  TarjetaSemaforo,
  TarjetaSemana,
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
import { useConsulta, useUbicacion } from "@/lib/hooks";
import type { ReactNode } from "react";

function Bloque<T>({ c, children }: { c: { datos?: T; error?: string; cargando: boolean }; children: (d: T) => ReactNode }) {
  if (c.error) return <TarjetaError texto={c.error} />;
  if (!c.datos) return <TarjetaCargando />;
  return <>{children(c.datos)}</>;
}

export default function Clima() {
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
      <h1 className="text-2xl font-bold">🌦️ El clima en tu chacra</h1>
      <Bloque c={alertas}>{(d) => <TarjetaAlertas datos={d} />}</Bloque>
      <Bloque c={nino}>{(d) => <TarjetaElNino datos={d} />}</Bloque>
      <Bloque c={semana}>{(d) => <TarjetaSemana datos={d} />}</Bloque>
      <Bloque c={semaforo}>{(d) => <TarjetaSemaforo datos={d} />}</Bloque>
      <Bloque c={riego}>{(d) => <TarjetaRiego datos={d} semana={semana.datos} />}</Bloque>
      <Bloque c={vsNormal}>{(d) => <TarjetaVsNormal datos={d} />}</Bloque>
    </div>
  );
}
