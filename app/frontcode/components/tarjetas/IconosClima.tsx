import type { ReactNode } from "react";

/** Íconos de línea de un solo color (toman el color del texto) para los datos del clima. */
export type NombreIconoClima = "alerta" | "tranquilo" | "nino" | "siembra" | "riego" | "comparar";

const TRAZOS: Record<NombreIconoClima, ReactNode> = {
  // Triángulo de aviso
  alerta: (
    <>
      <path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4.5M12 17.2h.01" />
    </>
  ),
  // Escudo con visto: sin alertas
  tranquilo: (
    <>
      <path d="M12 3.5 5 6.2v5.3c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6.2L12 3.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  // Olas del mar (El Niño costero)
  nino: (
    <path d="M2.5 9c1.6 0 1.6-1.5 3.2-1.5S7.3 9 8.9 9s1.6-1.5 3.1-1.5S13.6 9 15.2 9s1.6-1.5 3.1-1.5S19.9 9 21.5 9M2.5 14c1.6 0 1.6-1.5 3.2-1.5S7.3 14 8.9 14s1.6-1.5 3.1-1.5 1.6 1.5 3.2 1.5 1.6-1.5 3.1-1.5 1.6 1.5 3.2 1.5M2.5 19c1.6 0 1.6-1.5 3.2-1.5S7.3 19 8.9 19s1.6-1.5 3.1-1.5 1.6 1.5 3.2 1.5 1.6-1.5 3.1-1.5 1.6 1.5 3.2 1.5" />
  ),
  // Brote saliendo de la tierra
  siembra: (
    <>
      <path d="M12 20v-8" />
      <path d="M12 12c0-3.3-2.4-5.5-6-5.5 0 3.3 2.4 5.5 6 5.5ZM12 13.5c0-3 2.2-5 5.5-5 0 3-2.2 5-5.5 5Z" />
      <path d="M5 20h14" />
    </>
  ),
  // Gota de agua
  riego: <path d="M12 3.5s-6 6.6-6 10.5a6 6 0 0 0 12 0c0-3.9-6-10.5-6-10.5Z" />,
  // Dos barras para comparar
  comparar: (
    <>
      <path d="M4 20h16" />
      <rect x="6" y="9" width="4" height="11" rx="1" />
      <rect x="14" y="5" width="4" height="15" rx="1" />
    </>
  ),
};

export function IconoClima({ nombre, className = "size-5" }: { nombre: NombreIconoClima; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
