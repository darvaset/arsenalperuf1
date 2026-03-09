# 🏎️ Arsenal Peru F1

App de predicciones F1 (Polla) para el grupo. Predicción del Top 10, tabla acumulada y automatización de resultados.

**Stack:** React + Vite + Tailwind · Supabase · Vercel · GitHub Actions (Cron)

---

## 🚀 Características
- **Notificaciones In-App:** Avisos de deadline y resultados listos en tiempo real.
- **Automatización:** Los resultados se obtienen y procesan solos cada 10 min (post-carrera).
- **Ranking Global:** Tabla de posiciones actualizada al instante.
- **Mobile First:** Diseñada para usarse desde el circuito o el sofá.

---

## 🛠️ Comandos Útiles (Solo para DEV)
```bash
npm run dev          # Iniciar frontend local
npx vercel dev       # Iniciar funciones API locales
npm run seed:races   # Sincronizar calendario con Jolpica
```

---

## 🏁 Flujo de Carrera
1. **Predicción:** Hasta 1h antes de la carrera. El sistema envía un recordatorio 2h antes del deadline si no has predicho.
2. **Carrera:** El sistema espera 1h desde la largada para no saturar la API.
3. **Resultados:** El sistema busca resultados cada 10 min. Al encontrarlos, calcula puntos y envía una notificación con link directo a tus resultados.

---
© 2026 Arsenal Peru F1. Todos los derechos reservados.
