# Plan del modelo (referencia para el backend)

Resumen de lo que acordó el equipo para el motor de recomendación. El frontend ya consume estas salidas a través del [contrato de datos](contrato-datos.md).

## Decisiones

| Tema | Decisión |
|---|---|
| Alcance | Todo el Perú |
| Datos del agricultor | Solo en su dispositivo (sin cuentas) |
| Entrenamiento de la red | Google Colab, con datos generados a partir de fuentes públicas + reglas agronómicas |
| Fuentes de clima | NASA POWER (historia y promedios), capas de SMAP y GPM, y Open-Meteo solo para el pronóstico de 7 a 16 días |
| Especies en rescate | Bono en el ranking + ficha de rescate + sección propia en el Semillero |

## Datos en 4 capas

1. **Catálogo de cultivos: ECOCROP (FAO).** El paquete de R `Recocrop` trae 1,710 especies en `inst/parameters/ecocrop.rds`, que se puede leer con `pyreadr`. Se filtran 60–80 especies relevantes para el Perú. Las que faltan (mashua, kiwicha, Choloque…) se completan a mano con el libro de cultivos andinos de la FAO, anotando la fuente de cada una.
2. **Zonas de Pulgar Vidal.** Se calculan con la altitud real del punto (modelo de elevación) y la vertiente:
   - **Occidente:** Chala 0–500 m, Yunga marítima 500–2,300 m.
   - **Oriente:** Omagua 80–400 m, Rupa Rupa 400–1,000 m, Yunga fluvial 1,000–2,300 m.
   - **Ambas vertientes:** Quechua 2,300–3,500 m, Suni 3,500–4,000 m, Puna 4,000–4,800 m, Janca más de 4,800 m.

   Las celdas de POWER miden unos 50 km, así que la temperatura se corrige por altitud: `T_punto = T_celda − 0.0065 × (alt_punto − alt_celda)`.
3. **Cultivos típicos por zona.** Una tabla curada a mano. El portal SIEA del MIDAGRI no tenía una descarga por distrito confirmada.
4. **Reglas de rotación por familia:**
   - no repetir la misma familia en campañas seguidas;
   - penalizar fuerte las solanáceas si hubo otra en las últimas 3 campañas;
   - dar un bono a las leguminosas después de un cereal o un tubérculo;
   - los perennes no entran en la rotación (se tratan como agroforestería).

## Variables de entrada (14)

| # | Variable | Fuente |
|---|---|---|
| 1 | Altitud | Modelo de elevación |
| 2 | Zona Pulgar Vidal (one-hot, 9 categorías) | Calculada |
| 3 | Mes de siembra (seno/coseno) | Usuario |
| 4 | Temperatura media, corregida por altitud | POWER `T2M` |
| 5 | Temperatura mínima (riesgo de helada) | POWER `T2M_MIN` |
| 6 | Temperatura máxima | POWER `T2M_MAX` |
| 7 | Lluvia esperada en la campaña | POWER `PRECTOTCORR` (climatología) |
| 8 | Humedad relativa | POWER `RH2M` |
| 9 | Radiación solar | POWER `ALLSKY_SFC_SW_DWN` |
| 10 | Humedad del suelo, zona de raíces | POWER `GWETROOT` (SMAP en el mapa) |
| 11 | pH del suelo | SoilGrids (si falla, un valor por zona) |
| 12–14 | Familia del cultivo anterior, penúltimo y antepenúltimo (one-hot + "ninguno") | Usuario |

Cada cultivo candidato aporta además **sus propios rasgos**: rangos ECOCROP, familia, ciclo y si es perenne. La red **puntúa pares (contexto, candidato)**. Así se pueden agregar especies nuevas sin reentrenar.

## Red neuronal

1. Un **puntuador por reglas** (aptitud ECOCROP × rotación × zona) genera las etiquetas. También sirve de respaldo mientras no haya red y de oráculo para las pruebas.
2. Se toma la climatología POWER de una grilla de unos 300 puntos del Perú y se generan entre 50,000 y 100,000 casos sintéticos.
3. En Colab se entrena un MLP de 2 capas ocultas (64 y 32 neuronas, ReLU) con salida sigmoide.
4. El **bono de rescate** se suma después de la red, a la vista y fácil de ajustar.
5. **Meta:** en casos que la red no vio, coincidir en el top 3 con las reglas al menos el 80% de las veces.
6. **A futuro:** reentrenar con datos reales, como la Encuesta Nacional Agropecuaria (INEI) o los registros de los agricultores.
