# Runbook: 20261028000000_schema_harmonization

Status: **not production-ready yet.** It becomes ready only after every check in
`docs/verification_queries.sql` passes on a staging copy, and the Edge Function
tests in §4 pass.

Offline checks already done: every top-level statement and every PL/pgSQL body
parses with libpg_query (the PostgreSQL parser), and the Edge Function passes a
TypeScript syntax check. Nothing has been run against any database. Parsing
does not catch semantic errors (a missing column, a wrong type, a missing
grant). The preflight and the staging run exist to catch those.

---

## 1. What changed compared with the previous draft

| # | Issue in the previous draft | Fix |
|---|---|---|
| 1 | `profile_public_view` was promised in the header but never created. The code made a definer RPC instead. | A `security_invoker` + `security_barrier` view over `app_private.public_profiles()`. That is a definer function in a schema PostgREST does not expose, and it contains the visibility rules. |
| 1 | Anon/members rule relied only on `is_verified_member()`. If that function returns true for anon users or anonymous sign-ins, `members_only` profiles leak. | The function requires `auth.uid()`, the JWT `role = authenticated`, `is_anonymous = false`, **and** `is_verified_member()`. Suspended accounts are hidden from everyone except admins. |
| 2 | Review RPC was granted to `service_role` only, yet it still checked `is_admin()`/`auth.uid()`. A service-role request has no `sub`, so **every review would have failed**. | New 6-arg signature with `p_reviewer_id`. It requires a service-role JWT and re-checks the reviewer in `user_roles`. It locks the row with `FOR UPDATE` and blocks reviewing your own application. Only the Edge Function calls it. |
| 2 | Comment claimed `CREATE OR REPLACE` resets grants. | Wrong: `CREATE OR REPLACE` *keeps* grants. *New* functions get PUBLIC EXECUTE, plus Supabase's default grants to anon/authenticated. All new routines now `REVOKE … FROM PUBLIC, anon, authenticated` explicitly. |
| 3 | The provisioning comment said "session-level" lock. The check-then-insert only raced against other callers of the same procedure. | `pg_advisory_xact_lock` (transaction-scoped, released automatically) **plus** `LOCK TABLE user_roles IN SHARE ROW EXCLUSIVE MODE`, so the admin panel can't race it either. The email must match exactly one auth user, and `ROW_COUNT = 1` on the profile update is checked before any role insert. |
| 4 | Preflight missed columns used by the review RPC and triggers: `reviewed_at`, `reviewed_by`, `verification_source`, `verification_checked_at`, `internal_notes`, `reviewer_name`, `previous_status`, `new_status`, `sender_id`, `title`, `message`, `connection_requests.*`, `mentorship_requests.*`, `reporter_id`, `deadline`, category/settings seed columns, `auth.users.email`. It also had no unique-index check for the `ON CONFLICT` targets, no check that existing CHECKs accept the written values, no check that `is_admin`/`is_super_admin`/`is_verified_member` are SECURITY DEFINER (they are used in RLS on `user_roles`, so a non-definer version recurses), no ownership check and no view-dependency check. A re-run would also fail, because the preflight demanded the 5-arg RPC that the migration drops. | All added. The preflight collects every problem and fails once with the full list. It accepts either RPC signature, so re-runs work. |
| — | **Privilege escalation:** `"Admins can manage user roles" FOR ALL USING (is_admin())` let any admin grant themselves `super_admin`. | Admins manage non-privileged roles only. Granting or revoking `admin`/`super_admin` needs `is_super_admin()`. |
| — | **Privilege escalation:** the preserved profile UPDATE policy lets users write their own row. Nothing stopped `PATCH role=super_admin` or `verification_status=verified`. | `trg_guard_profile_privileged_fields` blocks changes to `role`/`status`/`verification_status` by API roles unless the caller is an admin. Admin-role changes need a super admin. |
| — | Guest/applicant INSERT could set `status='verified'` and the reviewer fields. | INSERT `WITH CHECK` now forbids decided statuses and reviewer fields. |
| — | `posts.author_role DEFAULT 'doctor'` would label every existing student/researcher post as a doctor's. | No default. Backfilled from `profiles.role`. |
| — | `RETURN QUERY` breaks at runtime if a column is `varchar` instead of `text`. | Explicit casts. The preflight checks that `years_of_practice` is an integer type and that the status/role columns are text. |
| — | Unknown permissive SELECT policies on `profiles` would silently re-open full-row access. | An in-migration assertion fails if one exists (admin-only policies are allowed). |
| — | No self-check of the final privilege state. | §11 asserts EXECUTE privileges, the view options and the removed objects. If any is wrong, everything rolls back. |

### Breaking changes the frontend must absorb
1. **Reading other users' profiles from `profiles` now returns only your own row.**
   Directory, feed and author lookups must read `profile_public_view` (or
   `rpc('get_public_profiles')`). PostgREST embeds such as
   `posts?select=*,profiles(*)` no longer return other authors. Fetch authors
   from the view by id (`.in('id', authorIds)`). Or, as a follow-up, add a
   PostgREST computed relationship
   (`create function public.author(posts) returns setof profile_public_view rows 1 …`).
2. **`rpc('review_practitioner_application')` from the browser stops working.**
   Use the Edge Function (§3).
3. Admins who are not super admins can no longer grant or remove `admin`/`super_admin`.

### Known remaining issues (not fixed here; decide before launch)
- Applicants can read their own `internal_notes`, `verification_source` and
  `reviewed_by` through the applicant SELECT policy. RLS is row-level, so fixing
  this needs column privileges or moving those columns to an admin-only table.
- Guests can't upload verification documents: storage policies require `auth.uid()`.
- `profile_public_view` filters are applied after the function returns all
  visible rows. That's fine at MVP scale. Add pagination or a parameterised RPC
  once the directory grows.
- `is_verified_member()` and `is_admin()` definitions come from earlier
  migrations and were not visible to me. Check A1 and the D-series impersonation
  tests to confirm they behave as assumed (true only for eligible, signed-in users).

---

## 2. Transaction behaviour

**Supabase SQL Editor.** The editor sends the whole script as one
multi-statement query. PostgreSQL runs such a query as **one implicit
transaction**:
- If any statement fails, including a preflight `RAISE EXCEPTION` or a §11
  assertion, every earlier statement is rolled back. Nothing is partially applied.
- `SET LOCAL lock_timeout = '10s'` and `statement_timeout = '5min'` apply to that
  transaction only. If a table is busy, the migration fails fast and rolls back.
  It doesn't sit holding an `ACCESS EXCLUSIVE` queue that stalls the app.
- **Do not add `BEGIN`/`COMMIT`.** An explicit `BEGIN` inside the pasted text
  turns the implicit transaction into a normal transaction block. On error, that
  block is left open in an aborted state on a pooled connection.
- The editor shows only the last statement's result and may hide `NOTICE`s.
  Success means "no error". Confirm with the verification queries, not the
  output pane.
- Running it from the editor does **not** record it in
  `supabase_migrations.schema_migrations`. Afterwards, record it so the CLI doesn't
  try to apply it again:
  ```bash
  supabase migration repair --status applied 20261028000000
  ```

**Supabase CLI (`supabase db push`).** The CLI runs the file in its own
transaction together with the history row. The same all-or-nothing guarantee
applies.

**psql.**
```bash
psql "$DB_URL" -X -1 -v ON_ERROR_STOP=1 -f docs/backend/20261028000000_schema_harmonization.sql
```

**Locks taken.** Each `ALTER TABLE … ADD/DROP CONSTRAINT/COLUMN` and
`CREATE TRIGGER` takes a short `ACCESS EXCLUSIVE` or `SHARE ROW EXCLUSIVE` lock
on its table until commit. `ADD CONSTRAINT … CHECK` scans the table while holding
it. Run the migration in a low-traffic window. Expect a few seconds of blocked
writes on `profiles`, `app_notifications`, `user_roles` and `posts` on small tables.

**Re-running.** The migration is idempotent. A second run re-asserts the same
state and leaves data untouched, apart from re-applying the category upsert.

---

## 3. Edge Function deployment

Files:
- `supabase/functions/review-practitioner-application/index.ts`
- `supabase/config.toml` (add):
  ```toml
  [functions.review-practitioner-application]
  verify_jwt = true
  ```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically into
Edge Functions. Never put the key in `.env` files the frontend build reads
(`VITE_*`, `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`), and never commit it.

```bash
supabase secrets set ALLOWED_ORIGINS="https://your-app-domain,https://your-admin-domain"
```

```bash
supabase functions deploy review-practitioner-application
```

Deploy the function **before** or together with the migration. Once the
migration is in, the old browser RPC call stops working.

Frontend (admin panel) call, using the signed-in admin's normal session:
```ts
const { data, error } = await supabase.functions.invoke('review-practitioner-application', {
  body: {
    application_id: appId,
    new_status: 'verified',          // pending_review | needs_information | verified | declined | suspended
    decision_reason: reason ?? null,
    verification_source: source ?? null,
    internal_notes: notes ?? null,
  },
});
```

---

## 4. Edge Function tests (staging)

```bash
curl -i -X POST "$SUPABASE_URL/functions/v1/review-practitioner-application" \
  -H "Content-Type: application/json" -d '{}'
```
Expected: 401 (gateway rejects the request with no JWT).

```bash
curl -i -X POST "$SUPABASE_URL/functions/v1/review-practitioner-application" \
  -H "Authorization: Bearer $MEMBER_JWT" -H "Content-Type: application/json" \
  -d '{"application_id":"00000000-0000-4000-8000-000000000000","new_status":"verified"}'
```
Expected: 403.

```bash
curl -i -X POST "$SUPABASE_URL/functions/v1/review-practitioner-application" \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"application_id":"not-a-uuid","new_status":"verified"}'
```
Expected: 400.

```bash
curl -i -X POST "$SUPABASE_URL/functions/v1/review-practitioner-application" \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d "{\"application_id\":\"$TEST_APP_ID\",\"new_status\":\"needs_information\",\"decision_reason\":\"Upload registration certificate\"}"
```
Expected: 200 `{"success":true,…}`, plus one new row each in
`verification_reviews` and `admin_audit_logs` with `actor_id` = the admin's id.

---

## 5. Backup and recovery plan

### Before running (production)
1. **Confirm a restore point exists.** Dashboard → Database → Backups. On Pro and
   above there are daily backups; enable PITR if this database matters. Note the
   timestamp just before you start.
2. **Take your own logical dump.** It doesn't depend on the platform backup tier:
   ```bash
   supabase db dump --linked -f backup/pre_20261028_schema.sql
   ```
   ```bash
   supabase db dump --linked --data-only -f backup/pre_20261028_data.sql
   ```
   ```bash
   supabase db dump --linked --role-only -f backup/pre_20261028_roles.sql
   ```
   Store these outside the repo. The data dump contains PII.
3. **Snapshot the definitions this migration replaces.** These are read-only
   queries. Save their output, because it's what you'd hand-restore from:
   ```sql
   SELECT p.oid::regprocedure, pg_get_functiondef(p.oid)
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN
      ('review_practitioner_application','bootstrap_super_admin','lookup_guest_application_status',
       'get_public_profiles','sync_profile_avatar_fields','notify_on_connection_request',
       'notify_on_mentorship_request','notify_on_comment');
   SELECT * FROM pg_policies WHERE schemaname IN ('public','storage');
   SELECT conrelid::regclass, conname, pg_get_constraintdef(oid) FROM pg_constraint
    WHERE conname IN ('app_notifications_type_check','user_roles_role_check','profiles_profile_visibility_check');
   SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets;
   ```
4. **Rehearse.** Restore the backup into a scratch project, or create a Supabase
   branch. Apply the migration there, run `docs/verification_queries.sql` and §4,
   and fix anything that fails. Don't promote to production until the rehearsal
   passes.

### If the migration fails while running
Nothing to recover: the transaction rolled back. Read the error. Preflight
errors list every problem at once. Fix the cause and re-run.

### If problems appear after it committed
Choose the smallest tool that fixes the problem:

1. **App breakage from the intended behaviour changes.** Examples: profile
   embeds return nothing, or the admin panel still calls the old RPC. Fix forward
   in the frontend (§1 breaking changes). Don't reopen the profile SELECT policy.
2. **A specific object is wrong.** Write a new forward migration
   (`2026102900000x_fix_….sql`) that recreates that object from the snapshot in
   step 3. Example: restore the old review function body temporarily while the
   Edge Function is being deployed.
3. **Data damage.** Unlikely: the only row changes are backfills that fill NULLs
   and the category upsert. Restore the affected table from
   `pre_20261028_data.sql` into a staging schema and copy the rows back.
4. **Wide failure.** Use PITR to the timestamp noted in step 1. This discards
   every write made after that point, including user signups and posts, so it's
   a last resort. Run it from Dashboard → Database → Backups → Point in time.

Rows written by the migration, in case you need to reverse them by hand:
`app_notifications.link`/`action_url` backfill, `profiles.avatar_url`/`avatar_path`
backfill, `posts.author_role` backfill, 6 `categories` rows (upsert), one
`platform_settings` row (only if it was absent), and the two `storage.buckets`
rows (upsert).
