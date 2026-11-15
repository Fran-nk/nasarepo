/**
 * Todos los textos de la interfaz en un solo lugar (español sencillo).
 * Para traducir (por ejemplo, a quechua) se reemplaza este archivo.
 */
import type {
  Categoria,
  Cielo,
  EfectoZonaNino,
  MotivoRecomendacion,
  MotivoSemaforo,
  Rareza,
  TipoAlerta,
  ZonaPulgarVidal,
} from "@/lib/contratos/tipos";

export const APP_NOMBRE = "Semilla Siguiente";

export const NAV = {
  chacra: "Mi chacra",
  clima: "Clima",
  semillas: "Semillas",
  calendario: "Calendario",
};

export const MODO = {
  sencillo: "Sencillo",
  avanzado: "Avanzado",
  verDatos: "Ver datos",
  fuente: "Fuente",
};

export const ZONAS: Record<ZonaPulgarVidal, { nombre: string; descripcion: string }> = {
  chala: { nombre: "Chala (costa)", descripcion: "Costa cálida y seca, cerca del mar." },
  yunga_maritima: { nombre: "Yunga", descripcion: "Valles cálidos de la vertiente del Pacífico." },
  quechua: { nombre: "Quechua", descripcion: "Valles templados de la sierra." },
  suni: { nombre: "Suni (jalca)", descripcion: "Tierras altas y frías, con heladas." },
  puna: { nombre: "Puna", descripcion: "Altiplano muy frío; pastos y pocos cultivos." },
  janca: { nombre: "Janca (cordillera)", descripcion: "Nieves y roca; casi no se cultiva." },
  yunga_fluvial: { nombre: "Yunga fluvial", descripcion: "Valles templados hacia la selva." },
  rupa_rupa: { nombre: "Rupa Rupa (selva alta)", descripcion: "Selva alta, lluviosa y cálida." },
  omagua: { nombre: "Omagua (selva baja)", descripcion: "Llano amazónico, muy cálido y húmedo." },
};

export const CIELO: Record<Cielo, { emoji: string; nombre: string }> = {
  sol: { emoji: "☀️", nombre: "Sol" },
  nubes: { emoji: "⛅", nombre: "Nublado" },
  lluvia: { emoji: "🌧️", nombre: "Lluvia" },
  tormenta: { emoji: "⛈️", nombre: "Lluvia fuerte" },
};

export const ALERTAS: Record<TipoAlerta, { emoji: string; nombre: string; queHacer: string }> = {
  helada: {
    emoji: "🥶",
    nombre: "Puede helar",
    queHacer: "Cubre tus plantas al atardecer y riega un poco antes de la noche.",
  },
  granizo: {
    emoji: "🧊",
    nombre: "Puede granizar",
    queHacer: "Si puedes, cubre los almácigos. No siembres esos días.",
  },
  sequia: {
    emoji: "🏜️",
    nombre: "Pocos días de lluvia",
    queHacer: "Guarda agua y riega temprano o al atardecer.",
  },
  calor: {
    emoji: "🥵",
    nombre: "Calor fuerte",
    queHacer: "Riega temprano y protege a tus animales del sol.",
  },
  lluvia_fuerte: {
    emoji: "🌊",
    nombre: "Lluvia muy fuerte",
    queHacer: "Limpia canales y zanjas para que el agua corra.",
  },
  huaico: {
    emoji: "⛰️",
    nombre: "Riesgo de huaico",
    queHacer: "Aléjate de quebradas y cauces de río. Ten lista una salida segura.",
  },
};

export const ESTADO_NINO = {
  no_activo: { nombre: "Sin El Niño", emoji: "🟢" },
  vigilancia: { nombre: "En vigilancia", emoji: "🟡" },
  alerta: { nombre: "En alerta", emoji: "🔴" },
} as const;

export const EFECTO_NINO: Record<EfectoZonaNino, { respuesta: string; queHacer: string }> = {
  mas_lluvia: {
    respuesta: "En tu zona puede llover más fuerte que otros años.",
    queHacer: "Limpia canales y drenes, y evita sembrar en partes bajas que se inundan.",
  },
  menos_lluvia: {
    respuesta: "En tu zona puede llover menos que otros años.",
    queHacer: "Prefiere cultivos que aguanten la sequía y guarda agua.",
  },
  mas_calor: {
    respuesta: "En tu zona puede hacer más calor que otros años.",
    queHacer: "Riega temprano y vigila plagas, que aumentan con el calor.",
  },
  sin_efecto_claro: {
    respuesta: "En tu zona no se espera un cambio grande.",
    queHacer: "Sigue atento a las noticias del SENAMHI.",
  },
};

export const SEMAFORO: Record<MotivoSemaforo, string> = {
  buena_lluvia: "Están llegando las lluvias y la tierra tiene humedad.",
  riesgo_helada: "Vienen noches con helada: las plantas recién nacidas pueden morir.",
  poca_lluvia: "Está lloviendo poco: la semilla podría no brotar.",
  mucho_calor: "Hace mucho calor: la tierra se seca rápido.",
  lluvia_excesiva: "Llueve demasiado: la semilla puede pudrirse o el agua llevarla.",
  fuera_de_temporada: "No es la época de siembra en tu zona.",
};

export const SEMAFORO_RESPUESTA = {
  verde: "Sí, es buen momento para sembrar.",
  amarillo: "Espera unos días o siembra con cuidado.",
  rojo: "No, mejor no siembres todavía.",
} as const;

export const RIEGO = {
  si: { respuesta: "Sí, riega hoy.", emoji: "🪣" },
  poco: { respuesta: "Riega solo un poco.", emoji: "💧" },
  no: { respuesta: "No hace falta regar.", emoji: "🌧️" },
} as const;

export const MOTIVOS: Record<MotivoRecomendacion, string> = {
  clima_ideal: "El clima de tu zona le queda bien.",
  rota_bien: "Va bien después de lo que sembraste antes.",
  fija_nitrogeno: "Mejora tu tierra: le devuelve abono natural.",
  comun_en_zona: "Se siembra mucho en tu zona.",
  aguanta_helada: "Aguanta las heladas.",
  aguanta_sequia: "Aguanta si llueve poco.",
  aprovecha_lluvias: "Aprovecha las lluvias que vienen.",
  ciclo_corto: "Se cosecha rápido.",
  especie_en_rescate: "Es una planta nativa que estamos rescatando.",
};

export const CATEGORIAS: Record<Categoria, { nombre: string; color: string }> = {
  cereal: { nombre: "Cereal", color: "bg-amber-100 text-amber-900" },
  pseudocereal: { nombre: "Grano andino", color: "bg-orange-100 text-orange-900" },
  leguminosa: { nombre: "Menestra", color: "bg-lime-100 text-lime-900" },
  tuberculo: { nombre: "Tubérculo", color: "bg-yellow-100 text-yellow-900" },
  hortaliza: { nombre: "Hortaliza", color: "bg-red-100 text-red-900" },
  frutal: { nombre: "Frutal", color: "bg-pink-100 text-pink-900" },
  agroforestal: { nombre: "Árbol / chacra con árboles", color: "bg-emerald-100 text-emerald-900" },
};

export const RAREZA: Record<Rareza, { nombre: string; color: string }> = {
  comun: { nombre: "Común", color: "bg-stone-200 text-stone-800" },
  rara: { nombre: "Rara", color: "bg-sky-100 text-sky-900" },
  en_rescate: { nombre: "⭐ En rescate", color: "bg-violet-600 text-white" },
};

export const STATS = {
  agua: { nombre: "Agua que necesita", emoji: "💧" },
  frio: { nombre: "Aguanta el frío", emoji: "❄️" },
  calor: { nombre: "Aguanta el calor", emoji: "🔥" },
};

export const ACTIVIDADES = {
  sembre: { nombre: "Sembré", emoji: "🌱" },
  regue: { nombre: "Regué", emoji: "💧" },
  abone: { nombre: "Aboné", emoji: "🌿" },
  queme: { nombre: "Quemé rastrojo", emoji: "🔥" },
  coseche: { nombre: "Coseché", emoji: "🧺" },
  otra: { nombre: "Otra cosa", emoji: "✏️" },
} as const;

export const HISTORIAL_ETIQUETAS = [
  "Lo último que sembré",
  "Antes de eso",
  "Hace más tiempo",
] as const;
