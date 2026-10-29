# Going live: Supabase + Vercel

Follow these steps in order. Each one takes a few minutes.

---

## 1. Set up the database (Supabase)

You need all 5 files in `supabase/migrations/`, applied in this order:

1. `20261022000000_initial_schema.sql`
2. `20261024000000_refined_mvp_schema.sql`
3. `20261027000000_complete_backend_schema.sql`
4. `20261028000000_schema_harmonization.sql`
5. `20261029000000_launch_fixes.sql` ← **new; fixes sign-up, access and security**

**Option A — SQL Editor (no tools needed).** Supabase → SQL Editor → New query.
Paste the whole content of file 1 → **Run**. Repeat for files 2, 3, 4 and 5.
- Each file runs as one transaction. If one fails, nothing from that file is
  saved; read the error and stop.
- **Already ran files 1–4 earlier?** Just run file 5.

**Option B — Supabase CLI.**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```
```bash
supabase db push
```

To check before touching Supabase, run the same migrations against a local
test database (nothing is sent anywhere):
```bash
npm run test:db
```

## 2. Authentication settings (Supabase → Authentication)

**URL Configuration**
- **Site URL:** `https://YOUR-DOMAIN` (your Vercel domain, e.g. `https://homeo-circle.vercel.app`)
- **Redirect URLs:** add these
  - `https://YOUR-DOMAIN/**`
  - `http://localhost:5173/**` (local development)

**Email (Providers → Email)**
- Works with "Confirm email" **on or off**.
  - **On:** after signing up, people get an email. The link brings them back to the sign-in page.
  - **Off:** after signing up, people go straight to the sign-in page.

**Google (Providers → Google)**
1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → Web application.
2. Authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Copy the Client ID and Client Secret into Supabase → Providers → Google → Enable.

## 3. Create your admin account

1. Sign up on the website with your own email (email or Google).
2. Supabase → SQL Editor → run (with your email):
   ```sql
   CALL public.provision_first_super_admin('you@example.com');
   ```
3. Sign out and back in. You now have the Admin panel at `/admin`.

This works only once. Promote further admins from Admin → Members.

## 4. Admin review function (optional but recommended)

Admins can review applications without it. The function adds a server-side
check and runs reviews with the service key, which never reaches the browser.
```bash
supabase functions deploy review-application
```

## 5. Publish on Vercel

1. Vercel → Add New → Project → import `ankushk00024-coder/homeo-circle-`.
2. Framework: **Vite** · Build command: `npm run build` · Output: `dist`.
3. Settings → Environment Variables (Production **and** Preview):

   | Name | Value (Supabase → Project Settings → API) |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL |
   | `VITE_SUPABASE_ANON_KEY` | `anon` / publishable key |

   ⚠️ Never add the `service_role` key to Vercel.
4. Settings → Git → Production Branch: `main`. Every push to `main` now redeploys.
5. Deployments → **Redeploy**. Environment variables only apply to new builds.

## 6. Check it works (5 minutes)

- [ ] Home page loads; "Explore the community" and "Join the Circle" work.
- [ ] Sign up with a new email → you land on the **sign-in** page with a success message.
- [ ] Sign in with that email → you land in **Community** and see "What describes you best?".
- [ ] Pick Doctor / Student / Researcher → Save → the message disappears.
- [ ] Settings shows the same account type in the dropdown.
- [ ] Sign out → "Continue with Google" → you come back signed in.
- [ ] Your admin account opens `/admin`. Admin → Applications can verify, decline, or ask for more information.

If sign-up shows **"Database error saving new user"**, file 5 has not been applied yet.
