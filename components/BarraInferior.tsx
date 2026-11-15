"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/textos";

const PESTANAS = [
  { href: "/", emoji: "🏡", texto: NAV.chacra },
  { href: "/clima", emoji: "🌦️", texto: NAV.clima },
  { href: "/semillas", emoji: "🌱", texto: NAV.semillas },
  { href: "/calendario", emoji: "📅", texto: NAV.calendario },
];

export function BarraInferior() {
  const ruta = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white" aria-label="Secciones">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {PESTANAS.map((p) => {
          const activa = p.href === "/" ? ruta === "/" || ruta === "/recomendaciones" : ruta.startsWith(p.href);
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={activa ? "page" : undefined}
                className={`flex flex-col items-center py-2 text-sm font-semibold ${activa ? "text-green-800" : "text-stone-500"}`}
              >
                <span className={`text-2xl ${activa ? "" : "opacity-70"}`} aria-hidden>
                  {p.emoji}
                </span>
                {p.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
