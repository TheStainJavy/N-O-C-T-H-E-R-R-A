# Migraciones Supabase — Noctherra

## Orden de ejecución

1. `20250526120000_phase2_extend_schema.sql` — columnas, enums, `ban_reports`, RLS base
2. `20250526120001_phase2_optional_data_migration.sql` — solo si quieres normalizar estados viejos

## Antes de ejecutar

Pega en el SQL Editor el resultado de:

```sql
SELECT table_name, column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

Confirma que existen: `missions`, `chronicles`, `profiles`, `verified_admins`.

Si ya tienes políticas RLS con otros nombres, revisa conflictos antes de correr el script (usa `DROP POLICY IF EXISTS`).

## Enums detectados en tu proyecto

| Enum | Valores relevantes |
|------|-------------------|
| `mission_state` | available, reserved (nuevo), cancelled, + legacy |
| `mission_request_status` | pending, approved, rejected — usado en `ban_reports` |

## Tablas que el código Next.js usa hoy

- `missions`, `chronicles`, `profiles`, `verified_admins`
- Storage: `leer-misiones`

Otras tablas del proyecto (p. ej. `mission_requests` si existe) **no se modifican** en Fase 2.
