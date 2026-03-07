# 🏎️ F1 Arsenal Fantasy

App de polla de F1 para el grupo. Predicción del Top 10 de cada carrera, tabla acumulada de temporada, bote de S/50 por cabeza al ganador al final de la temporada.

**Stack:** React + Vite + Tailwind · Supabase (DB + Auth) · Vercel (hosting) · Jolpica F1 API (calendario)
**Costo mensual:** $0

---

## Estado del proyecto

| Módulo | Estado |
|--------|--------|
| Estructura base React + Vite | ✅ Listo |
| Tailwind + paleta F1 | ✅ Listo |
| Auth con magic link (Supabase) | ✅ Listo |
| Lista de pilotos 2026 (22 pilotos, 11 equipos) | ✅ Actualizado |
| Lógica de scoring (bloques + bono exacto) | ✅ Listo |
| Formulario de predicción con deadline automático | ✅ Listo |
| Tabla general de temporada | ✅ Listo |
| Detalle de carrera con breakdown por jugador | ✅ Listo |
| Schema de Supabase (SQL) | ✅ Listo |
| Cliente Jolpica API (`src/lib/jolpica.js`) | ✅ Listo |
| Script seed de carreras (`scripts/seed-races.js`) | ✅ Listo |
| Diseño UI (Google Stitch) | 🔲 Pendiente |
| Deploy en Vercel | 🔲 Pendiente |
| Página de admin para subir resultados | 🔲 Pendiente |

---

## Siguientes pasos

### PASO 1 — Crear proyecto en Supabase
1. Crear cuenta en [supabase.com](https://supabase.com) → New project
2. Elegir región más cercana (US East)
3. Ir a **SQL Editor** → ejecutar todo el contenido de `supabase/schema.sql`
4. Ir a **Authentication → Settings**:
   - Confirmar que **Email (Magic Link)** esté habilitado
   - Deshabilitar "Email + Password" si está activo
   - En **Site URL** poner `http://localhost:5173`
5. Ir a **Project Settings → API** → copiar:
   - `Project URL`
   - `anon public` key
   - `service_role` key (solo para el script de seed, nunca al frontend)

### PASO 2 — Configurar variables de entorno
```bash
cd /Users/darva/Projects/F1-Arsenal
cp .env.example .env.local
```
Editar `.env.local` con tus tres valores de Supabase:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```
> ⚠️ La `SUPABASE_SERVICE_ROLE_KEY` solo la usan los scripts de Node. Nunca la pongas en el frontend ni en el repo.

### PASO 3 — Instalar dependencias
```bash
npm install
```

### PASO 4 — Seed del calendario F1 2026 desde Jolpica
Este script llama a la Jolpica API (sucesor de Ergast) y popula la tabla `races` con las 24 carreras del calendario 2026, incluyendo fechas y horas exactas en UTC.

```bash
npm run seed:races
```

Output esperado:
```
📡 Fetching F1 2026 schedule from Jolpica...
✅ Got 24 races from Jolpica

  Round 01 — Australian Grand Prix        📅 Sun, 15 Mar 2026 05:00:00 GMT
                                           🔒 Deadline: Sun, 15 Mar 2026 04:00:00 GMT
  Round 02 — Chinese Grand Prix           📅 Sun, 22 Mar 2026 07:00:00 GMT
  ...
🏁 Seed completado.
```

> 💡 El script usa `upsert` — puedes volver a correrlo sin duplicar datos.

### PASO 5 — Correr en local
```bash
npm run dev
```
Abrir [http://localhost:5173](http://localhost:5173)

### PASO 6 — Invitar jugadores
En Supabase Dashboard → **Authentication → Users → Invite user**
- Ingresar el email de cada participante
- Les llega un magic link — al entrar se crea su perfil automáticamente
- Cambiar el `display_name` en la tabla `players` desde el dashboard

### PASO 7 — Diseño UI con Google Stitch
1. Ir a [stitch.withgoogle.com](https://stitch.withgoogle.com)
2. Pegar el contenido de `docs/stitch-prompt.md` como prompt
3. Generar las 7 pantallas: Login, Home, Predict, Standings, Race Detail, Profile, Calendar
4. Exportar y adaptar los componentes React existentes

### PASO 8 — Deploy en Vercel
1. Subir el proyecto a GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: F1 Arsenal Fantasy — initial setup"
   git remote add origin https://github.com/tu-usuario/f1-arsenal.git
   git push -u origin main
   ```
2. Ir a [vercel.com](https://vercel.com) → **Add New Project** → importar el repo
3. En **Environment Variables** agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   > ⚠️ NO agregar `SUPABASE_SERVICE_ROLE_KEY` a Vercel — es solo para scripts locales
4. Click **Deploy** → URL tipo `f1-arsenal.vercel.app`
5. Volver a Supabase → **Auth → Settings → Site URL** → actualizar con tu URL de Vercel
6. Agregar la URL de Vercel en **Redirect URLs** también

### PASO 9 — Página de Admin para subir resultados *(pendiente)*
Pantalla protegida para ti como admin:
- Ver predicciones recibidas por carrera
- Subir el resultado real del GP (opción A: manual; opción B: fetch automático desde Jolpica)
- Disparar cálculo de scores

> Identificar al admin por `player_id` en Supabase y agregar ruta `/admin`

---

## Estructura del proyecto

```
F1-Arsenal/
├── scripts/
│   └── seed-races.js          # Seed del calendario desde Jolpica API
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Header + nav + logout
│   ├── pages/
│   │   ├── Login.jsx           # Magic link login
│   │   ├── Predict.jsx         # Formulario Top 10 con deadline automático
│   │   ├── Standings.jsx       # Tabla general de temporada
│   │   └── RaceDetail.jsx      # Breakdown de predicciones por carrera
│   ├── lib/
│   │   ├── supabase.js         # Cliente Supabase, pilotos 2026, scoring
│   │   └── jolpica.js          # Cliente Jolpica API + mappers
│   ├── App.jsx                 # Router + auth guard
│   └── main.jsx
├── supabase/
│   └── schema.sql              # SQL: tablas, RLS, triggers
├── docs/
│   ├── reglas.md               # Reglas oficiales de la polla
│   ├── screens.md              # Definición de pantallas UX
│   └── stitch-prompt.md        # Prompt listo para Google Stitch
├── .env.example                # Plantilla de variables de entorno
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Jolpica API — Endpoints usados

| Endpoint | Uso |
|----------|-----|
| `GET /f1/2026.json` | Calendario completo de la temporada |
| `GET /f1/2026/{round}/results.json` | Resultados de una carrera específica |

**Base URL:** `https://api.jolpi.ca/ergast/f1`
**Auth:** No requerida · **Rate limit:** Generoso para uso personal · **Costo:** Gratis

> Jolpica es el sucesor oficial de Ergast. Compatible al 100% con la misma estructura JSON.
> Repo: [github.com/jolpica/jolpica-f1](https://github.com/jolpica/jolpica-f1)

---

## Pilotos 2026 (22 pilotos / 11 equipos)

| ID | Piloto | Equipo | # |
|----|--------|--------|---|
| VER | Verstappen | Red Bull | 1 |
| HAD | Hadjar | Red Bull | 22 |
| NOR | Norris | McLaren | 4 |
| PIA | Piastri | McLaren | 81 |
| LEC | Leclerc | Ferrari | 16 |
| HAM | Hamilton | Ferrari | 44 |
| RUS | Russell | Mercedes | 63 |
| ANT | Antonelli | Mercedes | 12 |
| ALO | Alonso | Aston Martin | 14 |
| STR | Stroll | Aston Martin | 18 |
| GAS | Gasly | Alpine | 10 |
| COL | Colapinto | Alpine | 43 |
| HUL | Hulkenberg | Audi | 27 |
| BOR | Bortoleto | Audi | 5 |
| PER | Pérez | Cadillac | 11 |
| BOT | Bottas | Cadillac | 77 |
| OCO | Ocon | Haas | 31 |
| BEA | Bearman | Haas | 87 |
| LAW | Lawson | Racing Bulls | 30 |
| LIN | Lindblad | Racing Bulls | 6 |
| SAI | Sainz | Williams | 55 |
| ALB | Albon | Williams | 23 |

---

## Reglas de la polla

Ver `docs/reglas.md` para las reglas completas. Resumen:

- **Top 5 correcto:** 10 pts base por piloto en el bloque
- **P6–P10 correcto:** 5 pts base por piloto en el bloque  
- **Posición exacta:** +puntos reales F1 de esa posición (25/18/15/12/10/8/6/4/2/1)
- **DNF:** Se cuenta como último lugar
- **Deadline:** 1 hora antes de la carrera (calculado automáticamente)
- **Bote:** S/50 por jugador · ganador se lleva todo al final de temporada
