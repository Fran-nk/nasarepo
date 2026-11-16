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
import { TarjetaDato } from "./TarjetaDato";

/* 1 · Alertas de peligro */
export function TarjetaAlertas({ datos }: { datos: RespuestaAlertas }) {
  if (datos.alertas.length === 0) {
    return (
      <TarjetaDato
        emoji="✅"
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
            emoji={info.emoji}
            pregunta={a.nivel === "peligro" ? "⚠️ ¡Peligro!" : "Atención"}
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
      emoji="🌊"
      pregunta="¿Cómo está El Niño hoy?"
      respuesta={activo ? `${fenomeno}: ${estado.nombre.toLowerCase()}.` : "No hay El Niño ni La Niña ahora."}
      detalle={activo ? efecto.respuesta : undefined}
      queHacer={activo ? efecto.queHacer : undefined}
      tono={datos.estado === "alerta" ? "rojo" : datos.estado === "vigilancia" ? "ambar" : "verde"}
      datos={[
        { etiqueta: "Estado ENFEN", valor: datos.estado },
        { etiqueta: "Fenómeno", valor: datos.fenomeno },
        ...(datos.magnitud ? [{ etiqueta: "Magnitud", valor: datos.magnitud }] : []),
        { etiqueta: "Efecto en la zona", valor: datos.efecto_zona },
      ]}
      fuente={`ENFEN, comunicado oficial N° ${datos.comunicado.numero}`}
    >
      <p className="text-base text-secundario">
        {estado.emoji} Aviso oficial del ENFEN del {fechaCorta(datos.comunicado.fecha)}.{" "}
        <a href={datos.comunicado.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-tinta underline">
          Ver aviso
        </a>
      </p>
    </TarjetaDato>
  );
}

/* 4 · Semáforo de siembra */
export function TarjetaSemaforo({ datos }: { datos: RespuestaSemaforo }) {
  const luces = ["rojo", "amarillo", "verde"] as const;
  const color = { rojo: "bg-red-600", amarillo: "bg-amber-400", verde: "bg-bosque" };
  return (
    <TarjetaDato
      emoji="🚦"
      pregunta="¿Es buen momento para sembrar?"
      respuesta={SEMAFORO_RESPUESTA[datos.color]}
      detalle={SEMAFORO[datos.motivo]}
      tono={datos.color === "verde" ? "verde" : datos.color === "amarillo" ? "ambar" : "rojo"}
      datos={[
        { etiqueta: "Color", valor: datos.color },
        { etiqueta: "Motivo", valor: datos.motivo },
      ]}
      fuente="Modelo de siembra con NASA POWER + pronóstico"
    >
      <div className="flex justify-center gap-3 rounded-[20px] bg-stone-800 p-3" aria-hidden>
        {luces.map((l) => (
          <span key={l} className={`h-10 w-10 rounded-full ${datos.color === l ? color[l] : "bg-stone-600 opacity-40"}`} />
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
      emoji={info.emoji}
      pregunta="¿Riego hoy?"
      respuesta={info.respuesta}
      detalle={fraseRiego(datos, semana?.dias)}
      tono={datos.regar === "si" ? "ambar" : datos.regar === "poco" ? "neutral" : "verde"}
      datos={[
        { etiqueta: "Humedad del suelo", valor: `${nivel}%` },
        { etiqueta: "Lluvia próximos 3 días", valor: `${datos.lluvia_3dias_mm} mm` },
      ]}
      fuente={datos.fuente}
    >
      <div className="flex items-center gap-3">
        <span className="text-base text-secundario">Tierra seca</span>
        <div className="h-5 flex-1 overflow-hidden rounded-full bg-amber-100" role="img" aria-label="Humedad de la tierra">
          <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(4, nivel)}%` }} />
        </div>
        <span className="text-base text-secundario">Mojada</span>
      </div>
    </TarjetaDato>
  );
}

/* 6 · Este año vs. lo normal */
export function TarjetaVsNormal({ datos }: { datos: RespuestaVsNormal }) {
  const max = Math.max(datos.lluvia_mm, datos.lluvia_normal_mm, 1);
  const barras = [
    { etiqueta: "Este año", valor: datos.lluvia_mm, color: "bg-sky-600" },
    { etiqueta: "Otros años", valor: datos.lluvia_normal_mm, color: "bg-stone-400" },
  ];
  return (
    <TarjetaDato
      emoji="📊"
      pregunta={`¿Cómo va ${nombreMes(datos.mes)} comparado con otros años?`}
      respuesta={fraseVsNormal(datos)}
      tono={datos.lluvia === "normal" ? "neutral" : "ambar"}
      datos={[
        { etiqueta: "Lluvia este mes", valor: `${datos.lluvia_mm} mm` },
        { etiqueta: "Lluvia normal", valor: `${datos.lluvia_normal_mm} mm` },
        { etiqueta: "Temperatura media", valor: `${datos.temp_media} °C` },
        { etiqueta: "Temperatura normal", valor: `${datos.temp_normal} °C` },
      ]}
      fuente={datos.fuente}
    >
      <p className="mb-2 text-base text-secundario">Lluvia del mes:</p>
      <div className="flex flex-col gap-2">
        {barras.map((b) => (
          <div key={b.etiqueta} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-base text-secundario">{b.etiqueta}</span>
            <div className="h-6 flex-1 rounded-full bg-arena/60">
              <div className={`h-full rounded-full ${b.color}`} style={{ width: `${Math.max(3, (b.valor / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </TarjetaDato>
  );
}
