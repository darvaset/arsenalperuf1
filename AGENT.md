# F1 Arsenal Fantasy — AGENT CONTEXT

> Este archivo es el punto de entrada para cualquier agente AI que tome el proyecto.
> Léelo completo antes de tocar cualquier archivo.

---

## 🛑 SEGURIDAD CRÍTICA — REGLAS DEL AGENTE

1. **PRODUCCIÓN ES SAGRADA:** El proyecto de Supabase `dtpsvlwqrlbsntpunest` es **PRODUCCIÓN** con 6 jugadores reales y dinero en juego (S/300).
2. **SCRIPTS PROHIBIDOS EN PROD:** Nunca ejecutes `npm run seed:demo`, `npm run clean:demo` o `npm run reset:prod` apuntando a la URL de producción.
3. **VERIFICACIÓN OBLIGATORIA:** Antes de correr cualquier script de `scripts/`, verifica el archivo `.env.local`. Si la URL es la de producción, **DETENTE**.
4. **ENTORNO DE PRUEBAS:** Para testear lógica destructiva, solicita al usuario una base de datos de Staging o utiliza un proyecto de Supabase local/alternativo.
5. **ROLLBACK:** Si accidentalmente se modifica algo, usa `npm run seed:races` para restaurar el calendario oficial y `npm run results <round>` para restaurar los scores de rondas ya terminadas.

---

Aplicación web privada de predicciones F1 para un grupo de amigos (~6-8 personas).
Cada participante predice el Top 10 de cada carrera antes del deadline (1h antes).
El que más puntos acumule al final de la temporada gana el bote (S/50 × N jugadores).

**Live:** https://arsenalperuf1.vercel.app  
**GitHub:** https://github.com/darvaset/arsenalperuf1  
**Owner:** Diego (darvaset@gmail.com)

---

## Stack técnico

| Capa | Tech | Notas |
|------|------|-------|
| Frontend | React + Vite + Tailwind CSS | Mobile-first, dark mode only |
| Backend/DB | Supabase (Postgres + Auth + RLS) | Magic link auth |
| Hosting | Vercel | Auto-deploy desde GitHub main |
| Resultados F1 | Jolpica API (jolpi.ca/ergast/f1) | Sucesor de Ergast, gratis |
| AI scoring | N/A — scoring es determinista | Ver `src/lib/supabase.js` |

**Costo total: $0/mes** en los free tiers de Vercel + Supabase.

---

## Estructura del repositorio

```
F1-Arsenal/
├── AGENT.md                        ← ESTE ARCHIVO — leer primero
├── api/
│   └── process-results.js          ← Vercel serverless: procesa resultados de una carrera
├── scripts/
│   ├── seed-races.js               ← Upsert calendario 2026 desde Jolpica (safe to re-run)
│   ├── seed-demo.js                ← 3 jugadores demo + 4 carreras completadas
│   ├── seed-darva.js               ← Scores para darvaset@gmail.com
│   ├── clean-demo.js               ← Elimina todos los datos demo
│   ├── process-results.js          ← CLI: calcula scores para una ronda
│   ├── set-deadline-test.js        ← Mueve el deadline para testing
│   └── reset-production.js         ← Dry-run: muestra qué borraria (--confirm para ejecutar)
├── src/
│   ├── components/
│   │   └── Layout.jsx              ← Bottom nav + active states
│   ├── pages/
│   │   ├── Login.jsx               ← Magic link form
│   │   ├── Dashboard.jsx           ← Home: próxima carrera + countdown + standings F1 widget
│   │   ├── Calendar.jsx            ← 24 carreras con estados: ABIERTO/EN CURSO/FINALIZADO
│   │   ├── Predict.jsx             ← Formulario de predicción (10 pilotos, modal picker)
│   │   ├── Standings.jsx           ← 4 tabs: Leaderboard, Mis Carreras, Pilotos F1, Equipos
│   │   ├── RaceDetail.jsx          ← 3 tabs: Mi Predicción, Ranking, Resultados Oficiales
│   │   ├── PlayerProfile.jsx       ← Historial y stats de cualquier jugador
│   │   └── Profile.jsx             ← Config de cuenta: username, equipo favorito, Admin panel
│   ├── lib/
│   │   ├── supabase.js             ← Cliente Supabase + DRIVERS_2026 + TEAM_COLORS + calculateScore + formatters
│   │   └── jolpica.js              ← Cliente Jolpica API
│   ├── App.jsx                     ← Router principal
│   ├── index.css                   ← Tailwind directives + custom classes
│   └── main.jsx
├── supabase/
│   ├── schema.sql                  ← Schema completo + RLS policies
│   └── patches/
│       ├── add-favorite-team.sql   ← ⚠️ PENDIENTE DE EJECUTAR en Supabase
│       ├── add-country-flag.sql    ← ⚠️ PENDIENTE DE EJECUTAR en Supabase
│       └── security-pre-prod.sql  ← ⚠️ PENDIENTE DE EJECUTAR en Supabase (deadline enforcement en RLS)
├── docs/
│   ├── reglas.md                   ← Reglas del juego (fuente de verdad para scoring)
│   ├── bugs-found.md               ← Historial de bugs y fixes
│   ├── results-workflow.md         ← Cómo procesar resultados post-carrera
│   ├── screens.md                  ← Diseño UI y flujo de pantallas
│   ├── test-plan.md                ← Plan de pruebas
│   └── vercel-env-vars.md          ← Variables de entorno requeridas
├── vercel.json                     ← SPA rewrites: todas las rutas → index.html
├── .env.local                      ← Variables locales (NO commitear)
├── tailwind.config.js
└── package.json
```

---

## Base de datos — Tablas Supabase

### `players`
```sql
id            UUID PRIMARY KEY → auth.users(id)
email         TEXT
username      TEXT              -- Nickname elegido
display_name  TEXT              -- Legacy
favorite_team TEXT DEFAULT NULL -- Equipo favorito (ej: "Ferrari")
created_at    TIMESTAMPTZ
```
Auto-creado via trigger `on_auth_user_created` al hacer magic link.

### `races`
```sql
id           UUID PRIMARY KEY
round        INTEGER UNIQUE     -- Número de ronda 1-24
name         TEXT               -- "Gran Premio de Australia 2026"
circuit      TEXT
country      TEXT               -- "Australia"
locality     TEXT               -- "Melbourne"
race_date    TIMESTAMPTZ        -- UTC, hora de largada
results      TEXT[]             -- Array driver IDs P1..P10 (null hasta que termine)
country_flag TEXT               -- "🇦🇺" (poblar con add-country-flag.sql)
created_at   TIMESTAMPTZ
```

### `predictions`
```sql
id           UUID PRIMARY KEY
race_id      UUID → races(id)
player_id    UUID → players(id)
picks        TEXT[]             -- Array 10 driver IDs en orden P1..P10
submitted_at TIMESTAMPTZ
UNIQUE(race_id, player_id)
```

### `scores`
```sql
id           UUID PRIMARY KEY
race_id      UUID → races(id)
player_id    UUID → players(id)
total_points INTEGER
detail       JSONB              -- { by_position: [...], exact_count, block_count, base_points, bonus_points }
created_at   TIMESTAMPTZ
UNIQUE(race_id, player_id)
```

**Detail JSONB schema** (cada elemento de `by_position`):
```json
{
  "pos": 6,
  "driverId": "HAM",
  "actualPos": 4,
  "base": 0,
  "bonus": 0,
  "isExact": false,
  "inCorrectBlock": false
}
```

---

## Lógica de Scoring (CRÍTICO — leer reglas.md)

```javascript
// src/lib/supabase.js → calculateScore(prediction, results)
// api/process-results.js → calculateScore() (copia idéntica)
// scripts/process-results.js → calculateScore() (copia idéntica)

// REGLA CLAVE: El bloque de predicción debe coincidir con el bloque REAL del piloto.
// Cruzar bloques = 0 pts base.
//
// Slot P1-P5 predijo → piloto terminó P1-P5 = 10 pts base
// Slot P6-P10 predijo → piloto terminó P6-P10 = 5 pts base
// Cruce (predijo Top5, terminó Mid5 o viceversa) = 0 pts
// Bonus exacto: si predijo posición X y terminó exactamente en X → +F1_POINTS[X]
```

**⚠️ Importante:** Si `calculateScore` se modifica en un archivo, debe modificarse en los 3 idénticamente.

---

## Race Lifecycle (estados de una carrera)

```javascript
// RaceDetail.jsx y Calendar.jsx
const deadline       = new Date(race.race_date).getTime() - 3600000  // -1 hora
const deadlinePassed = Date.now() >= deadline
const isFinished     = (race.results ?? []).length > 0
const isLive         = deadlinePassed && !isFinished

// ABIERTO:    !deadlinePassed  → predicciones activas
// EN CURSO:   isLive           → deadline pasó, sin resultados aún
// FINALIZADA: isFinished       → results guardados en DB
```

---

## Drivers 2026 (IDs canónicos)

Todos los driver IDs en `src/lib/supabase.js → DRIVERS_2026`:

| ID | Piloto | Equipo |
|----|--------|--------|
| VER | Verstappen | Red Bull |
| HAD | Hadjar | Red Bull |
| NOR | Norris | McLaren |
| PIA | Piastri | McLaren |
| LEC | Leclerc | Ferrari |
| HAM | Hamilton | Ferrari |
| RUS | Russell | Mercedes |
| ANT | Antonelli | Mercedes |
| ALO | Alonso | Aston Martin |
| STR | Stroll | Aston Martin |
| GAS | Gasly | Alpine |
| COL | Colapinto | Alpine |
| HUL | Hulkenberg | Audi |
| BOR | Bortoleto | Audi |
| PER | Pérez | Cadillac |
| BOT | Bottas | Cadillac |
| OCO | Ocon | Haas |
| BEA | Bearman | Haas |
| LAW | Lawson | Racing Bulls |
| LIN | Lindblad | Racing Bulls |
| SAI | Sainz | Williams |
| ALB | Albon | Williams |

**Jolpica → nuestro ID map** está en `api/process-results.js → JOLPICA_ID_MAP`.

---

## Variables de entorno

### `.env.local` (desarrollo)
```env
VITE_SUPABASE_URL=https://dtpsvlwqrlbsntpunest.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
ADMIN_SECRET=<secret string>
```

### Vercel (producción) — Settings → Environment Variables
Mismas más:
```env
SUPABASE_URL=https://dtpsvlwqrlbsntpunest.supabase.co
```
`api/process-results.js` usa `SUPABASE_URL ?? VITE_SUPABASE_URL` para compatibilidad.

---

## Comandos de desarrollo

```bash
npm run dev                              # localhost:5173
npm run build                            # build de producción
npm run seed:races                       # Upsert 24 carreras desde Jolpica (safe to re-run)
npm run seed:demo                        # 3 jugadores demo + 4 carreras completadas
npm run seed:darva                       # Scores para darvaset@gmail.com
npm run clean:demo                       # Limpiar datos demo
npm run results <ronda>                  # Procesar resultados: npm run results 1
npm run test:deadline <ronda> <minutos>  # Mover deadline: npm run test:deadline 1 65
npm run test:deadline <ronda> reset      # Restaurar fecha real desde Jolpica
npm run reset:prod                       # Dry run (ver qué borraría)
npm run reset:prod -- --confirm          # EJECUTAR reset producción (irreversible)

# Deploy: solo hacer git push, Vercel auto-deploya
git add . && git commit -m "msg" && git push
```

---

## Workflow post-carrera

```bash
# ~2-3 horas después de que termina la carrera:
npm run results <número_de_ronda>

# Alternativamente desde el browser (Admin panel en /profile):
# https://arsenalperuf1.vercel.app/api/process-results?round=1&secret=TU_SECRET
```

---

## Supabase — Links importantes

- **Dashboard:** https://supabase.com/dashboard/project/dtpsvlwqrlbsntpunest
- **SQL Editor:** https://supabase.com/dashboard/project/dtpsvlwqrlbsntpunest/sql/new
- **Auth:** https://supabase.com/dashboard/project/dtpsvlwqrlbsntpunest/auth/users
- **Tabla races:** https://supabase.com/dashboard/project/dtpsvlwqrlbsntpunest/editor (Table Editor)

---

## Estado actual del proyecto (Mar 2026)

### ✅ Funcionando en producción
- Auth magic link
- Calendario 24 carreras 2026 (reales, desde Jolpica)
- Predicciones con deadline enforcement (frontend + RLS backend)
- Race lifecycle: ABIERTO / EN CURSO / FINALIZADA
- Scoring con lógica de bloques correcta
- Leaderboard acumulado de temporada
- PlayerProfile con historial carrera a carrera
- Standings con 4 tabs: Leaderboard, Mis Carreras, Pilotos F1, Equipos
- Equipo favorito en perfil (badge en leaderboard)
- Admin panel en /profile para procesar resultados
- Fechas en hora local del usuario (AM/PM)
- R1 Australia procesada — scores calculados
- Automatización del procesamiento de resultados (Vercel Cron cada 30m)

### ✅ Finalizado (Patches SQL ejecutados)
1. `supabase/patches/add-favorite-team.sql` — Columna `favorite_team` agregada a `players`.
2. `supabase/patches/add-country-flag.sql` — Columna `country_flag` agregada a `races` y poblada.
3. `supabase/patches/security-pre-prod.sql` — RLS con deadline enforcement activo en `predictions`.

### 🔲 Backlog (no implementado)
- Push notifications (complejo — Web Push no funciona en iOS Safari)
- PWA instalable (manifest.json + Vite PWA plugin)
- Tiebreaker en leaderboard (no definido aún)

---

## Patrones y gotchas conocidos

```javascript
// ❌ NO funciona en Supabase JS v2:
.order('foreign_table(column)')
// ✅ Usar: sort en el cliente después del fetch

// ❌ .single() cuando el row puede no existir → lanza error
// ✅ Usar: .maybeSingle()

// ❌ bg-surface-dark NO está en el Tailwind config
// ✅ Usar: bg-[#1F1F2B]

// ❌ country_flag en JOIN de scores→races puede fallar si columna no existe
// ✅ Removido del SELECT, usar FLAG_MAP como fallback

// ✅ predsMap keys: [playerId] = picks[], [playerId+'_username'] = string, [playerId+'_team'] = string
// ✅ TEAM_COLORS exportado desde src/lib/supabase.js
// ✅ formatRaceDateTime / formatRaceDate / formatRaceTime exportados desde src/lib/supabase.js
// ✅ vercel.json rewrites: todas las rutas non-api → index.html (fix SPA refresh 404)
```

---

## Jugadores reales en producción

```
darvaset@gmail.com   ← Owner/Admin
jrwilsonc            ← jugador real
juanq93              ← jugador real
JOS7                 ← jugador real
Anthony              ← jugador real
franccesco.ormeno    ← jugador real
```
Total: 6 jugadores → bote = S/300

**⚠️ No borrar producción.** Para testing usar `npm run seed:demo` + `npm run clean:demo`.

---

## Diseño — Design System

| Token | Valor |
|-------|-------|
| Background | `#15151E` |
| Card | `#1F1F2B` |
| Primary | `#e00700` (rojo F1) |
| Gold/Top5 | `#F5D25D` |
| Blue/Mid5 | `#6B9BF4` |
| Font | Inter |
| Icons | Material Symbols Outlined |

Team colors en `TEAM_COLORS` de `src/lib/supabase.js`.
Team logos desde `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_160/content/dam/fom-website/2018-redesign-assets/team%20logos/{slug}`.

---

## Iconografía de resultados

| Estado | Icono Material | Color |
|--------|---------------|-------|
| Exacto (posición exacta) | `done_all` | `text-emerald-400` |
| En bloque (mismo bloque) | `check_circle` | `text-blue-400` |
| Miss (cruce de bloques o fuera top10) | `close` | `text-slate-700` |

---

## Calendario 2026 (rondas clave)

| R | GP | Fecha UTC |
|---|----|----|
| 1 | Australia | 08 Mar 2026 04:00 ✅ PROCESADO |
| 2 | China | 15 Mar 2026 07:00 |
| 3 | Japan | 29 Mar 2026 05:00 |
| 4 | Bahrain | 12 Apr 2026 15:00 |
| 5 | Saudi Arabia | 19 Apr 2026 17:00 |
| ... | ... | ... |
| 24 | Abu Dhabi | Nov 2026 |

---

## Para el próximo agente: próximos pasos sugeridos

1. Verificar que los 3 patches SQL estén ejecutados en Supabase
2. Verificar que `calculateScore` sea idéntico en los 3 archivos que lo tienen
3. Procesar resultados R2+ a medida que van corriendo las carreras
4. Ver `docs/bugs-found.md` para contexto de bugs resueltos
5. El backlog más pedido: PWA instalable (baja complejidad, alto valor para usuarios móviles)
