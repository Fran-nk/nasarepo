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
} from "@/app/frontcode/lib/contratos/tipos";

export const APP_NOMBRE = "Semilla Siguiente";

export const NAV = {
  mapa: "Mi Cultivo",
  semillas: "Semillas",
  perfil: "Mi Perfil",
};

export type Region = "costa" | "sierra" | "selva";

export const REGIONES: Record<Region, string> = { costa: "Costa", sierra: "Sierra", selva: "Selva" };

export const ZONAS: Record<ZonaPulgarVidal, { nombre: string; region: Region; descripcion: string }> = {
  chala: { nombre: "Chala", region: "costa", descripcion: "Costa cálida y seca, cerca del mar." },
  yunga_maritima: { nombre: "Yunga", region: "costa", descripcion: "Valles cálidos de la vertiente del Pacífico." },
  quechua: { nombre: "Quechua", region: "sierra", descripcion: "Valles templados de la sierra." },
  suni: { nombre: "Suni", region: "sierra", descripcion: "Tierras altas y frías (jalca), con heladas." },
  puna: { nombre: "Puna", region: "sierra", descripcion: "Altiplano muy frío; pastos y pocos cultivos." },
  janca: { nombre: "Janca", region: "sierra", descripcion: "Cordillera: nieves y roca; casi no se cultiva." },
  yunga_fluvial: { nombre: "Yunga fluvial", region: "selva", descripcion: "Valles templados hacia la selva." },
  rupa_rupa: { nombre: "Rupa Rupa", region: "selva", descripcion: "Selva alta, lluviosa y cálida." },
  omagua: { nombre: "Omagua", region: "selva", descripcion: "Selva baja: llano amazónico, muy cálido y húmedo." },
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

// Colores de la guía "Territorio": arena, pradera, señal, bosque y terracota en dosis suaves.
export const CATEGORIAS: Record<Categoria, { nombre: string; color: string }> = {
  cereal: { nombre: "Cereal", color: "bg-senal/70 text-tinta" },
  pseudocereal: { nombre: "Grano andino", color: "bg-senal/40 text-tinta" },
  leguminosa: { nombre: "Menestra", color: "bg-pradera/70 text-tinta" },
  tuberculo: { nombre: "Tubérculo", color: "bg-arena text-tinta" },
  hortaliza: { nombre: "Hortaliza", color: "bg-terracota/20 text-tinta" },
  frutal: { nombre: "Frutal", color: "bg-terracota/35 text-tinta" },
  agroforestal: { nombre: "Árbol / terreno con árboles", color: "bg-bosque/30 text-tinta" },
};

export const RAREZA: Record<Rareza, { nombre: string; color: string }> = {
  comun: { nombre: "Común", color: "bg-arena text-tinta" },
  rara: { nombre: "Rara", color: "bg-petroleo/25 text-tinta" },
  en_rescate: { nombre: "⭐ En rescate", color: "bg-tinta text-senal" },
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

/** Íconos que el agricultor puede ponerle a su chacra (el primero es el de siempre). */
export const ICONOS_CHACRA = ["🏡", "🌽", "🥔", "🌾", "🫘", "🌻", "🍓", "🌳", "🐄", "🦙", "🐑", "💧"] as const;

export const HISTORIAL_ETIQUETAS = [
  "Lo último que sembré",
  "Antes de eso",
  "Hace más tiempo",
] as const;

/** Cuando algo falla: frases calmadas, sin tecnicismos, y siempre con una salida. */
export const ERRORES = {
  dato: "No llegó este dato. Revisa tu señal e intenta de nuevo.",
  clima: "No llegó el clima de la semana.",
  alertas: "No pudimos revisar si hay alertas.",
  reintentar: "Intentar de nuevo",
  mapa: "El mapa no se puede mostrar ahora. Puedes seguir usando el resto de la app.",
} as const;

/** Avisos que confirman cada acción (y permiten deshacer las que borran algo). */
export const AVISOS = {
  deshacer: "Deshacer",
  actividadGuardada: "Anotado en tu calendario",
  actividadBorrada: "Actividad borrada",
  cultivoGuardado: "Cambios guardados",
  cultivoQuitado: (nombre: string) => `Quitaste ${nombre}`,
  semillaAgregada: (nombre: string) => `${nombre} está en Mis semillas`,
  semillaQuitada: (nombre: string) => `Quitaste ${nombre} de Mis semillas`,
  sinVoz: "Este celular no puede leer en voz alta.",
} as const;

/** Sin conexión: tranquiliza y explica qué se está viendo. */
export const SIN_SENAL = {
  titulo: "Sin señal",
  texto: "Te mostramos lo último que guardamos.",
  viejo: "Dato guardado, puede no estar al día.",
} as const;

/** Quitar un cultivo: se pregunta antes y se puede deshacer. */
export const QUITAR_CULTIVO = {
  boton: "Quitar este cultivo",
  pregunta: (nombre: string) => `¿Quitar ${nombre}?`,
  explica: "Se borra su terreno y lo que sembraste antes. Tus semillas y tu calendario se quedan.",
  si: "Sí, quitar",
  no: "No, dejarlo",
} as const;
