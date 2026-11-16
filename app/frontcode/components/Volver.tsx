import Link from "next/link";
import { IconoLinea } from "@/app/frontcode/components/IconoLinea";

/**
 * Barra para volver a la pantalla de arriba ("Mi Perfil", "Semillero"…), de 48 px de alto.
 * Dice adónde lleva, así el agricultor sabe siempre dónde está y cómo regresar.
 */
export function Volver({ href, texto }: { href: string; texto: string }) {
  return (
    <Link
      href={href}
      className="-mx-2 flex min-h-12 w-max items-center gap-1.5 rounded-[10px] px-2 text-[16px] leading-[22px] font-semibold text-tinta transition-colors hover:bg-arena/60"
    >
      <IconoLinea nombre="flecha" className="size-5 shrink-0 rotate-180" />
      {texto}
    </Link>
  );
}
