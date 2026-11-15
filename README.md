# Semilla Siguiente

App para agricultores del Perú: **qué sembrar ahora en tu chacra**, con datos de la NASA explicados en palabras sencillas.

Esta parte es el **frontend** (Next.js 16 + Tailwind 4), con un diseño súper simple pensado para ver los datos en pantalla. Por ahora funciona con **datos de prueba**. El backend se conecta después siguiendo el [contrato de datos](docs/contrato-datos.md).

## Pantallas

- **🏡 Mi chacra:** mapa Mapbox para dibujar el terreno o usar la ubicación actual; zona Pulgar Vidal y altitud; los 3 últimos cultivos (buscador que entiende "oyuco", "abas", "chocho"…) y el botón "¿Qué siembro ahora?".
- **🌦️ Clima:**
  - alertas de peligro (helada, granizo, sequía, calor, lluvia fuerte, huaico);
  - **El Niño hoy** (estado del ENFEN y su efecto en tu zona);
  - lluvia de la semana;
  - semáforo de siembra;
  - ¿Riego hoy?;
  - este año comparado con lo normal.
- **🌱 Semillas:** el Semillero, con fichas coleccionables (agua, frío y calor, habilidades, rotación, usos y cómo guardar la semilla) y pestañas Mis semillas, Para mí, Todas y ⭐ En rescate.
- **📅 Calendario:** siembra, crecimiento y cosecha de cada cultivo, más las actividades anotadas (riego, abono, quema, cosecha).
- **Interfaz en dos niveles:** **Sencillo** (frases y qué hacer) y **Avanzado** ("Ver datos", con números y fuente). Cada tarjeta tiene 🔊 para escucharla.

Los datos del agricultor (terreno, historial, mis semillas, actividades) se guardan **solo en su celular** (IndexedDB).

## Cómo correrlo

```bash
corepack pnpm install
```

```bash
cp .env.example .env.local
```

En `.env.local` pon tu token público de Mapbox en `NEXT_PUBLIC_MAPBOX_TOKEN`. Sin token, la app funciona igual pero muestra un aviso en lugar del mapa.

```bash
corepack pnpm dev
```

Abre http://localhost:3000. Con el menú ⚙️ del encabezado cambias entre los 3 escenarios de demostración:
- Cusco (Quechua);
- Piura con El Niño;
- Puno con helada.

```bash
corepack pnpm test
```

## Documentos

- [docs/contrato-datos.md](docs/contrato-datos.md): endpoints y formatos que debe entregar el backend.
- [docs/plan-modelo.md](docs/plan-modelo.md): variables, capas de datos y red neuronal acordadas.

## Estructura

```
app/                 pantallas (Mi chacra, clima, semillas, calendario, recomendaciones)
components/          tarjetas, mapa, semillero, calendario
lib/contratos/       tipos del contrato con el backend
lib/api/cliente.ts   datos de prueba o backend real (NEXT_PUBLIC_USE_MOCKS)
lib/textos.ts        todos los textos de la interfaz (para traducir)
lib/mensajes.ts      convierte datos en frases sencillas
lib/busqueda/        búsqueda fonética (Y/LL/I, H muda, B/V, S/C/Z…)
lib/almacen.ts       datos del agricultor en IndexedDB (Dexie)
mocks/               escenarios de prueba y catálogo de 32 semillas
```
