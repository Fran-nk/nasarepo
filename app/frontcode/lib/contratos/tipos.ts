/**
 * CONTRATO DE DATOS entre el frontend y el backend.
 * Cada tipo `Respuesta*` es exactamente lo que devuelve un endpoint.
 * Documentación para el equipo de backend: docs/contrato-datos.md
 *
 * Regla: el backend envía VALORES y CATEGORÍAS (enums). El frontend
 * convierte las categorías en frases sencillas (lib/mensajes.ts).
 */

/** Regiones naturales de Pulgar Vidal (Yunga separada por vertiente). */
export type ZonaPulgarVidal =
  | "chala"
  | "yunga_maritima"
  | "quechua"
  | "suni"
  | "puna"
  | "janca"
  | "yunga_fluvial"
  | "rupa_rupa"
  | "omagua";

/** GET /contexto?lat&lon */
export interface RespuestaContexto {
  lugar: string; // "Chinchero, Urubamba, Cusco"
  altitud_m: number;
  zona: ZonaPulgarVidal;
  cultivos_comunes: string[]; // ids de Semilla que se siembran en la zona (RF 6)
}

export type Cielo = "sol" | "nubes" | "lluvia" | "tormenta";

export interface DiaClima {
  fecha: string; // YYYY-MM-DD
  cielo: Cielo;
  lluvia_mm: number;
  prob_lluvia: number; // 0–1
  tmin: number; // °C
  tmax: number; // °C
}

/** GET /clima/semana?lat&lon — 7 días desde hoy */
export interface RespuestaSemana {
  dias: DiaClima[];
  fuente: string; // "Open-Meteo (pronóstico)"
}

export type TipoAlerta =
  | "helada"
  | "granizo"
  | "sequia"
  | "calor"
  | "lluvia_fuerte"
  | "huaico";

export interface Alerta {
  tipo: TipoAlerta;
  nivel: "atencion" | "peligro";
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
}

/** GET /clima/alertas?lat&lon — lista vacía si no hay alertas */
export interface RespuestaAlertas {
  alertas: Alerta[];
  fuente: string;
}

/** GET /clima/vs-normal?lat&lon — mes actual comparado con el promedio histórico */
export interface RespuestaVsNormal {
  mes: number; // 1–12
  lluvia_mm: number; // acumulado del mes hasta hoy (o estimado del mes)
  lluvia_normal_mm: number; // promedio histórico del mes
  temp_media: number;
  temp_normal: number;
  lluvia: "mas_seco" | "normal" | "mas_lluvioso";
  temperatura: "mas_frio" | "normal" | "mas_calido";
  fuente: string; // "NASA POWER (promedio 1991–2020) + GPM IMERG"
}

export type EfectoZonaNino =
  | "mas_lluvia"
  | "menos_lluvia"
  | "mas_calor"
  | "sin_efecto_claro";

/** GET /el-nino?lat&lon — estado oficial del ENFEN + efecto esperado en la zona */
export interface RespuestaElNino {
  estado: "no_activo" | "vigilancia" | "alerta";
  fenomeno: "nino_costero" | "nina_costera";
  magnitud?: "debil" | "moderada" | "fuerte" | "extraordinaria";
  efecto_zona: EfectoZonaNino;
  comunicado: { numero: string; fecha: string; url: string };
}

export type MotivoSemaforo =
  | "buena_lluvia"
  | "riesgo_helada"
  | "poca_lluvia"
  | "mucho_calor"
  | "lluvia_excesiva"
  | "fuera_de_temporada";

/** GET /siembra/semaforo?lat&lon&mes */
export interface RespuestaSemaforo {
  color: "verde" | "amarillo" | "rojo";
  motivo: MotivoSemaforo;
}

/** GET /riego?lat&lon */
export interface RespuestaRiego {
  regar: "si" | "poco" | "no";
  humedad_suelo: number; // 0–1 (NASA SMAP / POWER GWETROOT)
  lluvia_3dias_mm: number;
  fuente: string;
}

export type MotivoRecomendacion =
  | "clima_ideal"
  | "rota_bien"
  | "fija_nitrogeno"
  | "comun_en_zona"
  | "aguanta_helada"
  | "aguanta_sequia"
  | "aprovecha_lluvias"
  | "ciclo_corto"
  | "especie_en_rescate";

/** POST /recomendaciones — cuerpo */
export interface PeticionRecomendaciones {
  lat: number;
  lon: number;
  mes: number; // 1–12
  /** [último, penúltimo, antepenúltimo] — null = "ninguno" */
  historial: [string | null, string | null, string | null];
  /** ids de las semillas que el agricultor tiene para sembrar ("Mis semillas"). Opcional. */
  semillas_disponibles?: string[];
}

export interface Recomendacion {
  semillaId: string;
  puntaje: number; // 0–1
  motivos: MotivoRecomendacion[];
  en_rescate: boolean;
}

/** POST /recomendaciones — respuesta, ordenada de mejor a peor */
export interface RespuestaRecomendaciones {
  recomendaciones: Recomendacion[];
  modelo: string; // "red-neuronal v1" | "reglas"
  avisos?: string[];
}

export type Categoria =
  | "cereal"
  | "pseudocereal"
  | "leguminosa"
  | "tuberculo"
  | "hortaliza"
  | "frutal"
  | "agroforestal";

export type Rareza = "comun" | "rara" | "en_rescate";

/** Una semilla del catálogo (ficha coleccionable). */
export interface Semilla {
  id: string;
  nombre: string;
  nombres_locales: string[];
  cientifico: string;
  familia: string;
  categoria: Categoria;
  rareza: Rareza;
  emoji: string;
  /** 0–5: agua que necesita, aguante al frío, aguante al calor */
  stats: { agua: number; frio: number; calor: number };
  altura_min_m: number;
  altura_max_m: number;
  ciclo_dias: number;
  perenne: boolean;
  habilidades: string[];
  despues_de_bien: string[]; // ids: va bien sembrarla después de estas
  despues_de_mal: string[]; // ids: no sembrarla después de estas
  usos: string[];
  guardar_semilla: string;
  historia_rescate?: string;
}

/** GET /semillas */
export interface RespuestaSemillas {
  semillas: Semilla[];
}
