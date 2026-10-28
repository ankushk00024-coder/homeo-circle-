# Backend changes that the frontend depends on

These files are **not** in `supabase/migrations/` on purpose, so that
`supabase db push` will not apply them automatically. Review them and apply
them deliberately, on a staging copy first.

| File | What it is |
|---|---|
| `20261028000000_schema_harmonization.sql` | Security migration: `profile_public_view`, admin-role escalation fixes, privileged-column guard, the 6-argument `review_practitioner_application` RPC (service-role only), and safe first-super-admin provisioning. Its preflight checks for objects from migrations `20261024000000` and `20261027000000`, which are **not in this repository**. Commit those first, or the preflight will (safely) refuse to run. |
| `verification_queries.sql` | Post-migration checks, each with its expected result. |
| `MIGRATION_RUNBOOK.md` | Transaction behaviour, Edge Function deployment, backup and recovery plan. |

## What the frontend now expects when Supabase is configured

- **Admin reviews** call the Edge Function `review-practitioner-application`
  (`supabase/functions/review-practitioner-application/index.ts`). Deploy it:
  ```bash
  supabase functions deploy review-practitioner-application
  ```
  ```bash
  supabase secrets set ALLOWED_ORIGINS="https://your-domain"
  ```
- **The member directory and member profiles** read from `profile_public_view`, created by the migration.
- **Password reset** emails link to `/reset-password`. Add `https://your-domain/reset-password`
  to Supabase → Authentication → URL Configuration → Redirect URLs.

## Demo mode

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are not set, the app runs in
**demo mode**: sample data in localStorage plus one-click demo profiles on the
login page. As soon as Supabase is configured, demo profiles, keyword logins and
mock-data fallbacks are disabled.

Several features are still **demo-only** even with Supabase configured, because
their data layer never had a database implementation:
- connections listing
- mentorship requests
- in-app notifications
- event registrations
- bookmarks
- reports
- audit logs
- platform settings
- admin create/update for events, opportunities and knowledge posts

They need real tables and queries before launch.
