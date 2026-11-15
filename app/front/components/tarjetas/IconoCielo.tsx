import type { Cielo } from "@/app/front/lib/contratos/tipos";
import { CIELO } from "@/app/front/lib/textos";

/** Nube base (se reutiliza en nublado, lluvia y tormenta). */
const NUBE = "M7.5 17h9a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 6.3 10.6 3.2 3.2 0 0 0 7.5 17Z";

/**
 * Íconos de línea, de un solo color (toman el color del texto): sol, nublado, lluvia y tormenta.
 * Reemplazan a los emojis de colores en el cuadro del clima.
 */
export function IconoCielo({ cielo, className = "size-6" }: { cielo: Cielo; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={CIELO[cielo].nombre}
      className={className}
    >
      {cielo === "sol" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1" />
        </>
      )}
      {cielo === "nubes" && (
        <>
          <path d="M9.5 6.2A3.5 3.5 0 0 1 15.4 8M9 3.5v1M4.8 5.3l.7.7M3 9.5h1" />
          <path d={NUBE} transform="translate(1 2)" />
        </>
      )}
      {cielo === "lluvia" && (
        <>
          <path d={NUBE} transform="translate(0 -3)" />
          <path d="M9 17l-1 2.5M13 17l-1 2.5M17 17l-1 2.5" />
        </>
      )}
      {cielo === "tormenta" && (
        <>
          <path d={NUBE} transform="translate(0 -3)" />
          <path d="M12.5 14.5 10.5 18h3l-2 3.5" />
          <path d="M8 17l-.8 2M17 17l-.8 2" />
        </>
      )}
    </svg>
  );
}
