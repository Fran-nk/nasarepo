"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { BotonListo, PreguntaCultivosAnteriores } from "@/app/frontcode/components/CultivosChacra";
import { BOTON_PIE_PRINCIPAL, BOTON_PIE_SECUNDARIO } from "@/app/frontcode/components/SelectorSemillas";
import { useAviso } from "@/app/frontcode/components/Avisos";
import { IconoLinea } from "@/app/frontcode/components/IconoLinea";
import { actualizarCultivo, quitarCultivo, restaurarCultivo, type Cultivo } from "@/app/frontcode/lib/almacen";
import { useCatalogo } from "@/app/frontcode/lib/hooks";
import { AVISOS, ICONOS_CHACRA, QUITAR_CULTIVO } from "@/app/frontcode/lib/textos";

const ROTULO = "font-titulo text-[13px] leading-[16px] font-bold text-tinta uppercase";

/**
 * Ventana para editar un cultivo: su nombre, su ícono y lo que se sembró antes.
 * El nombre y el ícono se guardan con "Guardar"; lo sembrado antes se guarda al elegirlo en su ventana.
 */
export function EditarCultivo({ cultivo, onCerrar }: { cultivo: Cultivo; onCerrar: () => void }) {
  const idTitulo = useId();
  const idNombre = useId();
  const { porId } = useCatalogo();
  const [nombre, setNombre] = useState(cultivo.nombre);
  const [icono, setIcono] = useState(cultivo.icono ?? ICONOS_CHACRA[0]);
  const [eligiendo, setEligiendo] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const avisar = useAviso();
  const anteriores = cultivo.historial.filter((id): id is string => id !== null);

  // Escape cierra (si no está abierta la ventana de semillas, que tiene su propio Escape).
  useEffect(() => {
    function alTeclado(e: KeyboardEvent) {
      if (e.key === "Escape" && !eligiendo) {
        if (confirmando) setConfirmando(false);
        else onCerrar();
      }
    }
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [onCerrar, eligiendo, confirmando]);

  async function guardar() {
    await actualizarCultivo(cultivo.id!, { nombre: nombre.trim() || cultivo.nombre, icono });
    avisar({ texto: AVISOS.cultivoGuardado });
    onCerrar();
  }

  // Quitar pide confirmación y además se puede deshacer: borrar el terreno es el momento de más ansiedad.
  async function quitar() {
    const quitado = await quitarCultivo(cultivo.id!);
    onCerrar();
    if (quitado)
      avisar({ texto: AVISOS.cultivoQuitado(quitado.nombre), icono: "basura", deshacer: () => void restaurarCultivo(quitado) });
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-stretch justify-center bg-tinta/40 lg:items-center lg:p-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="flex h-full w-full flex-col overflow-hidden bg-papel lg:h-auto lg:max-h-[88dvh] lg:max-w-[420px] lg:rounded-[20px] lg:shadow-[0_12px_40px_rgba(38,59,53,0.3)]"
      >
        <div className="flex items-center gap-3 border-b border-borde px-5 pt-5 pb-4">
          <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-petroleo text-[22px]">
            {icono}
          </span>
          <h2 id={idTitulo} className="min-w-0 flex-1 font-titulo text-[24px] leading-[28px] font-bold text-tinta">
            Editar cultivo
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="tactil relative flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-borde text-[18px] text-tinta"
          >
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor={idNombre} className={ROTULO}>
              Nombre
            </label>
            <input
              id={idNombre}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={40}
              autoComplete="off"
              placeholder="Ej.: Chacra de abajo"
              className="w-full rounded-[14px] border border-borde-fuerte bg-white px-4 py-3 text-[16px] leading-[24px] text-tinta outline-none focus:border-tinta"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className={ROTULO}>Ícono</p>
            <div role="radiogroup" aria-label="Ícono del cultivo" className="grid grid-cols-6 gap-2">
              {ICONOS_CHACRA.map((e) => (
                <button
                  key={e}
                  type="button"
                  role="radio"
                  aria-checked={icono === e}
                  aria-label={`Usar ${e} como ícono`}
                  onClick={() => setIcono(e)}
                  className={`flex aspect-square items-center justify-center rounded-[12px] border text-[22px] transition-colors ${
                    icono === e ? "border-tinta bg-pradera/30" : "border-borde bg-arena hover:bg-arena/70"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className={ROTULO}>¿Qué sembraste antes?</p>
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => {
                const s = anteriores[i] ? porId.get(anteriores[i]) : undefined;
                return (
                  <span
                    key={i}
                    title={s?.nombre}
                    className={`flex size-11 items-center justify-center rounded-[12px] border-[0.5px] text-[24px] ${
                      s ? "border-borde bg-arena" : "border-dashed border-secundario/40 bg-arena/50"
                    }`}
                  >
                    {s?.emoji}
                    {s && <span className="sr-only">{s.nombre}</span>}
                  </span>
                );
              })}
              <button
                type="button"
                onClick={() => setEligiendo(true)}
                className="tactil relative ml-1 text-[14px] leading-[20px] font-semibold text-tinta underline underline-offset-2"
              >
                Cambiar
              </button>
            </div>
          </div>

          {!confirmando && (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="tactil relative flex w-max items-center gap-2 text-[14px] leading-[20px] font-semibold text-terracota-fuerte underline underline-offset-2"
            >
              <IconoLinea nombre="basura" className="size-4" />
              {QUITAR_CULTIVO.boton}
            </button>
          )}
        </div>

        {confirmando ? (
          <div role="alertdialog" aria-label={QUITAR_CULTIVO.pregunta(cultivo.nombre)} className="animar-surco flex flex-col gap-3 border-t border-borde bg-arena px-5 py-4">
            <div>
              <p className="font-titulo text-[20px] leading-[24px] font-bold text-tinta">{QUITAR_CULTIVO.pregunta(cultivo.nombre)}</p>
              <p className="text-[14px] leading-[20px] text-tinta">{QUITAR_CULTIVO.explica}</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setConfirmando(false)} className={BOTON_PIE_SECUNDARIO}>
                {QUITAR_CULTIVO.no}
              </button>
              <button
                type="button"
                onClick={() => void quitar()}
                className="flex min-h-12 flex-1 items-center justify-center rounded-[14px] bg-terracota-fuerte px-4 py-3 text-[16px] leading-[24px] font-semibold text-papel hover:bg-terracota-fuerte/90"
              >
                {QUITAR_CULTIVO.si}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 border-t border-borde px-5 py-4">
            <button type="button" onClick={onCerrar} className={BOTON_PIE_SECUNDARIO}>
              Cancelar
            </button>
            <button type="button" onClick={() => void guardar()} className={BOTON_PIE_PRINCIPAL}>
              Guardar
            </button>
          </div>
        )}
      </section>

      {eligiendo && (
        <PreguntaCultivosAnteriores
          cultivoId={cultivo.id!}
          onCerrar={() => setEligiendo(false)}
          pie={<BotonListo onClick={() => setEligiendo(false)} />}
        />
      )}
    </div>,
    document.body,
  );
}
