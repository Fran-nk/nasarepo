"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMapa } from "@/app/front/components/mapa/ContextoMapa";
import { NAV } from "@/app/front/lib/textos";

/**
 * Dos pestañas: "Mi Perfil" (con sus cultivos; "Mi Cultivo", el clima y las recomendaciones cuelgan de ahí)
 * y "Semillas".
 */
const PESTANAS = [
  {
    href: "/perfil",
    icono: "/iconos/circle-user.svg",
    texto: NAV.perfil,
    rutas: ["/perfil", "/calendario", "/recomendaciones", "/clima"],
    exactas: ["/"],
  },
  { href: "/semillas", icono: "/iconos/sprout.svg", texto: NAV.semillas, rutas: ["/semillas"], exactas: [] },
];

/**
 * Menú (Figma 65:54): la pestaña abierta es un bloque tinta (casi negro) con su nombre y el ícono a la derecha;
 * la otra, solo el ícono con borde negro. Esquinas rectas y sin fondo de contenedor.
 * En escritorio las pestañas van pegadas encima del panel, como pestañas de carpeta; en el celular, abajo al centro.
 * Al cambiar de pestaña el nombre aparece con una animación.
 */
export function Navegacion() {
  const ruta = usePathname();
  const { paso, cancelarAsistente } = useMapa();
  return (
    <nav
      aria-label="Secciones"
      className="fixed bottom-3 left-1/2 z-30 flex w-max -translate-x-1/2 items-center gap-2.5 lg:top-[18px] lg:bottom-auto lg:left-[20px] lg:translate-x-0 lg:gap-[7px] lg:px-[11px] lg:py-[7px]"
    >
      {PESTANAS.map((p) => {
        const activa = p.exactas.includes(ruta) || p.rutas.some((r) => ruta.startsWith(r));
        return (
          <Link
            key={p.href}
            href={p.href}
            aria-label={p.texto}
            title={p.texto}
            aria-current={activa ? "page" : undefined}
            // Cambiar de pestaña cancela la creación del cultivo.
            onClick={() => paso !== null && cancelarAsistente()}
            className={`flex h-[44px] min-w-[44px] items-center justify-center border shadow-[0_2px_8px_rgba(38,59,53,0.18)] transition-[background-color,border-color,padding] duration-300 ease-out motion-reduce:transition-none lg:shadow-none ${
              activa ? "border-tinta bg-tinta px-5" : "border-black bg-arena px-3 hover:bg-papel"
            }`}
          >
            <span
              className={`overflow-hidden font-titulo text-[22px] leading-none font-bold lg:text-[25px] whitespace-nowrap text-white transition-[max-width,opacity,margin] duration-300 ease-out motion-reduce:transition-none ${
                activa ? "mr-[10px] max-w-[160px] opacity-100" : "mr-0 max-w-0 opacity-0"
              }`}
            >
              {p.texto}
            </span>
            {/* El ícono del diseño se usa como máscara para pintarlo de blanco (abierta) o tinta (cerrada). */}
            <span
              aria-hidden
              className={`block size-[20px] shrink-0 transition-colors duration-300 motion-reduce:transition-none ${activa ? "bg-white" : "bg-tinta"}`}
              style={{ mask: `url(${p.icono}) center / contain no-repeat`, WebkitMask: `url(${p.icono}) center / contain no-repeat` }}
            />
          </Link>
        );
      })}
    </nav>
  );
}
