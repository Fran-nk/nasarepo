"use client";

import Link from "next/link";
import { BotonVoz } from "@/components/BotonVoz";
import { CHIP, FICHA_ARENA, ROTULO_FICHA, TARJETA_BLANCA, TITULO_SECCION, VALOR_FICHA } from "@/components/estilos";
import { IconoLinea, type NombreIconoLinea } from "@/components/IconoLinea";
import { TarjetaCargando } from "@/components/tarjetas/TarjetaDato";
import { alternarMiSemilla } from "@/lib/almacen";
import { useCatalogo, useMisSemillas } from "@/lib/hooks";
import { formatoMiles } from "@/lib/mensajes";
import { CATEGORIAS, RAREZA } from "@/lib/textos";
import { BarraStat } from "./BarraStat";

/** Bloque blanco de la ficha con su título en Roboto (sin emojis: el diseño usa pocos colores). */
function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className={`${TARJETA_BLANCA} flex flex-col gap-2.5`}>
      <h2 className={TITULO_SECCION}>{titulo}</h2>
      {children}
    </section>
  );
}

/** Ficha arena con un dato (como los widgets de "Tu cultivo hoy"). */
function Dato({ icono, etiqueta, valor }: { icono: NombreIconoLinea; etiqueta: string; valor: string }) {
  return (
    <div className={`${FICHA_ARENA} flex flex-col gap-1`}>
      <dt className="flex items-center gap-1.5">
        <IconoLinea nombre={icono} className="size-4 shrink-0 text-tinta" />
        <span className={ROTULO_FICHA}>{etiqueta}</span>
      </dt>
      <dd className={VALOR_FICHA}>{valor}</dd>
    </div>
  );
}

export function duracion(dias: number): string {
  if (dias >= 365) {
    const anios = Math.round(dias / 365);
    return anios === 1 ? "1 año" : `${anios} años`;
  }
  const meses = Math.round(dias / 30);
  return meses === 1 ? "1 mes" : `${meses} meses`;
}

const TEXTO = "text-[15px] leading-[22px] text-tinta";

/** Ficha completa de una semilla con el estilo del panel: tarjetas blancas, fichas arena e íconos de línea. */
export function FichaSemilla({ id }: { id: string }) {
  const { porId, cargando } = useCatalogo();
  const mias = useMisSemillas();
  const s = porId.get(id);

  if (cargando) return <TarjetaCargando />;
  if (!s)
    return (
      <p className={`${TARJETA_BLANCA} ${TEXTO}`}>
        No encontramos esta semilla.{" "}
        <Link href="/semillas" className="font-semibold text-tinta underline">
          Volver
        </Link>
      </p>
    );

  const tengo = mias.has(s.id);
  const enRescate = s.rareza === "en_rescate";
  const nombres = (ids: string[]) =>
    ids
      .map((x) => porId.get(x))
      .filter((x) => !!x)
      .map((x) => x!);
  const bien = nombres(s.despues_de_bien);
  const mal = nombres(s.despues_de_mal);
  const textoVoz = [
    s.nombre,
    s.historia_rescate,
    `Necesita agua: ${s.stats.agua} de 5. Aguanta el frío: ${s.stats.frio} de 5. Aguanta el calor: ${s.stats.calor} de 5.`,
    `Crece entre ${s.altura_min_m} y ${s.altura_max_m} metros de altura.`,
    s.habilidades.join(". "),
    `Cómo guardar tu semilla: ${s.guardar_semilla}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <div className="flex flex-col gap-3">
      <Link href="/semillas" className="w-max text-[18px] leading-[28px] font-semibold text-tinta">
        ← Semillero
      </Link>

      {/* Cabecera como la de "Mi Cultivo": dibujo grande a la izquierda, nombre y chips a la derecha. */}
      <header className={`${TARJETA_BLANCA} relative flex items-center gap-3 ${enRescate ? "border-terracota" : ""}`}>
        <span
          aria-hidden
          className="flex size-[88px] shrink-0 items-center justify-center rounded-[12px] border-[0.5px] border-borde bg-arena text-[48px] lg:size-[80px] lg:text-[44px]"
        >
          {s.emoji}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="pr-8 font-titulo text-[28px] leading-[30px] font-bold text-tinta">{s.nombre}</h1>
          <p className="text-[12px] leading-[16px] text-secundario italic">
            {s.cientifico} · {s.familia}
          </p>
          <div className="flex flex-wrap gap-1 pt-0.5">
            <span className={`${CHIP} ${CATEGORIAS[s.categoria].color}`}>{CATEGORIAS[s.categoria].nombre}</span>
            <span className={`${CHIP} ${RAREZA[s.rareza].color}`}>{RAREZA[s.rareza].nombre}</span>
            {s.perenne && <span className={`${CHIP} bg-pradera/50 text-tinta`}>Vive varios años</span>}
          </div>
        </div>
        <span className="absolute top-3 right-3">
          <BotonVoz texto={textoVoz} pequeno className="bg-white" />
        </span>
      </header>
      {s.nombres_locales.length > 0 && (
        <p className="text-[13px] leading-[18px] text-secundario">También le dicen: {s.nombres_locales.join(", ")}</p>
      )}

      {enRescate && s.historia_rescate && (
        <section className="flex flex-col gap-1.5 rounded-[20px] bg-tinta p-4 text-papel">
          <h2 className="flex items-center gap-1.5 font-titulo text-[20px] leading-[24px] font-bold text-senal">
            <IconoLinea nombre="estrella" className="size-5 shrink-0" />
            ¿Por qué rescatarla?
          </h2>
          <p className="text-[15px] leading-[22px]">{s.historia_rescate}</p>
        </section>
      )}

      <Seccion titulo="Sus características">
        <div className="flex flex-col gap-2">
          <BarraStat stat="agua" valor={s.stats.agua} />
          <BarraStat stat="frio" valor={s.stats.frio} />
          <BarraStat stat="calor" valor={s.stats.calor} />
        </div>
        <dl className="grid grid-cols-2 gap-2 pt-1 lg:gap-[6px]">
          <Dato icono="montana" etiqueta="Crece a" valor={`${formatoMiles(s.altura_min_m)}–${formatoMiles(s.altura_max_m)} m`} />
          <Dato icono="reloj" etiqueta={s.perenne ? "Primera cosecha" : "Se cosecha en"} valor={duracion(s.ciclo_dias)} />
        </dl>
      </Seccion>

      {s.habilidades.length > 0 && (
        <Seccion titulo="Habilidades">
          <ul className="flex flex-col gap-1.5">
            {s.habilidades.map((h) => (
              <li key={h} className={`flex gap-2 ${TEXTO}`}>
                <IconoLinea nombre="check" className="mt-[3px] size-4 shrink-0 text-tinta" />
                {h}
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {!s.perenne && (bien.length > 0 || mal.length > 0) && (
        <Seccion titulo="Rotación">
          {bien.length > 0 && <ListaRotacion titulo="Siémbrala después de" icono="check" semillas={bien} />}
          {mal.length > 0 && <ListaRotacion titulo="No la siembres después de" icono="equis" semillas={mal} mala />}
        </Seccion>
      )}
      {s.perenne && (
        <Seccion titulo="Cómo sembrarla">
          <p className={TEXTO}>
            Vive varios años: siémbrala en el borde de tu terreno, como sombra o junto a otros árboles. No entra en la rotación.
          </p>
        </Seccion>
      )}

      <Seccion titulo="Para qué sirve">
        <div className="flex flex-wrap gap-1.5">
          {s.usos.map((u) => (
            <span key={u} className={`${FICHA_ARENA} px-2.5 py-1 text-[14px] leading-[20px] text-tinta`}>
              {u}
            </span>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Cómo guardar tu semilla">
        <p className={TEXTO}>{s.guardar_semilla}</p>
      </Seccion>

      <button
        type="button"
        onClick={() => void alternarMiSemilla(s.id)}
        aria-pressed={tengo}
        className={`sticky bottom-[76px] flex items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-[16px] leading-[24px] font-semibold shadow-[0_2px_8px_rgba(38,59,53,0.25)] transition-colors lg:bottom-0 ${
          tengo ? "border-[1.6px] border-tinta bg-white text-tinta" : "bg-tinta text-white hover:bg-tinta/90"
        }`}
      >
        <IconoLinea nombre={tengo ? "check" : "estrella"} className="size-5 shrink-0" />
        {tengo ? "La tengo (tocar para quitar)" : "Tengo esta semilla"}
      </button>
    </div>
  );
}

/** Fichas arena con las semillas que van bien (o mal) antes de esta. */
function ListaRotacion({
  titulo,
  icono,
  semillas,
  mala = false,
}: {
  titulo: string;
  icono: NombreIconoLinea;
  semillas: { id: string; nombre: string; emoji: string }[];
  mala?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className={`flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold ${mala ? "text-terracota" : "text-tinta"}`}>
        <IconoLinea nombre={icono} className="size-4 shrink-0" />
        {titulo}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {semillas.map((x) => (
          <li key={x.id}>
            <Link
              href={`/semillas/${x.id}`}
              className={`${FICHA_ARENA} flex items-center gap-1.5 px-2 py-1 text-[14px] leading-[20px] text-tinta hover:bg-arena/70`}
            >
              <span aria-hidden className="text-[18px] leading-none">
                {x.emoji}
              </span>
              {x.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
