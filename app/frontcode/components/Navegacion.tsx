"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMapa } from "@/app/frontcode/components/mapa/ContextoMapa";
import { NAV } from "@/app/frontcode/lib/textos";

/**
 * Dos pestañas: "Perfil" (con sus cultivos; "Mi Cultivo", el clima y las recomendaciones cuelgan de ahí)
 * y "Semillas". Íconos del diseño (Figma 74:449) con su tamaño exacto dentro de una caja de 20 px.
 */
const PESTANAS = [
  {
    href: "/perfil",
    icono: { src: "/iconos/menu-perfil.svg", ancho: 18.3323, alto: 18.3334 },
    etiqueta: "Perfil",
    texto: NAV.perfil,
    rutas: ["/perfil", "/calendario", "/recomendaciones", "/clima"],
    exactas: ["/"],
  },
  {
    href: "/semillas",
    icono: { src: "/iconos/menu-semillas.svg", ancho: 14.1667, alto: 15.0002 },
    etiqueta: "Semillas",
    texto: NAV.semillas,
    rutas: ["/semillas"],
    exactas: [],
  },
];

/**
 * Menú (Figma 74:449): caja blanca redondeada con las pestañas dentro. La abierta es un bloque tinta
 * con su nombre en mayúsculas y el ícono a la derecha; la otra, solo el ícono sobre papel.
 * En escritorio va arriba a la izquierda, encima del panel; en el celular, abajo al centro.
 * Al cambiar de pestaña el nombre aparece con una animación.
 */
export function Navegacion() {
  const ruta = usePathname();
  const { paso, cancelarAsistente } = useMapa();
  return (
    <nav
      aria-label="Secciones"
      className="fixed bottom-3 left-1/2 z-30 flex w-max -translate-x-1/2 items-start gap-[7px] rounded-[14px] bg-white p-[7px] shadow-[0_2px_8px_rgba(38,59,53,0.18)] lg:top-[18px] lg:bottom-auto lg:left-[20px] lg:translate-x-0 lg:shadow-none"
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
            className={`tactil relative flex h-[44px] min-w-[44px] items-center justify-center rounded-[14px] transition-[background-color,padding] duration-300 ease-out motion-reduce:transition-none ${
              activa ? "bg-tinta px-[10px]" : "bg-papel hover:bg-arena"
            }`}
          >
            <span
              className={`overflow-hidden font-titulo text-[20.268px] leading-[24.068px] font-bold whitespace-nowrap text-[#fffdf6] uppercase transition-[max-width,opacity,margin] duration-300 ease-out motion-reduce:transition-none ${
                activa ? "mr-[5px] max-w-[160px] opacity-100" : "mr-0 max-w-0 opacity-0"
              }`}
            >
              {p.etiqueta}
            </span>
            {/* El ícono del diseño se usa como máscara para pintarlo de claro (abierta) o tinta (cerrada). */}
            <span aria-hidden className="flex size-[20px] shrink-0 items-center justify-center">
              <span
                className={`block shrink-0 transition-colors duration-300 motion-reduce:transition-none ${activa ? "bg-[#fffdf6]" : "bg-tinta"}`}
                style={{
                  width: p.icono.ancho,
                  height: p.icono.alto,
                  mask: `url(${p.icono.src}) center / contain no-repeat`,
                  WebkitMask: `url(${p.icono.src}) center / contain no-repeat`,
                }}
              />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
