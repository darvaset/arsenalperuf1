# F1 Arsenal Fantasy — AGENT CONTEXT

> Este archivo es el punto de entrada para cualquier agente AI que tome el proyecto.
> Léelo completo antes de tocar cualquier archivo.

---

## 🛑 SEGURIDAD CRÍTICA — REGLAS DEL AGENTE

1. **PRODUCCIÓN ES SAGRADA:** El proyecto de Supabase `dtpsvlwqrlbsntpunest` es **PRODUCCIÓN**.
2. **SCRIPTS PROHIBIDOS EN PROD:** Nunca ejecutes `npm run seed:demo`, `npm run clean:demo` o `npm run reset:prod` en producción.
3. **VERIFICACIÓN OBLIGATORIA:** Verifica `VITE_SUPABASE_URL` en `.env.local` antes de cualquier script destructivo.
4. **AUTOMATIZACIÓN ACTIVA:** El procesamiento de resultados es automático vía GitHub Actions. No fuerces resultados manuales a menos que sea necesario.

---

## ¿Qué es este proyecto?

Aplicación web privada de predicciones F1 para un grupo de amigos.
**Live:** https://arsenalperuf1.vercel.app  
**Owner:** Diego (darvaset@gmail.com)

---

## Stack técnico

| Capa | Tech | Notas |
|------|------|-------|
| Frontend | React + Vite + Tailwind CSS | Mobile-first |
| Backend/DB | Supabase (Postgres + RLS) | Magic link auth |
| Automatización | GitHub Actions + Vercel Cron | Frecuencia: 10 min |
| Notificaciones | Supabase Real-time | In-app badges + Inbox |

---

## Estructura de Automatización (Cron)

El archivo `api/cron-check-results.js` se ejecuta cada 10 minutos disparado por GitHub Actions (`.github/workflows/cron.yml`).

### Reglas de Negocio:
1. **Recordatorios:** Si falta < 2h para el deadline y el usuario no ha predicho -> Notificación.
2. **Resultados:** Si la carrera empezó hace > 1h y no hay resultados -> Busca en Jolpica cada 10 min.
3. **Finalización:** Una vez obtenidos los resultados, procesa scores y notifica a cada jugador con su link directo.

---

## Estado del Proyecto (Marzo 2026)

### ✅ Finalizado
- Auth Magic Link & RLS.
- Calendario 2026 sincronizado con Jolpica.
- Sistema de Notificaciones Real-time con Inbox dedicada.
- Automatización total de procesamiento de resultados.
- Header global con badge dinámico de notificaciones.
- Parches SQL (Banderas, Equipos, Notificaciones) aplicados en Prod.

### 🔲 Backlog
- PWA instalable (Vite PWA Plugin).
- Lógica de desempate (Tiebreaker) en Leaderboard.
- Notificaciones vía Telegram (Alternativa a Web Push).

---

## Jugadores Reales (PROD)
`darvaset@gmail.com`, `jrwilsonc`, `juanq93`, `JOS7`, `Anthony`, `franccesco.ormeno`.
Bote acumulado: S/300.
