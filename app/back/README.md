# Backend de Semilla Siguiente

Este directorio contiene la lógica de servidor. Next.js publica las rutas desde `app/api/`; cada `route.ts` debe ser una capa pequeña que llame a `app/back/`. Los componentes, utilidades y mocks del frontend están en `app/front/`; sus páginas están en el grupo de rutas `app/(front)/`.

## Estado

- `GET /api/v1/salud`: disponible. Indica si se incorporó un modelo compatible.
- `GET /api/v1/clima?latitud=-13.53&longitud=-71.97&dias=7`: climatología mensual NASA POWER (2002–2025) y pronóstico Open-Meteo. Si una fuente falla, su bloque es `null` y se informa en `avisos`.
- `GET /api/v1/semillas`: catálogo de semillas. Une la ficha del equipo (`app/front/datos/semillas.json`) con los rangos reales de FAO ECOCROP (`app/back/datos/ecocrop.json`, 29 de 32 especies; lo genera `scripts/ecocrop/extraer_ecocrop.py` desde `ecocrop.rds` de Recocrop). La lógica es la función pura `catalogoSemillas()` en `semillas.ts`, que el frontend también usa si la ruta no responde.
- `POST /api/v1/contexto`: valida el cuerpo del contrato y devuelve `503 DATOS_NO_DISPONIBLES` mientras falten catálogo agronómico, fuentes geográficas/climáticas y artefacto entrenado. No devuelve recomendaciones inventadas.
- `app/back/modelo/mlp.ts`: inferencia ligera de un MLP entrenado en Keras/TensorFlow. No instala TensorFlow completo en Vercel. El entrenamiento y la exportación ocurren fuera del despliegue.

La especificación del producto está en `../../../API_BACKEND.md` (en el directorio de trabajo compartido). Hay otro contrato en `docs/contrato-datos.md` que usa rutas y tipos anteriores: el cliente actual sigue ese contrato y requerirá una adaptación antes de consumir `/api/v1/contexto`.

## Incorporar el modelo

Colocar `modelo.json` en `app/back/modelo/artefactos/`. Debe incluir `version`, `featureSpecVersion`, `inputSize`, `layers` y matrices en orden `pesos[entrada][salida]`, más `bias` por capa. Cada capa usa `relu`, excepto la última que usa `sigmoid` y tiene una salida. La normalización y el orden de las variables deben definirse en un `feature-spec.json` versionado y ser idénticos en Colab y en el backend. `modelo.json` no se genera en este repositorio: debe exportarse desde Keras con las matrices en ese orden.

El evaluador valida dimensiones y valores finitos y ofrece `puntuar(vector)`. Una vez incorporados catálogo, codificación de variables y datos de NASA/altitud/suelo, el servicio de contexto podrá puntuar cada candidato y devolver únicamente los cinco mejores. El modelo y sus archivos se leen desde el paquete de la función, sin descargas en cada petición.

## Propuesta para preparación de datos con Python (pendiente de aprobación)

**Hecho (paso 1, catálogo):** `scripts/ecocrop/extraer_ecocrop.py` lee `ecocrop.rds` con `pyreadr` y genera `app/back/datos/ecocrop.json` (29 especies del catálogo, con la equivalencia de nombres científicos en el script). Lo que sigue (ejemplos de entrenamiento, MLP, `feature-spec.json`) está pendiente. Ojo: los rangos de temperatura de ECOCROP subestiman a las variedades andinas (haba, papa); calibrarlos antes de usarlos como etiquetas.

En Colab, descargar Recocrop y leer `ecocrop.rds` con `pyreadr`; seleccionar especies, conservar unidades y fuentes y exportar JSON versionado para `app/back/datos/`. Curar las especies faltantes y validar las reglas con el mentor. Generar ejemplos reproducibles de contexto/candidato, separar entrenamiento y evaluación por zonas geográficas, entrenar el MLP con Keras y exportar matrices y sesgos a `modelo.json`, junto con un `feature-spec.json` que defina orden y normalización. Verificar las mismas entradas en Keras y TypeScript antes de publicar. El entrenamiento y la extracción serían operaciones fuera de Vercel; la API seguiría en Next.js. No se han creado estos scripts ni datos.

Pendientes para completar el contrato: catálogo agronómico con rangos verificables, fronteras de Perú y divisoria andina, elevación, pH, cálculo por campaña, reglas de respaldo, integración del modelo, endpoints de especies y adaptación del cliente. La API REST de SoilGrids está suspendida; considerar sus datos descargables o servicios alternativos antes de elegir una fuente de pH. La humedad `GWETROOT` es una fracción de humedad relativa del suelo y se expresa en la API en escala 0–100; no es humedad volumétrica.

Para desarrollo: `pnpm dev`. Para verificar compilación: `pnpm build` y `pnpm lint` desde este directorio del proyecto.
