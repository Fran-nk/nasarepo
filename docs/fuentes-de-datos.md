# Fuentes de datos

Todo lo que se muestra en la app sale de fuentes **reales, públicas y gratuitas**. Ninguna pide clave, salvo Mapbox, que ya se usa para el mapa. El celular pide los datos directamente, porque las tres fuentes permiten pedidos desde el navegador (CORS), así que no hace falta servidor.

| Fuente | Qué da | Por qué |
|---|---|---|
| **NASA POWER** (power.larc.nasa.gov, reanálisis MERRA-2) | Promedio de cada mes (2001–2025), días medidos (lluvia, temperatura, humedad del suelo) y temperatura del mar frente al Perú | Fuente principal. Clima y suelo de la NASA en cualquier punto del Perú |
| **Open-Meteo** (open-meteo.com) | Pronóstico de 7 días y altura del terreno (modelo de 90 m) | La NASA no publica un pronóstico por punto |
| **Mapbox** | Nombre del lugar | Es el mismo servicio y el mismo token del mapa |
| **FAO ECOCROP** (vía el paquete de R [Recocrop](https://github.com/cropmodels/Recocrop)) | Rangos reales de cada semilla: temperatura ideal y límites, lluvia que necesita en su ciclo, frío que la mata, duración del ciclo y pH | Es la base de la FAO que pide `docs/plan-modelo.md` para el catálogo |

El código está en `app/frontcode/lib/fuentes/` (pedidos) y `app/frontcode/lib/calculos/` (cuentas, con pruebas). Las pantallas llaman a `app/frontcode/lib/api/cliente.ts`.

## Dato por dato

| Lo que ve el agricultor | De dónde sale | Cómo se calcula |
|---|---|---|
| Altura del terreno | Open-Meteo `elevation`. Si no responde, la de la celda de NASA POWER | Directo |
| Zona Pulgar Vidal | Altura + lado de los Andes | `calculos/zona.ts`. Debajo de 2,300 m se usa una línea aproximada de la divisoria de aguas para separar costa (Chala, Yunga) de selva (Omagua, Rupa Rupa, Yunga fluvial) |
| Lugar | Mapbox, búsqueda inversa | Sin token se muestran las coordenadas |
| Cultivos comunes de la zona | Catálogo + altura | Semillas cuyo rango de altura incluye el terreno; primero las comunes |
| Lluvia de la semana | Open-Meteo | Cielo según el código de tiempo de la OMM y los mm del día |
| Alertas | Open-Meteo + humedad del suelo de NASA POWER | Helada: mínima ≤ 0 °C (peligro ≤ −3). Lluvia fuerte: ≥ 20 mm/día (peligro ≥ 40). Calor: máxima ≥ 36 °C (peligro ≥ 38). Granizo: solo si el pronóstico lo trae (códigos 96 y 99). Sequía: tierra 0.15 más seca que lo normal del mes (peligro 0.25) y menos de 5 mm en la semana |
| ¿Riego hoy? | Humedad del suelo NASA POWER (`GWETROOT`, último día medido) + lluvia de 3 días de Open-Meteo | `no` si llueven ≥ 10 mm o la humedad es ≥ 0.65; `poco` si llueven ≥ 4 mm o la humedad es ≥ 0.45; si no, `si` |
| Semáforo de siembra | Open-Meteo + NASA POWER | Rojo: helada fuerte, lluvia excesiva o calor extremo en la semana. Amarillo: en la sierra, fuera de la temporada de lluvias (este mes y el siguiente con < 20 mm normales); helada leve; poca lluvia con tierra seca. Verde en otro caso |
| Este año vs. lo normal | NASA POWER, días medidos + promedio del mes | Se comparan los días medidos del mes (o del mes anterior completo si van menos de 7 días) contra lo normal **de esos mismos días** |
| El Niño | NASA POWER: temperatura del mar (`TS`) en 4 puntos de la zona Niño 1+2 | Diferencia con lo normal: promedio de 3 meses → `alerta`; solo el último mes → `vigilancia`. Umbrales tipo ICEN, el índice costero del ENFEN; falta confirmarlos contra su nota técnica (cálido ≥ 0.4 / 1.0 / 1.7 / 3.0 °C; frío ≤ −1.0 / −1.2 / −1.4 °C). Con datos pasados da −1.2 °C en noviembre 2022 (La Niña) y +3.2 °C en junio 2023 (El Niño costero). **Es una estimación**: la tarjeta lo dice y enlaza al aviso oficial del ENFEN. Efecto en la zona: solo en la costa (norte, más lluvia; resto, más calor); en la sierra y la selva, "sin efecto claro" |
| Qué sembrar | **El modelo de red neuronal del backend** (`POST /api/v1/contexto`): su punto de referencia más cercano (a menos de 30 km; clima NASA POWER histórico, pH y altura del dataset del equipo) + catálogo + historial. Respaldo: reglas en el celular | Primero el modelo. Si no puede responder (sin señal, a más de 30 km de un punto de referencia, o un cultivo del historial que no conoce), se calculan en `calculos/recomendar.ts` con el clima real de NASA POWER: noche más fría (`T2M_MIN`) y temperatura media durante los meses del cultivo contra el aguante de la semilla, lluvia contra lo que necesita, altura, rotación y un poco a favor de lo común en la zona, lo que el agricultor ya tiene y las especies en rescate. El modelo no da el porqué: los motivos de cada semilla (rotación, zona, abono natural, ciclo corto, rescate) se sacan del catálogo. La pantalla muestra los avisos del modelo (contexto aproximado, modelo provisional) |

### Ajustes a los datos de NASA POWER

- **Días sin procesar:** los últimos ~3 días llegan como `-999`. Se descartan y se usa el último día válido, que se muestra con su fecha.
- **Temperatura por altura:** POWER da la temperatura de una celda de ~50 km con su propia altura (en Cusco, la celda está a 3,740 m y la ciudad a 3,350 m). Se ajusta 6.5 °C por cada 1,000 m de diferencia, con un tope de ±5 °C porque la celda mezcla valle y cerro.
- **`T2M_MAX` no se usa:** en la climatología es el día más caliente del mes, no el promedio de las máximas.

## Catálogo de semillas

El backend lo sirve en `GET /api/v1/semillas` (`app/back/semillas.ts`). Une dos partes:

- **Datos de la FAO** (`app/back/datos/ecocrop.json`) para **29 de las 32** especies: temperatura ideal y límites, lluvia durante el ciclo, frío que la mata, ciclo (rango entre variedades) y pH. Los extrae `scripts/ecocrop/extraer_ecocrop.py` de `ecocrop.rds` (Recocrop); la tabla del script dice qué entrada de ECOCROP corresponde a cada semilla (por ejemplo, ají = *Capsicum baccatum* var. *pendulum*; yacón y tomate, con sus nombres científicos antiguos). Se ven en la ficha de cada semilla, en "Lo que necesita (datos de la FAO)".
- **Ficha del equipo** (`app/frontcode/datos/semillas.json`): nombres locales, altura donde crece, aguante 0–5, rotación, usos y cómo guardar la semilla. ECOCROP no tiene altura ni rotación.
- **Sacha inchi, choloque y camu camu** no están en ECOCROP: su ficha es solo la del equipo, y la app lo dice.

Si el backend no responde, el celular arma el mismo catálogo con la misma función.

**Las reglas de respaldo usan el aguante 0–5 de la ficha**, no los rangos de la FAO. Se probó usar los rangos de temperatura de ECOCROP sin ajustar y empeoró en la sierra: en Cusco dejaba fuera a la haba (ECOCROP pone su temperatura ideal desde 18 °C, propio de variedades de clima templado). Por eso el catálogo del modelo (`app/back/datos/catalogo_cultivos.json`) ajusta esos rangos para variedades andinas, con su fuente, pendiente de revisión del mentor.

## Lo que no sale de una API

- **Granizo:** Open-Meteo solo pronostica granizo (códigos 96 y 99) en algunas regiones; en el Perú casi nunca aparecerá.
- **Huaico:** no se calcula. Depende de la pendiente y del cauce, que estos datos no tienen.

## Pruebas

```bash
corepack pnpm test
```

Las pruebas no salen a internet. Usan respuestas reales guardadas en `app/frontcode/lib/fuentes/ejemplos/` (NASA POWER y Open-Meteo para Cusco, noviembre 2026).
