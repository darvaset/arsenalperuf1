# F1 Arsenal Fantasy · Plan de Pruebas Pre-Producción

> Estado: Pendiente de ejecución  
> Tester principal: Darva  
> Ambiente: localhost:5173 + Supabase staging

---

## 1. PREDICCIONES — Control de deadline

### TC-01 · Predicción dentro del plazo ✅
**Precondición:** Hay una carrera futura con deadline > 1h  
**Pasos:**
1. Login con tu usuario
2. Ir a Predecir → debe navegar directo a la próxima carrera
3. Seleccionar 10 pilotos → enviar
**Esperado:** Se guarda en Supabase, redirige al Inicio, Calendar muestra "✅ Enviada"

### TC-02 · Modificación dentro del plazo ✅
**Precondición:** Ya enviaste predicción para una carrera abierta  
**Pasos:**
1. Ir a Predecir → cargar predicción existente
2. Cambiar 1 o más pilotos → actualizar
**Esperado:** Se actualiza el registro existente (no duplica), `submitted_at` se actualiza

### TC-03 · Bloqueo de predicción en frontend (deadline pasado)
**Precondición:** Manipular `race_date` en seed para simular deadline pasado  
**Pasos:**
1. Navegar directamente a `/predict/:raceId`
2. Intentar clickar en cualquier driver row
3. Verificar que el botón de Submit no aparece
**Esperado:** Drivers no responden al click, banner "El plazo ha cerrado", sin botón Submit

### TC-04 · Bloqueo de predicción en backend (deadline pasado) ⚠️ CRÍTICO
**Precondición:** Ejecutar `supabase/patches/security-pre-prod.sql` primero  
**Pasos:**
1. Con Postman/curl, hacer POST directo a `/rest/v1/predictions` con tu JWT
2. Race_id de una carrera con `race_date < NOW() + 1h`
3. Incluir header `Authorization: Bearer <tu_access_token>`
**Esperado:** Supabase retorna `401 Unauthorized` o `403 Forbidden` — el INSERT es rechazado por RLS

### TC-05 · Edge case — Carrera "En Curso" (entre deadline y fin de carrera)
**Precondición:** `race_date` ya pasó, pero `results` es NULL  
**Verificar:**
- Calendar muestra la carrera con badge amarillo "🏁 En Curso" (no "SIGUIENTE")
- La siguiente carrera correcta tiene badge "🔜 SIGUIENTE"
- Botón Predecir en nav lleva al calendario (no hay carrera abierta)
- El registro existente de predicción es visible pero no editable

---

## 2. PREDICCIONES — Sin predicción

### TC-06 · Jugador sin predicción en carrera completada
**Estado actual:** Es válido — no aparece en `scores`, leaderboard lo muestra con 0 pts  
**Verificar:**
- Tabla General muestra al jugador con 0 pts para esa ronda
- RaceDetail → Ranking → el jugador NO aparece (no tiene score) — esto es correcto
- PlayerProfile muestra la carrera? No, porque no hay score → correcto, no la muestra
**Decisión de diseño:** 0 pts implícito (no se penaliza, simplemente no suma)

### TC-07 · Jugador nuevo sin ninguna carrera jugada
**Pasos:**
1. Registrar nuevo usuario via magic link
2. Verificar que aparece en Tabla General con 0 pts y "Sin carreras aún"
3. Verificar que Predecir navega correctamente a la próxima carrera
**Esperado:** UX coherente, sin errores de consola

---

## 3. AUTENTICACIÓN Y PERFILES

### TC-08 · Magic link login
**Pasos:**
1. Ir a `/` sin sesión → debe redirigir a Login
2. Ingresar email → solicitar magic link
3. Click en el link del email
**Esperado:** Login exitoso, redirige al Dashboard, se crea fila en `players`

### TC-09 · Sesión persistente
**Pasos:**
1. Login exitoso
2. Cerrar el tab y volver a abrir la URL
**Esperado:** Sigue logueado (Supabase persiste la sesión con localStorage)

### TC-10 · Cambio de username
**Pasos:**
1. Ir a Perfil
2. Editar username → guardar
3. Verificar en Standings que el nombre actualizado aparece
**Esperado:** Se actualiza en `players.username`, se refleja en tiempo real

### TC-11 · Username duplicado
**Pasos:**
1. Intentar poner el mismo username que otro jugador ya tiene
**Esperado:** Se guarda sin error (no hay constraint UNIQUE en username — es intencional)  
**Nota:** Podría confundir a jugadores. Considerar agregar UNIQUE constraint.

---

## 4. LEADERBOARD Y SCORES

### TC-12 · Cálculo de puntos — exacto en Top 5
**Setup:** Predicción: NOR en P1. Resultado: NOR en P1.  
**Esperado:** `base=10, bonus=25, total=35` para esa posición  
**Verificar en:** RaceDetail → Mi Predicción → fila P1 muestra "+35" con "🎯 EXACTO"

### TC-13 · Cálculo de puntos — en bloque sin exacto
**Setup:** Predicción: NOR en P2. Resultado: NOR en P1.  
**Esperado:** `base=10, bonus=0, total=10`  
**Verificar:** Fila muestra "+10", ícono ✓, "Real: P1"

### TC-14 · Cálculo de puntos — piloto fuera del top 10
**Setup:** Predicción: ALO en P3. Resultado: ALO en P14.  
**Esperado:** `base=0, bonus=0, total=0`  
**Verificar:** Fila muestra "–" o "0", ícono ✗, "Fuera top10"

### TC-15 · Ranking en Standings después de múltiples carreras
**Pasos:**
1. Verificar que el orden en Leaderboard es correcto (mayor pts primero)
2. Verificar que empates muestran el mismo puesto (no hay criterio de desempate implementado)
**Nota:** El desempate no está definido en las reglas. Decidir criterio antes de publicar.

### TC-16 · PlayerProfile — datos de otro jugador
**Pasos:**
1. Click en DiegoArepa en Standings
2. Verificar que abre `/player/:id` de DiegoArepa, no el tuyo
3. Expandir cada carrera → ver picks P1–P10 con 🎯/✓/✗
**Esperado:** Datos correctos, link "Ver detalle completo" funciona

---

## 5. NAVEGACIÓN Y UX

### TC-17 · Botón Predecir en nav — carrera abierta
**Pasos:** Click en "Predecir" en el bottom nav  
**Esperado:** Navega directo a la página de predicción de la próxima carrera abierta

### TC-18 · Botón Predecir en nav — sin carrera abierta
**Precondición:** Todas las carreras tienen deadline pasado o resultados  
**Esperado:** Navega al Calendario

### TC-19 · Navegación back consistente
**Pasos:**
1. Dashboard → click carrera en "Última carrera" → RaceDetail
2. Presionar ← → debe volver al Dashboard
3. Standings → click jugador → PlayerProfile
4. Presionar ← → debe volver a Standings  
5. Mis Carreras → click carrera → RaceDetail
6. ← → volver a Standings (en Mis Carreras tab)
**Esperado:** Cada ← regresa al contexto correcto

### TC-20 · Deep link directo
**Pasos:**
1. Pegar `/race/:id` directamente en el browser
2. Pegar `/player/:id` directamente en el browser
3. Pegar `/predict/:id` de carrera cerrada directamente
**Esperado:** Carga correctamente, no rompe con "race not found"

---

## 6. SEGURIDAD

### TC-21 · Ver predicciones de otro jugador antes del deadline
**Riesgo:** Si alguien puede ver los picks de otro antes del cierre, hay ventaja  
**Estado actual:** RLS permite SELECT a todos → todos pueden ver todas las predicciones  
**Decisión:** Para un grupo de amigos esto es aceptable. Si se quiere privacidad pre-carrera,
añadir policy: `FOR SELECT USING (auth.uid() = player_id OR EXISTS (SELECT 1 FROM races WHERE id = race_id AND race_date <= NOW()))` 

### TC-22 · Manipulación de scores
**Riesgo:** Usuario manipula `scores` directamente via API  
**Mitigación:** `supabase/patches/security-pre-prod.sql` elimina INSERT/UPDATE de scores para usuarios autenticados  
**Verificar:** POST a `/rest/v1/scores` con JWT de usuario normal → debe fallar

### TC-23 · Acceso sin autenticación
**Pasos:**
1. Abrir la app sin estar logueado  
**Esperado:** Redirige a Login, no expone datos

---

## 7. ADMIN

### TC-24 · Subir resultados de una carrera (pendiente de implementar)
**Pendiente:** La página `/admin` no existe aún.  
**Alternativa temporal:** Usar el SQL Editor de Supabase o crear un script `npm run results:upload`

---

## 8. DECISIONES DE DISEÑO A CONFIRMAR ANTES DE PUBLICAR

| # | Decisión | Estado |
|---|----------|--------|
| D1 | ¿Usernames únicos o duplicados permitidos? | Sin constraint actualmente |
| D2 | ¿Qué pasa con empates en el leaderboard? | Sin criterio definido |
| D3 | ¿Las predicciones de otros son visibles antes del deadline? | Sí (RLS actual) |
| D4 | ¿0 pts o "no participó" para quien no predijo? | 0 pts implícito |
| D5 | ¿Cómo se registran los resultados? ¿Admin page o script? | Pendiente |

---

## CHECKLIST PRE-LANZAMIENTO

- [ ] Ejecutar `supabase/patches/security-pre-prod.sql` en Supabase
- [ ] Correr `npm run clean:demo` para eliminar datos de prueba
- [ ] Deploy en Vercel, configurar variables de entorno (solo VITE_*, NO service_role)
- [ ] Actualizar Site URL y Redirect URLs en Supabase Auth
- [ ] Invitar a los amigos via Supabase → Authentication → Users → Invite
- [ ] Después de que todos se registren: desactivar "Allow new users to sign up"
- [ ] Confirmar reglas con el grupo antes de la temporada
