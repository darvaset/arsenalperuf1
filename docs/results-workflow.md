# F1 Arsenal — Flujo de Resultados por Carrera

## ¿Es automático o manual?

**Manual, por diseño.** Jolpica publica resultados ~2-3 horas después de que termina la carrera.
Tú corres un comando desde tu computadora y todo se calcula automáticamente.

---

## Tu ritual post-carrera (5 minutos)

```
Carrera termina (ej: domingo 17:00 UTC)
    ↓
Jolpica publica resultados (~19:00–20:00 UTC)
    ↓
Tú corres: npm run results 5    ← número de ronda
    ↓
El script:
  ✅ Fetchea P1–P10 de Jolpica
  ✅ Guarda results en races.results
  ✅ Calcula puntos para TODOS los jugadores
  ✅ Imprime el leaderboard de esa carrera en la terminal
    ↓
Los jugadores refrescan la app y ven sus puntos
```

---

## Comando

```bash
npm run results <ronda>

# Ejemplos:
npm run results 5    # Saudi Arabian GP (Round 5)
npm run results 6    # etc.
```

### Output esperado:

```
🏎️  Processing results for F1 2026 Round 5

📡 Fetching results for Round 5 from Jolpica...
✅ Race: Saudi Arabian Grand Prix
   Results: NOR · VER · LEC · HAM · PIA · RUS · SAI · ANT · GAS · HUL

✅ Saved results to races table

📊 Calculating scores for 4 prediction(s)...

────────────────────────────────────────────────────
  Saudi Arabian Grand Prix — RESULTADOS FINALES
────────────────────────────────────────────────────
  🥇  Darva                151 pts  (5 exactos · 10 en bloque)
  🥈  DiegoArepa           132 pts  (4 exactos · 10 en bloque)
  🥉  CarlitosSpeed         98 pts  (2 exactos · 8 en bloque)
    4.  AnaRacingFan          85 pts  (1 exacto · 9 en bloque)
────────────────────────────────────────────────────

✅ Scores saved. 4 players updated.
   Refresh the app to see the updated standings.
```

---

## ¿Qué pasa si Jolpica no tiene los resultados todavía?

```bash
❌ No results found for Round 5. Race may not have happened yet.
   Note: Results are usually available 2-3 hours after the race ends.
```

Simplemente espera un rato y vuelve a correr el comando. Es seguro re-correr — usa upsert.

---

## ¿Qué pasa si alguien no puso su predicción?

El script solo procesa jugadores que enviaron predicción para esa carrera.
Un jugador sin predicción **no aparece en scores para esa ronda** → cuenta como 0 pts en el leaderboard total.

---

## ¿Hay algún riesgo si corro el script dos veces?

No. El upsert usa `race_id + player_id` como clave única. Re-correr el script simplemente sobreescribe con los mismos valores.

---

## Calendario de carreras 2026 (referencia rápida)

| Ronda | Comando | Gran Premio |
|-------|---------|-------------|
| 5 | `npm run results 5` | Saudi Arabian GP |
| 6 | `npm run results 6` | Australian GP (2da fecha) |
| ... | ... | ... |
| 24 | `npm run results 24` | Abu Dhabi GP |

> Para ver todas las rondas: `npm run seed:races` imprime el calendario completo.

---

## ¿Por qué no es automático?

Opciones de automatización y sus trade-offs:

| Opción | Costo | Complejidad | Recomendado |
|--------|-------|-------------|-------------|
| Script manual (actual) | $0 | Mínima | ✅ Para este proyecto |
| Vercel Cron Job | $0 en free tier | Media | Cuando escale |
| Supabase Edge Function | $0 en free tier | Media-Alta | Cuando escale |
| GitHub Actions scheduled | $0 | Media | Alternativa viable |

Para un grupo de 8 amigos, el script manual es lo más simple y confiable.
Cuando el proyecto crezca, migrar a un Cron Job en Vercel es el paso natural.
