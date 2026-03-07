# F1 Arsenal — Reporte de Bugs (Testing Session 06 Mar 2026)

> Ultima actualizacion: 06 Mar 2026 — todos los bugs criticos resueltos

---

## RESUELTOS

| # | Bug | Severidad | Archivo | Estado |
|---|-----|-----------|---------|--------|
| BUG-02 | Mi Prediccion mostraba error cuando no habia resultados | Alta | RaceDetail.jsx | FIXED |
| BUG-03 | Calendario "SIGUIENTE" en vez de "EN CURSO" cuando deadline paso | Media | Calendar.jsx | FIXED |
| BUG-04 | Ranking mostraba "Nadie ha jugado" aunque habia predicciones enviadas | Alta | RaceDetail.jsx | FIXED |
| BUG-05 | Dashboard boton "Hacer mi prediccion" bloqueado sin navegacion alternativa | Media | Dashboard.jsx | FIXED |

---

## Detalle de los fixes

### BUG-02 — MyPrediction sin resultados
**Archivo:** `src/pages/RaceDetail.jsx`  
**Fix:** Cuando `results.length === 0` pero hay picks, muestra los picks en modo "pendiente"
con un banner ambar "Esperando resultados oficiales" y cada pick con su pts base potencial
(10 pts para Top5, 5 pts para Mid5). El mensaje de error se eliminó.

### BUG-03 — Calendar estado EN CURSO
**Archivo:** `src/pages/Calendar.jsx`  
**Fix:** `isLive` ahora usa `deadline <= now` (antes usaba `raceDate <= now`).
Tambien `nextIdx` ahora excluye carreras con deadline pasado.
Resultado: entre el deadline y el fin de la carrera, el badge muestra "EN CURSO" correctamente.

### BUG-04 — Ranking vacio con predicciones enviadas  
**Archivo:** `src/pages/RaceDetail.jsx`  
**Fix:** `GroupRanking` recibe `predCount` (nuevo prop). Cuando `scores.length === 0`
pero `predCount > 0`, muestra "Esperando resultados · N jugadores enviaron prediccion".
El fetch de predicciones ahora es incondicional (no depende de que haya scores).

### BUG-05 — Dashboard boton cerrado
**Archivo:** `src/pages/Dashboard.jsx`  
**Fix:** Boton dinamico: cuando `isOpen=true` muestra "Hacer mi prediccion" con estilo rojo
y navega a `/predict/:id`. Cuando `isOpen=false` muestra "Ver carrera" con estilo gris
y navega a `/race/:id`. Eliminado `disabled` prop.

---

## PENDIENTES (baja prioridad, no bloquean lanzamiento)

| # | Bug | Severidad | Descripcion |
|---|-----|-----------|-------------|
| BUG-01 | Click en driver row cerrado navega a carrera incorrecta | Baja | En `/predict/:id` con deadline pasado, hacer click en un row navega a `/race` de otra carrera. Poco probable con el redirect automatico al detectar cierre. |
| MODAL-01 | Search input persiste entre opens del modal | Baja | El texto de busqueda no se resetea al abrir el modal para una posicion diferente. |

---

## Estado del test plan

| TC | Descripcion | Estado |
|----|-------------|--------|
| TC-01 | Nueva prediccion | pendiente |
| TC-02 | Modificar prediccion dentro del plazo | PASSED |
| TC-03 | Bloqueo frontend por deadline | PASSED (parcial) |
| TC-04 | Bloqueo backend RLS | pendiente (requiere security SQL) |
| TC-05 | Calendar 4 estados | PASSED |
| TC-08/09 | Auth y sesion persistente | PASSED |
| TC-12 | Scoring exacto Top5 | PASSED |
| TC-13 | Scoring en bloque sin exacto | PASSED |
| TC-15 | Standings/leaderboard | PASSED |
| TC-16 | PlayerProfile desde Standings | PASSED |
| TC-17 | Predecir nav abierto | PASSED |
| TC-18 | Predecir nav cerrado | PASSED |
| TC-19 | Back navigation | PASSED |
