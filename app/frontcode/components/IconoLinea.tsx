/** Íconos de línea oscuros (mismo trazo que los del clima): se pintan con `currentColor`. */
const TRAZOS = {
  gota: <path d="M12 3.5c-3 3.8-5.5 7-5.5 10a5.5 5.5 0 0 0 11 0c0-3-2.5-6.2-5.5-10Z" />,
  copo: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
      <path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  lupa: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5.5 5.5" />
    </>
  ),
  check: <path d="m4.5 12.5 4.5 4.5 10.5-10.5" />,
  equis: <path d="M6 6l12 12M18 6 6 18" />,
  flecha: <path d="m9 5 7 7-7 7" />,
  sinSenal: (
    <>
      <path d="M5 12.5a10 10 0 0 1 4-2.3M15 10.2a10 10 0 0 1 4 2.3M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="0.6" fill="currentColor" />
      <path d="m3.5 3.5 17 17" />
    </>
  ),
  basura: (
    <>
      <path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 13h9l1-13" />
      <path d="M10 10.5v5.5M14 10.5v5.5" />
    </>
  ),
  lapiz: (
    <>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      <path d="m14.5 5.5 3 3" />
    </>
  ),
  montana: <path d="m2.5 19.5 7-12 4 6.5 2.5-3.5 5.5 9Z" />,
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  estrella: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8Z" />,
} as const;

export type NombreIconoLinea = keyof typeof TRAZOS;

export function IconoLinea({ nombre, className = "size-4" }: { nombre: NombreIconoLinea; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
