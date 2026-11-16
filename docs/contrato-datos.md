# Contrato de datos frontend ↔ backend

Este documento es para quien construye el backend. El frontend ya funciona con **datos de prueba** que siguen este contrato al pie de la letra. Cuando el backend esté listo:

```bash
# .env.local
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_API_URL=https://tu-backend.example.com
```

- **Tipos exactos (fuente de verdad):** [`app/frontcode/lib/contratos/tipos.ts`](../app/frontcode/lib/contratos/tipos.ts)
- **Ejemplos reales de respuesta:** [`app/frontcode/mocks/escenarios/`](../app/frontcode/mocks/escenarios). Cada clave del archivo es la respuesta de un endpoint. En los mocks, `"D+3"` significa "hoy + 3 días"; el backend debe enviar fechas reales `YYYY-MM-DD`.
- **Catálogo de semillas de ejemplo:** [`app/frontcode/mocks/semillas.json`](../app/frontcode/mocks/semillas.json)
- **Cliente que consume la API:** [`app/frontcode/lib/api/cliente.ts`](../app/frontcode/lib/api/cliente.ts)

## Reglas generales

1. **Envía valores y categorías, no frases.** Por ejemplo `"regar": "poco"`, no "Riega un poco hoy". El frontend arma las frases sencillas para el agricultor (`lib/mensajes.ts`), así el tono es el mismo en toda la app.
2. Todas las rutas `GET` reciben `lat` y `lon` en grados decimales (WGS84). Si el agricultor dibujó un polígono, se envía su centroide.
3. Fechas en `YYYY-MM-DD`, temperaturas en °C, lluvia en mm y fracciones entre 0 y 1.
4. Cada respuesta de clima incluye `fuente` (texto corto), que se muestra en el modo **Avanzado**.
5. Habilita CORS para el dominio del frontend.

## Endpoints

| Método y ruta | Clave en el mock | Tipo de respuesta | Para qué se usa |
|---|---|---|---|
| `GET /contexto?lat&lon` | `contexto` | `RespuestaContexto` | Lugar, altitud, zona Pulgar Vidal y cultivos comunes de la zona (RF 6) |
| `GET /clima/semana?lat&lon` | `semana` | `RespuestaSemana` | "¿Llueve esta semana?" (7 días desde hoy) |
| `GET /clima/alertas?lat&lon` | `alertas` | `RespuestaAlertas` | Helada, granizo, sequía, calor, lluvia fuerte y huaico |
| `GET /clima/vs-normal?lat&lon` | `vsNormal` | `RespuestaVsNormal` | "Este año vs. lo normal" (mes actual contra el promedio histórico de NASA POWER) |
| `GET /el-nino?lat&lon` | `elNino` | `RespuestaElNino` | Estado oficial del ENFEN y efecto esperado en la zona |
| `GET /siembra/semaforo?lat&lon&mes` | `semaforo` | `RespuestaSemaforo` | Semáforo "¿Es buen momento para sembrar?" |
| `GET /riego?lat&lon` | `riego` | `RespuestaRiego` | "¿Riego hoy?" (humedad del suelo SMAP/POWER y lluvia de los próximos 3 días) |
| `POST /recomendaciones` | `recomendaciones` | `RespuestaRecomendaciones` | Qué sembrar ahora: salida de la red neuronal (RF 7, RF 13) |
| `GET /semillas` | — (`mocks/semillas.json`) | `RespuestaSemillas` | Catálogo para el Semillero y el buscador |

### `POST /recomendaciones`

Cuerpo de la petición (`PeticionRecomendaciones`):

```json
{ "lat": -13.53, "lon": -71.97, "mes": 11, "historial": ["papa", "maiz_amilaceo", null], "semillas_disponibles": ["haba", "oca"] }
```

`historial` es `[último, penúltimo, antepenúltimo]`, con ids de semilla; `null` significa "ninguno". `semillas_disponibles` (opcional) son las semillas que el agricultor tiene guardadas para sembrar: conviene darles prioridad cuando el resto de variables empata. La respuesta va ordenada de mejor a peor, y el frontend muestra las 3 primeras. Cada `motivo` (`MotivoRecomendacion`) se traduce en una frase de "por qué". Si hace falta un motivo nuevo, agrégalo al tipo y a `lib/textos.ts`.

### Valores de las categorías

- **`zona`:** `chala`, `yunga_maritima`, `quechua`, `suni`, `puna`, `janca`, `yunga_fluvial`, `rupa_rupa`, `omagua`.
- **`cielo`:** `sol`, `nubes`, `lluvia`, `tormenta`.
- **`alerta.tipo`:** `helada`, `granizo`, `sequia`, `calor`, `lluvia_fuerte`, `huaico`.
- **`alerta.nivel`:** `atencion` (ámbar), `peligro` (rojo).
- **`vsNormal.lluvia`:** `mas_seco`, `normal`, `mas_lluvioso`.
- **`vsNormal.temperatura`:** `mas_frio`, `normal`, `mas_calido`.
- **`elNino.estado`:** `no_activo`, `vigilancia`, `alerta`. Son los mismos nombres de estado que usa el ENFEN.
- **`elNino.fenomeno`:** `nino_costero`, `nina_costera`.
- **`elNino.magnitud`** (opcional): `debil`, `moderada`, `fuerte`, `extraordinaria`.
- **`elNino.efecto_zona`:** `mas_lluvia`, `menos_lluvia`, `mas_calor`, `sin_efecto_claro`.
- **`semaforo.motivo`:** `buena_lluvia`, `riesgo_helada`, `poca_lluvia`, `mucho_calor`, `lluvia_excesiva`, `fuera_de_temporada`.
- **`riego.regar`:** `si`, `poco`, `no`.
- **`recomendacion.motivos[]`:** `clima_ideal`, `rota_bien`, `fija_nitrogeno`, `comun_en_zona`, `aguanta_helada`, `aguanta_sequia`, `aprovecha_lluvias`, `ciclo_corto`, `especie_en_rescate`.
- **`semilla.categoria`:** `cereal`, `pseudocereal`, `leguminosa`, `tuberculo`, `hortaliza`, `frutal`, `agroforestal`.
- **`semilla.rareza`:** `comun`, `rara`, `en_rescate`.
- **`semilla.stats`:** `agua`, `frio`, `calor`, en escala de 0 a 5 (5 = necesita mucha agua o aguanta mucho frío o calor).

## Qué NO hace el backend

El frontend guarda en el celular (IndexedDB) la ubicación y el polígono de la chacra, el historial de cultivos, "mis semillas" y el registro de actividades. No hay cuentas de usuario.
