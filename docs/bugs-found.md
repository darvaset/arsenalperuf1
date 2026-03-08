# F1 Arsenal — Reporte de Bugs

> Última actualización: 08 Mar 2026

---

## RESUELTOS — Sesión 08 Mar 2026 (post R1 Australia)

| # | Bug | Severidad | Archivo(s) | Estado |
|---|-----|-----------|-----------|--------|
| BUG-13 | Scoring daba puntos por posición real del piloto sin respetar bloque predicho | 🔴 Crítico | `api/process-results.js`, `scripts/process-results.js`, `src/lib/supabase.js` | ✅ FIXED |
| BUG-14 | Iconos en ranking eran literalmente las letras `'X'`, `'v'`, `'x'` (strings) | 🟡 Media | `RaceDetail.jsx` (GroupRanking) | ✅ FIXED |
| BUG-15 | `Standings` y `PlayerProfile` mostraban vacío porque el JOIN con `country_flag` fallaba silenciosamente | 🔴 Alta | `Standings.jsx`, `PlayerProfile.jsx` | ✅ FIXED |
| BUG-16 | PlayerProfile de otros jugadores no mostraba datos | 🔴 Alta | `Standings.jsx` → `PlayerProfile.jsx` | ✅ FIXED |

### Detalle BUG-13 — Scoring lógica de bloques incorrecta

**Root cause:** La función `calculateScore` usaba `Set(results.slice(0,5))` para determinar si un piloto ganaba puntos base. Esto significaba que si predijiste a Hamilton en **P6** (bloque Medios = 5 pts) y él terminó en **P4** (Top5), el sistema le daba **10 pts base** en vez de **0 pts** (cruce de bloques = 0 per reglas.md CASO 3).

**Fix:** La regla correcta es: el jugador gana base points solo si el piloto termina en el **mismo bloque** que el slot donde lo predijo. Se verifica `predictedTop5 && inActualTop5` o `!predictedTop5 && inActualMid5`.

```javascript
// ❌ ANTES (incorrecto)
if (top5.has(driverId)) base = 10          // basado en dónde TERMINÓ el piloto
else if (mid5.has(driverId)) base = 5

// ✅ DESPUÉS (correcto)
const predictedTop5 = idx < 5
const inActualTop5  = actualIdx >= 0 && actualIdx < 5
const inActualMid5  = actualIdx >= 5 && actualIdx < 10
if (predictedTop5 && inActualTop5) base = 10       // mismo bloque
else if (!predictedTop5 && inActualMid5) base = 5   // mismo bloque
// cruce de bloques → base = 0
```

**⚠️ ACCIÓN REQUERIDA:** Los scores de R1 Australia fueron calculados con la lógica incorrecta. Recalcular ejecutando `npm run results 1` o Admin Panel → Procesar Round 1.

### Detalle BUG-15 — country_flag en JOIN

**Root cause:** Los queries `scores.select('*, races(..., country_flag, ...)')` fallaban silenciosamente si la columna `country_flag` no existía en la tabla `races` de producción (la columna no estaba en schema.sql original). Supabase devolvía `data: null`, el código no chequeaba el error, y las listas aparecían vacías.

**Fix:** 
1. Removido `country_flag` del JOIN — se usa `FLAG_MAP` como fallback en el cliente.
2. Creado `supabase/patches/add-country-flag.sql` para agregar la columna y popularla.
3. Agregado logging de errores: `if (scErr) console.error(...)` para detectar futuros fallos.

---

## RESUELTOS — Sesión 06 Mar 2026 (Testing inicial)

| # | Bug | Severidad | Archivo | Estado |
|---|-----|-----------|---------|--------|
| BUG-02 | Mi Prediccion mostraba error cuando no habia resultados | 🔴 Alta | RaceDetail.jsx | ✅ FIXED |
| BUG-03 | Calendario "SIGUIENTE" en vez de "EN CURSO" cuando deadline pasó | 🟡 Media | Calendar.jsx | ✅ FIXED |
| BUG-04 | Ranking mostraba "Nadie ha jugado" aunque había predicciones enviadas | 🔴 Alta | RaceDetail.jsx | ✅ FIXED |
| BUG-05 | Dashboard botón "Hacer mi prediccion" bloqueado sin navegación alternativa | 🟡 Media | Dashboard.jsx | ✅ FIXED |
| BUG-06 | R1-R4 mostrando EN CURSO (fechas falsas del seed) | 🔴 Alta | seed-races.js re-run | ✅ FIXED |
| BUG-07 | api/process-results usaba nombres de env vars incorrectos | 🔴 Alta | api/process-results.js | ✅ FIXED |
| BUG-08 | SPA refresh 404 en /profile, /race/:id, etc | 🔴 Alta | vercel.json rewrites | ✅ FIXED |
| BUG-09 | Modal picker fondo transparente (se veía la lista debajo) | 🟡 Media | Predict.jsx | ✅ FIXED |
| BUG-10 | Dashboard mostraba email prefix en vez de username | 🟡 Media | Dashboard.jsx | ✅ FIXED |
| BUG-11 | Ranking mostraba "Jugador" para players sin username custom | 🟡 Media | RaceDetail.jsx | ✅ FIXED |
| BUG-12 | country_flag faltaba en headers/listas de carreras | 🟢 Baja | RaceDetail, Standings, PlayerProfile | ✅ FIXED |

---

## PENDIENTES (baja prioridad)

| # | Bug | Severidad | Descripción |
|---|-----|-----------|-------------|
| BUG-01 | Click en driver row cerrado navega a carrera incorrecta | 🟢 Baja | En `/predict/:id` con deadline pasado, hacer click en un row navega a `/race` de otra carrera. Poco probable con el redirect automático. |
| MODAL-01 | Search input persiste entre opens del modal | 🟢 Baja | El texto de búsqueda no se resetea al abrir el modal para una posición diferente. |
