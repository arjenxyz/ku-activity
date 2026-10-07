# EVENT MANAGEMENT SYSTEM

Kastamonu Üniversitesi Turizm Fakültesi Öğrenci Etkinlik Yönetim Sistemi.

Built on the CrewLedger **visual design system** with a clean event-management domain.

## Phase 1 foundation

- Design chrome preserved (AdminShell, TopBar pattern, Table, StatCard, auth styles)
- CrewLedger business logic removed
- Routes: `/login`, `/admin/*`, `/staff/*`, `/student/*`
- New Supabase schema in `supabase/migrations/` (apply to a **new empty** project only)

## Setup

```bash
cp .env.example .env.local
# Fill NEW Supabase project keys — do not use the old CrewLedger database
npm install
npm run dev
```

See [supabase/README.md](supabase/README.md) for migration instructions.
