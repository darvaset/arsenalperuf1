# Prompt para Google Stitch — F1 Arsenal Fantasy

---

## PROMPT PRINCIPAL

Design a mobile-first dark-themed web app called **"F1 Arsenal Fantasy"** — a Formula 1 prediction game for a private group of friends.

**Visual identity:**
- Dark background: `#15151E` (F1-style near-black)
- Card surfaces: `#1E1E2E`
- Primary accent: `#E10600` (F1 red)
- Gold highlight for Top 5: `#F5D25D`
- Blue highlight for P6–P10: `#6B9BF4`
- Typography: Clean sans-serif (Inter or similar), white on dark
- Subtle red left-border or top-bar branding element on the header
- Mobile-first layout (375px base), clean and minimal

Design the following **7 screens**:

---

### SCREEN 1 — Login

A centered login screen with:
- 🏎️ emoji + app name "F1 Arsenal Fantasy" + subtitle "Temporada 2026"
- A dark card with: email input field + "Enviar link de acceso" button in F1 red
- Post-send state: 📧 icon + "Revisa tu correo" confirmation message
- Small footer note: "Solo participantes invitados pueden acceder"

---

### SCREEN 2 — Dashboard / Home

Main screen after login. Greeting header with user nickname and avatar (initials circle).

**Next race card** (prominent, top of screen):
- Country flag emoji + GP name + circuit name
- Countdown timer showing days, hours, minutes in large numbers
- Green "🟢 Abierto" badge OR red "🔒 Cerrado" badge
- Large red CTA button: "Hacer mi predicción"
- If prediction already sent: green "✅ Predicción enviada — hace 2h" chip instead of button

**Quick standings widget** below: Show top 3 players with position medal (🥇🥈🥉), nickname, and total points.

**Last race summary**: Small card with last GP name, user's points earned, and rank in that race.

Bottom navigation bar with icons: 🏠 Home · 🏆 Tabla · 🗓️ Calendario · 👤 Perfil

---

### SCREEN 3 — Prediction Form

Header shows GP name + deadline countdown (small).

**10 position rows:**
- P1–P5 rows: left accent in gold `#F5D25D`, labeled "Top 5 · 10 pts"
- P6–P10 rows: left accent in blue `#6B9BF4`, labeled "Medios · 5 pts"
- Each row: position number badge + driver selector dropdown
- Driver selector shows: team color dot + driver number + last name
- Selected driver shows team color as a thin right-side bar

At bottom: "Enviar predicción" button in F1 red (full width).
If prediction already exists: button reads "Actualizar predicción".
If deadline has passed: entire form is grayed out with a "🔒 Plazo cerrado" overlay message.

---

### SCREEN 4 — Standings (Tabla General)

Header: "Tabla General" + subtitle "Temporada 2026 · S/500 en juego"

Leaderboard table:
- Position medal/number + nickname + avatar circle
- Total points (large, right-aligned)
- Races played count (small, gray)
- Up/down trend arrow
- Logged-in user row highlighted with subtle red left border

Below the table: list of completed races as tappable rows linking to race detail.

---

### SCREEN 5 — Race Detail

Back button + GP name header + date + circuit.

**Official result grid:** Two-column list of P1–P10, each with:
- Position number (P1–P3 in gold)
- Team color bar
- Driver last name
- F1 points earned

**Race ranking section:** Accordion-style list of all players sorted by points in this race.
- Collapsed: shows rank medal + name + points
- Expanded: shows a table breakdown per position:
  - Predicted driver | Actual position | Base pts | Bonus pts | Total
  - 🎯 icon for exact hits, ❌ for misses
  - Green row highlight for exact predictions

---

### SCREEN 6 — My Profile

Avatar circle with user initials (large, centered top).
Editable nickname field + non-editable email.

**Stats cards (2-column grid):**
- 🏆 Rank: "3° de 8"
- 📊 Points: "342 pts"
- 🎯 Exact hits: "7 en la temporada"
- 🏎️ Best race: "GP Japón · 89 pts"

**Race history table:** GP name | Pts | Rank | 🎯 count — one row per completed race, alternating subtle row colors.

---

### SCREEN 7 — F1 2026 Calendar

Header: "Calendario 2026"

List of all 24 Grand Prix rounds:
- Round number chip + country flag emoji + GP name + circuit
- Date (right side)
- Status badges:
  - ✅ Completada (gray, tappable → goes to Race Detail)
  - 🔜 SIGUIENTE (red badge, highlighted row)
  - ⏳ Pendiente (subtle, upcoming)
- For the next race row: also show user's prediction status ("Predicción enviada ✅" or "Sin predicción ⚠️")

---

## ADDITIONAL DESIGN NOTES

- All screens use the same dark `#15151E` background and `#1E1E2E` cards
- The F1 red `#E10600` is used sparingly — only for CTAs, active states, and the top nav bar accent
- Rounded corners on all cards (12–16px radius)
- Subtle white/10% opacity borders on cards
- No gradients except optionally on the next race card header
- Team colors appear only as small accent dots or thin bars — never as backgrounds
- The app should feel like a premium, private club — clean, confident, F1-inspired
- Loading states use a spinning red circle indicator

---

## CONTEXT FOR STITCH

This is a private betting pool app for ~8–12 friends who follow F1. 
Users predict the Top 10 finishers of each race before a deadline (1 hour before race start).
Scoring: 10 pts for correct block (P1–P5 or P6–P10) + F1 official points as bonus for exact position.
Season-long leaderboard. Winner takes the full prize pool at the end of the season.
