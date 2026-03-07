# 📱 F1 Arsenal Fantasy — Pantallas & UX

Documento de referencia para el diseño UI en Google Stitch.

---

## Flujo general

```
Login (magic link)
    ↓
Dashboard / Home
    ├── → Hacer Predicción  (botón activo solo hasta 1h antes de la carrera)
    ├── → Tabla General (standings)
    ├── → Calendario F1 2026
    ├── → Carrera específica → Predicciones de todos + breakdown
    └── → Mi Perfil
```

---

## Pantallas

### 1. LOGIN
**Propósito:** Única puerta de entrada. Solo usuarios invitados.
- Logo + nombre de la app
- Input de email
- Botón "Enviar link de acceso"
- Estado post-envío: confirmación visual de que se mandó el email
- Nota: "Solo participantes invitados pueden acceder"

---

### 2. DASHBOARD / HOME
**Propósito:** Pantalla principal post-login. Vista rápida del estado de la temporada.

**Secciones:**
- **Header:** Saludo con nickname del usuario + avatar (iniciales)
- **Próxima carrera card:**
  - Nombre del GP, circuito, bandera del país
  - Countdown timer (días, horas, minutos)
  - Estado del formulario: "🟢 Predicción abierta" o "🔒 Cerrado" (1h antes)
  - CTA: botón grande "Hacer mi predicción" (deshabilitado si cerrado o ya enviaste)
  - Si ya enviaste: badge "✅ Predicción enviada" + hora de envío
- **Ranking rápido:** Top 3 de la temporada con puntos
- **Última carrera:** Resultado del último GP con tu posición y puntos obtenidos

---

### 3. HACER PREDICCIÓN
**Propósito:** Formulario para elegir Top 10 antes de cada carrera.

**Elementos:**
- Header con nombre del GP y deadline countdown
- 10 filas numeradas (P1 a P10)
  - P1-P5 visualmente diferenciadas (oro/amarillo) = 10 pts base
  - P6-P10 diferenciadas (plata/azul) = 5 pts base
- Cada fila: dropdown/selector de piloto con:
  - Número de piloto
  - Nombre
  - Color de equipo como indicador visual
- Validación: no puedes repetir piloto
- Resumen de reglas visible (colapsable)
- Botón "Enviar predicción" / "Actualizar predicción" si ya existe una
- Si el deadline pasó: pantalla bloqueada con mensaje explicativo

---

### 4. TABLA GENERAL (STANDINGS)
**Propósito:** Ranking acumulado de toda la temporada.

**Elementos:**
- Header: "Temporada 2026 · S/ [total bote] en juego"
- Tabla con:
  - Posición (medallas para top 3)
  - Nickname + avatar
  - Puntos totales
  - Número de carreras jugadas
  - Flecha de tendencia (subió/bajó desde última carrera)
- El usuario logueado aparece highlighted
- Lista de carreras disputadas (links a detalle de cada una)

---

### 5. DETALLE DE CARRERA
**Propósito:** Ver resultados, predicciones de todos y breakdown de puntos de esa carrera.

**Secciones:**
- Header: Nombre GP, fecha, circuito
- **Resultado real:** Grid con P1-P10 del resultado real (con colores de equipo)
- **Ranking de esta carrera:** Lista de jugadores ordenados por puntos en esa carrera
  - Expandible por jugador para ver su predicción vs realidad
  - Por cada posición: predicción, resultado real, puntos base, bono, total
  - Íconos 🎯 para aciertos exactos
- **Comparador:** Ver predicción de cualquier jugador

---

### 6. MI PERFIL
**Propósito:** Configuración de cuenta y estadísticas personales.

**Elementos:**
- Avatar con iniciales (o foto futura)
- Nombre completo + nickname editable
- Email (no editable)
- **Estadísticas personales:**
  - Puntos totales temporada
  - Posición actual en el ranking
  - Mejor carrera (GP + puntos)
  - Total de predicciones exactas (🎯) en la temporada
  - Piloto más acertado en el Top 5
- Historial carrera a carrera:
  - Tabla: GP | Puntos | Posición en esa carrera | Predicciones exactas

---

### 7. CALENDARIO F1 2026
**Propósito:** Ver todas las carreras de la temporada con su estado.

**Elementos:**
- Lista de los 24 GPs del calendario 2026
- Cada carrera muestra:
  - Número de ronda
  - Bandera + nombre del país/circuito
  - Fecha
  - Estado: Completada ✅ / Próxima 🔜 / Pendiente ⏳
  - Si completada: link a detalle de carrera
  - Si es la próxima: badge "SIGUIENTE" + estado de predicción del usuario

---

## Paleta de colores

| Elemento | Color |
|----------|-------|
| Fondo principal | `#15151E` (negro F1) |
| Fondo cards | `#1E1E2E` |
| Acento principal | `#E10600` (rojo F1) |
| Top 5 / oro | `#F5D25D` |
| P6-P10 / plata | `#6B9BF4` |
| Texto principal | `#FFFFFF` |
| Texto secundario | `#9CA3AF` |
| Éxito / exacto | `#22C55E` |
| Error / cerrado | `#EF4444` |

---

## Notas para el diseño

- **Mobile-first:** El grupo usará esto desde el celular principalmente
- **Dark mode only:** Temática F1, siempre oscuro
- **Fuente sugerida:** Inter o similar sans-serif limpia
- **Iconografía:** Emojis de banderas para países, 🏎️ para la app, 🎯 para exactos
- **Animaciones:** Subtle — solo en el countdown y en el reveal de puntos
