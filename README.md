# Semilla Siguiente

App para agricultores del Perú: **qué sembrar ahora en tu chacra**, con datos de la NASA explicados en palabras sencillas.

Esta parte es el **frontend** (Next.js 16 + Tailwind 4), con un diseño súper simple pensado para ver los datos en pantalla. Todos los datos son **reales y gratuitos**: clima, suelo y mar de **NASA POWER**, y el pronóstico de 7 días de **Open-Meteo**, porque la NASA no da pronóstico. El detalle está en [fuentes de datos](docs/fuentes-de-datos.md). El backend puede tomar partes siguiendo el [contrato de datos](docs/contrato-datos.md).

## Pantallas

- **🏡 Mi chacra:** mapa Mapbox para dibujar el terreno o usar la ubicación actual; zona Pulgar Vidal y altitud; los 3 últimos cultivos (buscador que entiende "oyuco", "abas", "chocho"…) y el botón "¿Qué siembro ahora?".
- **🌦️ Clima:**
  - alertas de peligro (helada, sequía, calor, lluvia fuerte; granizo solo si el pronóstico lo trae);
  - **El Niño hoy** (estimado con la temperatura del mar de la NASA, con enlace al aviso oficial del ENFEN, y su efecto en tu zona);
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

Abre http://localhost:3000. Mientras no marques un cultivo, la app muestra el clima real de un lugar de ejemplo (Cusco, Piura o Puno), que se elige en **Mi Perfil**.

Pruebas unitarias (no salen a internet):

```bash
corepack pnpm test
```

## Documentos

- [docs/fuentes-de-datos.md](docs/fuentes-de-datos.md): de dónde sale cada dato y cómo se calcula.
- [docs/contrato-datos.md](docs/contrato-datos.md): formatos de cada respuesta (para el backend).
- [docs/plan-modelo.md](docs/plan-modelo.md): variables, capas de datos y red neuronal acordadas.

## Estructura

```
app/                 rutas de las pantallas (page.tsx, perfil, semillas…)
app/frontcode/components/ tarjetas, mapa, semillero y calendario
app/frontcode/lib/       cliente, fuentes (NASA POWER, Open-Meteo), cálculos, contratos, textos, búsqueda e IndexedDB
app/frontcode/datos/     catálogo de semillas (curado por el equipo)
app/api/             rutas HTTP del backend
app/back/            lógica de servidor y modelo
```
