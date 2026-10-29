# Database tests

Applies every file in `supabase/migrations/` to an in-memory PostgreSQL 17
(PGlite) with stand-ins for Supabase's `auth` and `storage` schemas and roles,
then acts as real users (visitor, new doctor, Google sign-up, student,
suspended member, admin, Edge Function) to check what each can do.

```bash
npm run test:db
```

Nothing here touches your Supabase project. Run it before pushing any new
migration; it fails on the first SQL error or broken permission.
