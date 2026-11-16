/**
 * CONTRATO DE DATOS de las pantallas.
 * Hoy cada `Respuesta*` la arma lib/api/cliente.ts con datos reales de NASA POWER y Open-Meteo
 * (ver docs/fuentes-de-datos.md). Si el backend toma una parte, debe devolver lo mismo.
 *
 * Regla: los datos llegan como VALORES y CATEGORÍAS (enums). El frontend
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
  fuente: string;
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
  fuente: string; // "Pronóstico Open-Meteo"
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

/** GET /clima/vs-normal?lat&lon — días medidos del mes comparados con el promedio histórico */
export interface RespuestaVsNormal {
  mes: number; // 1–12
  desde: string; // YYYY-MM-DD, primer día medido que se compara
  hasta: string; // YYYY-MM-DD, último día medido (NASA POWER va ~3 días atrás)
  lluvia_mm: number; // acumulado de esos días
  lluvia_normal_mm: number; // lo normal para esos mismos días
  temp_media: number;
  temp_normal: number;
  lluvia: "mas_seco" | "normal" | "mas_lluvioso";
  temperatura: "mas_frio" | "normal" | "mas_calido";
  fuente: string; // "NASA POWER (medido y promedio 2001–2025)"
}

export type EfectoZonaNino =
  | "mas_lluvia"
  | "menos_lluvia"
  | "mas_calor"
  | "sin_efecto_claro";

/**
 * GET /el-nino?lat&lon — condición ESTIMADA con la temperatura del mar (zona Niño 1+2)
 * + efecto esperado en la zona. No es el aviso oficial del ENFEN: se enlaza aparte.
 */
export interface RespuestaElNino {
  estado: "no_activo" | "vigilancia" | "alerta";
  fenomeno: "nino_costero" | "nina_costera";
  magnitud?: "debil" | "moderada" | "fuerte" | "extraordinaria";
  efecto_zona: EfectoZonaNino;
  anomalia_c: number; // °C sobre lo normal, promedio de los últimos 3 meses
  anomalia_30d_c: number; // °C sobre lo normal, último mes
  hasta: string; // YYYY-MM-DD, último día medido
  /** Diferencia diaria con lo normal (promedio de los puntos), para el gráfico. */
  serie: { fecha: string; anomalia_c: number }[];
  mar_c: number; // temperatura del mar, promedio del último mes
  mar_normal_c: number; // lo normal para esos mismos días
  puntos: { lat: number; lon: number }[]; // dónde se mide el mar
  fuente: string;
  datos_url: string; // pedido exacto a NASA POWER (un punto), para ver los números
  fuente_url: string; // página de NASA POWER
  aviso_oficial_url: string; // página del ENFEN
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
  fuente: string;
}

/** GET /riego?lat&lon */
export interface RespuestaRiego {
  regar: "si" | "poco" | "no";
  humedad_suelo: number; // 0–1 (NASA POWER GWETROOT, humedad en la zona de raíces)
  humedad_fecha: string; // YYYY-MM-DD del último día medido
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
  modelo: string; // "red-neuronal v1" | "reglas con NASA POWER"
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

/**
 * Rangos agronómicos reales de la FAO (base ECOCROP, vía el paquete Recocrop) para una especie.
 * Ver app/back/datos/ecocrop.json y scripts/ecocrop/extraer_ecocrop.py.
 */
export interface ParametrosEcocrop {
  cientifico_ecocrop: string;
  nombre_ecocrop: string;
  ciclo_dias: [number, number]; // [más corto, más largo] entre variedades
  temperatura_mata_c: number; // mínima que la mata
  temperatura_c: { min: number; optima_min: number; optima_max: number; max: number }; // promedio en que crece
  lluvia_ciclo_mm: { min: number; optima_min: number; optima_max: number; max: number }; // durante el ciclo
  ph: { min: number; optimo_min: number; optimo_max: number; max: number };
}

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
  /** Datos de la FAO; no está si la especie no figura en ECOCROP (sacha inchi, choloque, camu camu). */
  ecocrop?: ParametrosEcocrop;
  /** De dónde salen los datos de esta ficha. */
  fuente?: string;
}

/** GET /api/v1/semillas */
export interface RespuestaSemillas {
  semillas: Semilla[];
  fuente?: { proveedor: string; url: string; extraido: string };
}
