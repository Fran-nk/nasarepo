# Backend de Semilla Siguiente

Este directorio contiene la lógica de servidor. Next.js publica las rutas desde `app/api/`; cada `route.ts` debe ser una capa pequeña que llame a `app/back/`. Los componentes, utilidades y mocks del frontend están en `app/frontcode/`; las páginas permanecen en `app/` para conservar sus URL.

## Estado

- `GET /api/v1/salud`: indica si se cargaron los pesos y si el recomendador está disponible.
- `GET /api/v1/clima?latitud=-13.53&longitud=-71.97&dias=7`: climatología mensual NASA POWER (2002–2025) y pronóstico Open-Meteo. Si una fuente falla, su bloque es `null` y se informa en `avisos`.
- `POST /api/v1/contexto`: devuelve hasta cinco recomendaciones del MLP usando el punto de referencia más cercano del dataset curado, a una distancia máxima de 30 km. La respuesta muestra coordenadas y distancia de referencia y advierte que altitud, clima y suelo son aproximados. Más allá del límite responde `503`. El bloque `clima` proporcionado por el cliente todavía no se admite: responde `400` para no ignorarlo silenciosamente.
- `app/back/modelo/mlp.ts`: inferencia ligera de un MLP entrenado en Keras/TensorFlow. No instala TensorFlow completo en Vercel. El entrenamiento y la exportación ocurren fuera del despliegue.

La especificación del producto está en `../../../API_BACKEND.md` (en el directorio de trabajo compartido). El cliente de contexto y recomendaciones consume `POST /api/v1/contexto`; las demás pantallas aún usan el contrato de demostración en `docs/contrato-datos.md`.

## Incorporar el modelo

Los pesos `modelo.json`, la especificación definitiva `feature-spec.json` y los casos de referencia del equipo están en `app/back/modelo/artefactos/`. Son un MLP 106 → 64 → 32 → 1 que se ejecuta directamente en TypeScript sin TensorFlow completo. La especificación contiene el orden, medias y escalas del entrenamiento; el archivo `DataSources/feature-spec.json` original es provisional y no debe usarse en inferencia. Los casos de referencia verifican la equivalencia con Keras.

El evaluador valida dimensiones y valores finitos y ofrece `puntuar(vector)` con un vector ya normalizado. `normalizarVariables` usa la especificación definitiva y rechaza variables faltantes. El contexto se obtiene de `datos/contexto_puntos.json`, no de una medición en vivo de la parcela. Su clasificación por vertiente, pH, clima y reglas provienen del conjunto de entrenamiento y requieren validación agronómica. El modelo se incluye en el paquete de la función, sin descargas en cada petición.

El frontend usa el contexto y las recomendaciones reales por defecto. `NEXT_PUBLIC_USE_MOCKS_MODELO=true` activa la demostración de esas dos consultas. Mantener `NEXT_PUBLIC_API_URL` vacío cuando Next.js sirva la API en el mismo origen. Las demás rutas de clima y alertas del contrato antiguo siguen pendientes y usan mocks con `NEXT_PUBLIC_USE_MOCKS=true`. Los resultados del modelo son afinidades aprendidas de reglas sintéticas, no probabilidades de cosecha. `semillas_disponibles` todavía no se aplica al ranking real.

## Propuesta para preparación de datos con Python (pendiente de aprobación)

En Colab, descargar Recocrop y leer `ecocrop.rds` con `pyreadr`; seleccionar especies, conservar unidades y fuentes y exportar JSON versionado para `app/back/datos/`. Curar las especies faltantes y validar las reglas con el mentor. Generar ejemplos reproducibles de contexto/candidato, separar entrenamiento y evaluación por zonas geográficas, entrenar el MLP con Keras y exportar matrices y sesgos a `modelo.json`, junto con un `feature-spec.json` que defina orden y normalización. Verificar las mismas entradas en Keras y TypeScript antes de publicar. El entrenamiento y la extracción serían operaciones fuera de Vercel; la API seguiría en Next.js. No se han creado estos scripts ni datos.

Pendientes para completar el contrato: catálogo agronómico con rangos verificables, fronteras de Perú y divisoria andina, elevación, pH, cálculo por campaña, reglas de respaldo, integración del modelo, endpoints de especies y adaptación del cliente. La API REST de SoilGrids está suspendida; considerar sus datos descargables o servicios alternativos antes de elegir una fuente de pH. La humedad `GWETROOT` es una fracción de humedad relativa del suelo y se expresa en la API en escala 0–100; no es humedad volumétrica.

Para desarrollo: `pnpm dev`. Para verificar compilación: `pnpm build` y `pnpm lint` desde este directorio del proyecto.
