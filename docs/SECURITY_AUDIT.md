# Homeo India — Security review (27-point checklist)

Reviewed 8 November 2026 against the live site (homeoindia.org) and the live
Supabase database. Status: **Fixed** = problem found and fixed; **OK** =
checked, no problem found; **You** = needs a setting only the owner can change;
**N/A** = the site does not have this feature.

No checklist makes a site impossible to hack. This review covers the common
attack routes listed below and was tested; it is not a guarantee.

## How the site is built (why some items work the way they do)

The website is a static React app on Vercel. All data lives in Supabase.
The browser talks to Supabase with the public "anon" key, and **every table is
protected by database rules (Row Level Security)** that decide what each signed-in
person may read or change. So the database rules — not the website code — are
the real security boundary, and most fixes below are in the database
(`supabase/migrations/20261108000000_security_hardening.sql`).

## Results

| # | Check | Status | What was found / done |
|---|---|---|---|
| 1 | Hide API keys and secrets | OK | Only the public anon key is in the website (safe by design with RLS). No service-role key or passwords in code. |
| 2 | Environment variables | OK | Secrets live in Vercel/Supabase settings. `.env` files are git-ignored; only `.env.example` (no values) is committed. |
| 3 | Git history leaks | OK | Scanned every commit: no real keys, tokens or `.env` files ever committed. |
| 4 | Protect admin pages | OK | Admin pages check the admin role in the app **and** every admin action is enforced by database rules (`is_admin()`), so hiding the page is not the only protection. Admin hand-over can only be run from the Supabase SQL editor. |
| 5 | Secure authentication | OK / You | Supabase Auth (email + Google). Passwords handled by Supabase. **You:** turn on *Leaked password protection* (see below). |
| 6 | User permissions | **Fixed** | Members could, by calling the database directly: post under a fake name/qualification, fake like counts, re-publish a post an admin hid, accept their own mentorship request or point it at another doctor, and submit a "verified" application. All blocked now. Each person can still only see/change their own private data (tested). |
| 7 | Login sessions and tokens | OK | Short-lived tokens (1 hour) with automatic refresh; sign-out clears the session. Strong browser rules (item 15) protect the stored session from injected scripts. |
| 8 | Validate inputs | **Fixed** | Added maximum lengths in the forms and in the database (posts, comments, bio, reports, applications, mentorship messages). |
| 9 | XSS | **Fixed** | React escapes all text; no raw HTML is rendered. Links typed by members (website, LinkedIn, post sources, PDFs) could be `javascript:` links — now only `http/https` links are allowed, in both the website and the database. Plus a strict Content-Security-Policy. |
| 10 | SQL injection | OK | No hand-built SQL from user input; all queries go through Supabase's parameterised API. Database functions use parameters / `format(%I)`. |
| 11 | CSRF | OK / N/A | Login is sent as a token header, not a cookie, so other websites cannot make requests as a signed-in member. `frame-ancestors 'none'` also blocks click-jacking. |
| 12 | Rate limiting | **Fixed** | Supabase Auth already limits sign-in/sign-up attempts. Added per-account limits: 15 posts/hour, 60 comments/hour, 300 likes/hour, 50 connection requests/day, 20 mentorship requests/day, 20 reports/day, 5 applications/day. Admins are exempt. |
| 13 | API endpoints | **Fixed** | All tables have RLS. Signed-out visitors could submit verification applications — now sign-in is required. Internal trigger functions can no longer be called through the API. |
| 14 | CORS | OK | Supabase only accepts requests with a valid key and rules still apply; no private responses depend on CORS. |
| 15 | Security headers | **Fixed** | Added Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, COOP, stricter Permissions-Policy (kept nosniff and Referrer-Policy). |
| 16 | HTTPS | OK / **Fixed** | Vercel serves HTTPS only and redirects HTTP. Added HSTS so browsers always use HTTPS. |
| 17 | Debug mode | OK | Production build, no source maps, no `console.log`. "Demo mode" only appears if the site is deployed without its Supabase settings and shows sample data only. |
| 18 | Dependencies | OK | `npm audit`: 0 known vulnerabilities. |
| 19 | Unnecessary code | OK | Only 5 runtime packages, all used. |
| 20 | Exposed files | OK | Only the built site is published; `.env`, migrations, seed and backup files are never deployed. |
| 21 | Database security | **Fixed** | RLS on every table; fixed `search_path` on admin procedures. Verification documents bucket is private (only the applicant and admins). Public buckets hold only photos and research PDFs. |
| 22 | Password hashing | OK | Supabase Auth stores passwords with bcrypt; the app never sees or stores them. |
| 23 | File uploads | OK | Size and type limits enforced by Supabase Storage (images/PDF only, 2–20 MB). No SVG/HTML allowed. Members can only upload to their own folder; research files are admin-only. Images are re-compressed in the browser. |
| 24 | Payments and webhooks | N/A | No payments. |
| 25 | Unsafe server requests (SSRF) | N/A | The server never fetches user-supplied URLs. |
| 26 | Monitoring and backups | **Fixed** / You | Every admin/moderator role change is now written to the admin audit log (as are approvals and admin hand-overs). **You:** backups — see below. |
| 27 | Full audit | Done | This document. 93 automated database security tests pass (`npm run test:db`); live database checked with rolled-back test transactions. |

## Owner actions (only you can change these)

1. **Leaked password protection** — Supabase → Authentication → Providers →
   Email (or Auth → Password security): turn on *Prevent use of leaked
   passwords*; set minimum password length to 8+. (Needs the Pro plan.)
2. **Auth URLs for the new domain** — Supabase → Authentication → URL
   Configuration: Site URL `https://homeoindia.org`; add
   `https://homeoindia.org/**` and `https://www.homeoindia.org/**` to Redirect URLs.
3. **Backups** — the Free plan has no automatic backups you can restore. The
   Pro plan adds daily backups (7 days). Until then, download a backup now and
   then: Supabase → Database → Backups, or `supabase db dump`.
4. **Two-factor login** on the accounts that control the site: GitHub, Vercel,
   Supabase, and the Gmail used as admin.
5. Keep admin access to as few accounts as possible.

## Accepted by design

- `profile_public_view` runs with elevated rights on purpose: it shows only
  safe directory fields (no email/phone) and filters by each profile's
  visibility setting.
- `is_admin()` / `is_active_member()` etc. can be called by anyone, but they
  only answer about the caller themselves.
- `review_practitioner_application` is callable by signed-in users but refuses
  anyone who is not an admin.
