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
| Deploy en Vercel | ✅ Listo |
| Página de admin para subir resultados | ✅ Listo |
| Diseño UI final | ✅ Listo |
| PWA instalable | 🔲 Pendiente |

---

## Siguientes pasos

### PASO 1 — Tareas de mantenimiento
1. Procesar resultados de carreras a medida que ocurran (`npm run results <round>`).
2. Verificar consistencia de `calculateScore` en `src/lib/supabase.js`, `api/process-results.js` y `scripts/process-results.js`.

### PASO 2 — Backlog de funcionalidades
1. **PWA:** Configurar `vite-plugin-pwa` y `manifest.json` para permitir la instalación en móviles.
2. **Notificaciones:** Explorar alternativas para avisos de deadline (Telegram bot es una opción viable vs Web Push).
3. **Tiebreaker:** Definir y programar la lógica de desempate en el leaderboard global.

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
