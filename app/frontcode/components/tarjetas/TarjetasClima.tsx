"use client";

import type {
  RespuestaAlertas,
  RespuestaElNino,
  RespuestaRiego,
  RespuestaSemaforo,
  RespuestaSemana,
  RespuestaVsNormal,
} from "@/app/frontcode/lib/contratos/tipos";
import { fechaCorta, fraseRiego, fraseVsNormal, nombreMes, rangoDias } from "@/app/frontcode/lib/mensajes";
import { ALERTAS, EFECTO_NINO, ESTADO_NINO, RIEGO, SEMAFORO, SEMAFORO_RESPUESTA } from "@/app/frontcode/lib/textos";
import { GraficoMar } from "./GraficoMar";
import { TarjetaDato } from "./TarjetaDato";

const signo = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
const diaDelMes = (fechaIso: string) => Number(fechaIso.slice(8, 10));

const MAGNITUD = { debil: "débil", moderada: "moderado", fuerte: "fuerte", extraordinaria: "extraordinario" } as const;

/** "El mar está 5.8 °C más caliente que lo normal." */
function fraseMar(anomalia: number): string {
  if (Math.abs(anomalia) < 0.4) return "El mar frente al Perú está como siempre.";
  return `El mar frente al Perú está ${Math.abs(anomalia).toFixed(1)} °C más ${anomalia > 0 ? "caliente" : "frío"} que lo normal.`;
}

/* 1 · Alertas de peligro */
export function TarjetaAlertas({ datos }: { datos: RespuestaAlertas }) {
  if (datos.alertas.length === 0) {
    return (
      <TarjetaDato
        icono="tranquilo"
        pregunta="¿Hay algún peligro?"
        respuesta="No hay alertas para tu zona estos días."
        tono="verde"
        fuente={datos.fuente}
      />
    );
  }
  const orden = [...datos.alertas].sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === "peligro" ? -1 : 1));
  return (
    <div className="flex flex-col gap-3">
      {orden.map((a) => {
        const info = ALERTAS[a.tipo];
        return (
          <TarjetaDato
            key={`${a.tipo}-${a.desde}`}
            icono="alerta"
            pregunta={a.nivel === "peligro" ? "¡Peligro!" : "Atención"}
            respuesta={`${info.nombre} ${rangoDias(a.desde, a.hasta)}.`}
            queHacer={info.queHacer}
            tono={a.nivel === "peligro" ? "rojo" : "ambar"}
            datos={[
              { etiqueta: "Tipo", valor: a.tipo },
              { etiqueta: "Nivel", valor: a.nivel },
              { etiqueta: "Desde", valor: a.desde },
              { etiqueta: "Hasta", valor: a.hasta },
            ]}
            fuente={datos.fuente}
          />
        );
      })}
    </div>
  );
}

/* 2 · El Niño hoy */
export function TarjetaElNino({ datos }: { datos: RespuestaElNino }) {
  const estado = ESTADO_NINO[datos.estado];
  const efecto = EFECTO_NINO[datos.efecto_zona];
  const fenomeno = datos.fenomeno === "nino_costero" ? "El Niño costero" : "La Niña costera";
  const activo = datos.estado !== "no_activo";
  return (
    <TarjetaDato
      icono="nino"
      pregunta="¿Cómo está El Niño hoy?"
      respuesta={
        activo
          ? `${fenomeno}: ${estado.nombre.toLowerCase()}${datos.magnitud ? ` (${MAGNITUD[datos.magnitud]})` : ""}.`
          : "No hay El Niño ni La Niña ahora."
      }
      detalle={`${fraseMar(datos.anomalia_c)}${activo && datos.efecto_zona !== "sin_efecto_claro" ? ` ${efecto.respuesta}` : ""}`}
      queHacer={activo ? efecto.queHacer : undefined}
      tono={datos.estado === "alerta" ? "rojo" : datos.estado === "vigilancia" ? "ambar" : "verde"}
      datos={[
        { etiqueta: "Condición estimada", valor: datos.estado },
        { etiqueta: "Fenómeno", valor: datos.fenomeno },
        ...(datos.magnitud ? [{ etiqueta: "Magnitud", valor: datos.magnitud }] : []),
        { etiqueta: "Mar vs. lo normal (3 meses)", valor: `${signo(datos.anomalia_c)} °C` },
        { etiqueta: "Mar vs. lo normal (último mes)", valor: `${signo(datos.anomalia_30d_c)} °C` },
        { etiqueta: "Último dato", valor: datos.hasta },
        { etiqueta: "Efecto en la zona", valor: datos.efecto_zona },
      ]}
      fuente={datos.fuente}
    >
      <GraficoMar datos={datos} />
    </TarjetaDato>
  );
}

/* 4 · Semáforo de siembra */
export function TarjetaSemaforo({ datos }: { datos: RespuestaSemaforo }) {
  const luces = ["rojo", "amarillo", "verde"] as const;
  // Semáforo con la paleta: terracota, señal y bosque sobre tinta. La luz amarilla encendida "respira".
  const color = { rojo: "bg-terracota", amarillo: "bg-senal", verde: "bg-bosque" };
  return (
    <TarjetaDato
      icono="siembra"
      pregunta="¿Es buen momento para sembrar?"
      respuesta={SEMAFORO_RESPUESTA[datos.color]}
      detalle={SEMAFORO[datos.motivo]}
      tono={datos.color === "verde" ? "verde" : datos.color === "amarillo" ? "ambar" : "rojo"}
      datos={[
        { etiqueta: "Color", valor: datos.color },
        { etiqueta: "Motivo", valor: datos.motivo },
      ]}
      fuente={datos.fuente}
    >
      <div className="flex justify-center gap-3 rounded-[12px] bg-tinta p-2.5" aria-hidden>
        {luces.map((l) => (
          <span
            key={l}
            className={`size-8 rounded-full ${datos.color === l ? `${color[l]} ${l === "amarillo" ? "animar-respirar" : ""}` : "bg-white/15"}`}
          />
        ))}
      </div>
    </TarjetaDato>
  );
}

/* 5 · ¿Riego hoy? */
export function TarjetaRiego({ datos, semana }: { datos: RespuestaRiego; semana?: RespuestaSemana }) {
  const info = RIEGO[datos.regar];
  const nivel = Math.round(datos.humedad_suelo * 100);
  return (
    <TarjetaDato
      icono="riego"
      pregunta="¿Riego hoy?"
      respuesta={info.respuesta}
      detalle={fraseRiego(datos, semana?.dias)}
      tono={datos.regar === "si" ? "ambar" : datos.regar === "poco" ? "neutral" : "verde"}
      datos={[
        { etiqueta: "Humedad del suelo", valor: `${nivel}%` },
        { etiqueta: "Humedad medida el", valor: datos.humedad_fecha },
        { etiqueta: "Lluvia próximos 3 días", valor: `${datos.lluvia_3dias_mm} mm` },
      ]}
      fuente={datos.fuente}
    >
      <div className="flex items-center gap-3">
        <span className="text-[13px] leading-[18px] text-secundario">Seca</span>
        <div className="h-4 flex-1 overflow-hidden rounded-[3px] bg-arena" role="img" aria-label={`Humedad de la tierra: ${nivel} de 100`}>
          {/* Se llena desde la izquierda hasta su nivel (solo transform). */}
          <div
            className="h-full origin-left rounded-[3px] bg-petroleo transition-transform duration-700 ease-out starting:scale-x-0"
            style={{ width: `${Math.max(4, nivel)}%` }}
          />
        </div>
        <span className="text-[13px] leading-[18px] text-secundario">Mojada</span>
      </div>
    </TarjetaDato>
  );
}

/* 6 · Este año vs. lo normal */
export function TarjetaVsNormal({ datos }: { datos: RespuestaVsNormal }) {
  const max = Math.max(datos.lluvia_mm, datos.lluvia_normal_mm, 1);
  const barras = [
    { etiqueta: "Este año", valor: datos.lluvia_mm, color: "bg-petroleo" },
    { etiqueta: "Otros años", valor: datos.lluvia_normal_mm, color: "bg-borde-fuerte" },
  ];
  return (
    <TarjetaDato
      icono="comparar"
      pregunta={`¿Cómo ${datos.mes === new Date().getMonth() + 1 ? "va" : "fue"} ${nombreMes(datos.mes)} comparado con otros años?`}
      respuesta={fraseVsNormal(datos)}
      tono={datos.lluvia === "normal" ? "neutral" : "ambar"}
      datos={[
        { etiqueta: "Días comparados", valor: `${datos.desde} a ${datos.hasta}` },
        { etiqueta: "Lluvia medida", valor: `${datos.lluvia_mm} mm` },
        { etiqueta: "Lluvia normal", valor: `${datos.lluvia_normal_mm} mm` },
        { etiqueta: "Temperatura media", valor: `${datos.temp_media} °C` },
        { etiqueta: "Temperatura normal", valor: `${datos.temp_normal} °C` },
      ]}
      fuente={datos.fuente}
    >
      <p className="mb-2 text-[13px] leading-[18px] text-secundario">
        Lluvia del {diaDelMes(datos.desde)} al {fechaCorta(datos.hasta)}:
      </p>
      <div className="flex flex-col gap-2">
        {barras.map((b) => (
          <div key={b.etiqueta} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[13px] leading-[18px] text-secundario">{b.etiqueta}</span>
            <div className="h-4 flex-1 rounded-[3px] bg-arena">
              <div
                className={`h-full origin-left rounded-[3px] ${b.color} transition-transform duration-700 ease-out starting:scale-x-0`}
                style={{ width: `${Math.max(3, (b.valor / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </TarjetaDato>
  );
}
