/**
 * Títulos de la guía "Territorio":
 * - página: Roboto Condensed Bold 32/38;
 * - sección: Inter SemiBold 24/30 (subtítulo);
 * - bajada: Inter Regular 16/24 en color secundario.
 */
export function Titulo({ texto, bajada, nivel = "pagina" }: { texto: string; bajada?: string; nivel?: "pagina" | "seccion" }) {
  return (
    <div className="flex flex-col gap-1">
      {nivel === "pagina" ? (
        <h1 className="font-titulo text-[32px] leading-[38px] font-bold text-tinta">{texto}</h1>
      ) : (
        <h2 className="text-[24px] leading-[30px] font-semibold text-tinta">{texto}</h2>
      )}
      {bajada && <p className="text-[16px] leading-[24px] text-secundario">{bajada}</p>}
    </div>
  );
}

/** Rótulo corto en mayúsculas (Roboto Condensed Bold 12/16), para separar bloques del panel. */
export function Rotulo({ texto }: { texto: string }) {
  return <p className="font-titulo text-[13px] leading-[16px] font-bold tracking-wide text-secundario uppercase">{texto}</p>;
}
