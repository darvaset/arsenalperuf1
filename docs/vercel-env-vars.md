# Vercel Environment Variables

Variables que debes configurar en:
Vercel Dashboard → tu proyecto → Settings → Environment Variables

## Requeridas para el frontend (todas las deployments)

| Variable | Valor | Notas |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | `https://dtpsvlwqrlbsntpunest.supabase.co` | OK exponer en frontend |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | OK exponer en frontend |

## Requeridas para las API Routes (serverless, solo backend)

| Variable | Valor | Notas |
|----------|-------|-------|
| `SUPABASE_URL` | `https://dtpsvlwqrlbsntpunest.supabase.co` | Igual que VITE_ pero sin prefijo |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (service_role) | ⚠️ NUNCA en el frontend |
| `ADMIN_SECRET` | Elige un string secreto | Solo tú lo sabes. Ej: `arepa-f1-2026` |

## ⚠️ Importante

- `SUPABASE_SERVICE_KEY` es la `service_role` key de Supabase → bypassa RLS → NUNCA la pongas en variables con prefijo `VITE_`
- `ADMIN_SECRET` puede ser cualquier string. Úsalo para triggear `/api/process-results`

---

## Cómo usar el Admin después del deploy

### Opción A — Desde la app (recomendado)
1. Ir a `https://tu-app.vercel.app/admin`
2. Seleccionar la ronda
3. Ingresar tu ADMIN_SECRET
4. Click en "Procesar"

### Opción B — Desde el browser directamente
```
https://tu-app.vercel.app/api/process-results?round=5&secret=TU_SECRET
```

### Opción C — Desde tu laptop (sigue funcionando igual)
```bash
npm run results 5
```

---

## Checklist de deploy

- [ ] Agregar las 5 variables en Vercel
- [ ] Verificar que `ADMIN_SECRET` no sea trivial (no usar "admin" o "1234")
- [ ] Hacer deploy: `git push origin main`
- [ ] Probar `/admin` con la ronda de demo (cualquier ronda ya procesada)
- [ ] Actualizar Site URL en Supabase: `https://tu-app.vercel.app`
- [ ] Actualizar Redirect URLs en Supabase Auth: `https://tu-app.vercel.app/**`
