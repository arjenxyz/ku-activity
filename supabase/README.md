# Supabase — Event Management System

## Important

- **Do not** apply these migrations to the old CrewLedger database.
- Create a **new empty** Supabase project.
- Archived CrewLedger SQL lives in `_archive_crewledger_migrations/` (reference only).

## Apply

1. Create a new Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
3. Run in order:
   - `migrations/001_event_foundation.sql`
   - `migrations/002_rls_policies.sql`

## Promote an admin

After first signup (default role = `student`):

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin@example.com';
```

## Security notes

- QR check-in: store only `checkin_token_hash`; never put PII or guessable IDs in QR.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
