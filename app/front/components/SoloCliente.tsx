"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const sinSuscripcion = () => () => {};

/**
 * Las pantallas dependen de datos del dispositivo (IndexedDB, ubicación, fecha de hoy),
 * así que su contenido se dibuja solo en el navegador. El servidor envía el esqueleto.
 */
export function SoloCliente({ children }: { children: ReactNode }) {
  const enNavegador = useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
  if (!enNavegador) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-arena" />
        <div className="h-40 animate-pulse rounded-[20px] bg-arena" />
        <div className="h-28 animate-pulse rounded-[20px] bg-arena" />
      </div>
    );
  }
  return <>{children}</>;
}
