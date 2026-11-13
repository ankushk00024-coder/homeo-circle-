# Homeo India — Legal, privacy & platform compliance overhaul

Prepared 13 November 2026. This is an engineering report, **not legal advice**. Code was implemented and tested; legal conclusions marked "lawyer review" must be confirmed by a qualified Indian lawyer before relying on them.

## 1. Audit summary (before changes)

**Stack:** React 19 + Vite 8 + Tailwind (static site on Vercel), Supabase (Postgres 17 with RLS, Auth with email/password and Google, Storage). No server code of our own; an unused `review-application` Edge Function exists in the repo but is not deployed. No analytics or advertising scripts.

**Problems found**

| Area | Problem | Risk |
|---|---|---|
| Verification | "Doctor" members were approved on a degree upload only (registration numbers had been removed) yet displayed as verified doctors | Misleading practitioner status |
| Membership | Only doctor/student/researcher; students & interns merged; no graduate category; Terms made every member warrant they were a registered practitioner | Students forced into false declarations |
| Legal pages | Short, generic; invented contact emails (privacy@ / dpo@ / support@homeoindia.in — the site's domain is homeoindia.org); "DISHA" cited as if enacted; deletion only via a non-existent mailbox | Misrepresentation, no working rights workflow |
| Claims | "accredited CMEs", "statutory register", "official council gazette", "exclusively for registered practitioners", a fake meeting link (meet.homeoindia.in), "CME certificate credentials", a defaulted register name ("National Commission for Homoeopathy") shown when none was given | Unsubstantiated claims |
| Consent | No record of what users accepted, when, or which version; no age check; footer "subscribe" box that stored nothing | No evidence of consent |
| Privacy rights | No access/correction/erasure/nomination workflow; no anonymisation | DPDP readiness gap |
| Complaints | No grievance channel or officer details; no appeal route | IT Rules gap (if intermediary) |
| Admin | Any admin could open verification documents and approve; single admin role | Least privilege gap |
| Research | No licence/copyright basis; full-text PDFs allowed without checks | Copyright risk |
| Test content | 5 `@homeocircle.test` accounts and posts named "(Test)"; several junk posts ("wertyui", "g", …) by real accounts | Unprofessional public content |

## 2. What was implemented

### Database (migration `supabase/migrations/20261113000000_membership_and_compliance.sql`, applied live; additive)
- **Membership categories:** `doctor` (Registered Practitioner), `student`, `intern`, `graduate`, `researcher` (Academic).
- **Verification facts kept separate:** `qualification_verified`, `registration_status` (`not_applicable | pending | verified | lapsed | expired | rejected`), `registration_verified_at`, `registration_verification_source`, `registration_valid_until`.
- **Existing data:** the 2 existing "doctor" members were set to `registration_status = 'pending'` (their registration was never checked). Their access did not change; their badge now reads "Qualification Verified — Registration Pending".
- **Review function:** `review_practitioner_application(…, p_registration_verified, p_registration_valid_until)`:
  - only **super admins and verification admins** may call it;
  - registration can be marked verified only for practitioner applications, and only with a recorded source;
  - every decision goes to `verification_reviews` (with category) and `admin_audit_logs`.
- **Lapse and re-verification:** `set_registration_status()` (verification staff only) handles lapsed, expired and re-verified registrations, with audit log entries and a notification to the member.
- **Application rules (server-side):** a category is required, 18+ confirmation is required, and practitioners must give a registration number and authority. Status is always forced to pending.
- **Members cannot change their own verification fields:** registration status, number, authority, qualification-verified flag, status and type.
- **Least-privilege staff roles:** `verification_admin`, `moderator`, `event_manager`, `research_reviewer` (plus the existing `publisher`).
  - **Verification documents:** readable only by the owner, super admins and verification admins.
  - **Moderators:** manage reports; hide or remove posts and comments; cannot edit post text.
  - **Event managers:** manage events. **Research reviewers:** manage research.
  - **Role changes:** `set_staff_role` / `list_staff` (super admins only); every change is audited.
- **Consent:**
  - `policy_versions` (seeded) and an append-only `consent_records` table with a server-side timestamp.
  - Sign-up consents (privacy v2.0, terms v2.0, 18+, optional marketing) are recorded by a trigger from the sign-up metadata.
  - `my_consents()` returns each member's latest answers.
- **Privacy requests:** `privacy_requests` (access, correction, erasure, withdraw consent, nomination, other), with audit and notifications and a limit of 5 per day.
  - `anonymise_member()` (super admin) anonymises the profile, posts, comments and applications, removes connections, notifications and bookmarks, and returns the list of files to delete. The admin screen deletes those files through the Storage API.
- **Grievances:** `grievances` (guests may submit; limit of 5 per email per day; status received → acknowledged → in progress → resolved/rejected, each step timestamped, audited and notified).
- **Reports:** more target types (profile, research, event).
- **Research:**
  - New fields: `licence` (`summary_link | open_access | permission | original`), `copyright_notice`, `publication_date`.
  - A trigger blocks full-text PDFs unless the licence is open access, permission or original work.
- **Events:**
  - New fields: `accreditation_status`, `accreditation_details` (required when accredited) and `certificate_info`.
  - Publishers cannot set accreditation.
- **Directory view:** now exposes `qualification_verified` and `registration_status` only (no contact data).

### Website
- **Registration:**
  - The apply form now has the five categories, each with its own fields, required proof document, category-specific declaration (students and interns are never asked to claim registration), 18+ confirmation, and Terms/Privacy acceptance.
  - The sign-up form has separate 18+, Terms/Privacy and **optional, unticked** marketing checkboxes; the minimum password length is 8; Google sign-in is disclosed.
- **Policy re-acceptance gate:** signed-in members without an accepted current version (older accounts, Google sign-ups) must accept once. The acceptance is stored with its version.
- **Legal section:** `/legal` hub plus Privacy Policy, Terms of Use, Community Guidelines, Verification Policy, Copyright Policy, Clinical Discussion Disclaimer, Grievance & Complaint Policy, and Cookie & Storage Policy.
  - Each shows a version, effective and updated dates, a contents list and cross-links.
  - Operator details come from `src/legal/config.ts`. They are empty and shown as "To be published by the operator" — nothing was invented.
- **Contact & complaints:** `/contact` form, for guests and members, with categories including copyright takedown and appeals. Members can see the status of what they sent.
- **Privacy & your data** (Edit Profile): marketing on/off, download my data (JSON), privacy requests including account deletion with confirmation, and request history.
- **Badges:** one source of truth (`src/lib/membership.ts`); the "Verified Registered Practitioner" badge appears only when registration is verified. Directory, profile and admin screens use it.
  - Specialties are labelled self-reported.
  - Invented fallback text was removed (for example the default register name).
- **Admin:**
  - Applications show category-specific details and a separate "Registration checked against registration records" box, with source and valid-until date.
  - New **Privacy, Complaints & Roles** page with five tabs: privacy requests (with erasure), complaints with a 24-hour acknowledgement flag, registration status, staff roles, and policy versions with acceptance counts.
  - Limited staff roles can open the admin panel but see only their own sections.
- **Moderation:**
  - **Report reasons:** patient data, misleading claims, impersonation, misleading titles, copyright, harassment, spam, confidential information, illegal content.
  - **Composer:** the post composer requires a "no patient-identifiable information" confirmation.
  - **Appeals:** suspended members get an appeal link.
- **Wording:**
  - The homepage, About and Eligibility pages use the "independent academic and professional community" description and the verification and independence statements.
  - Event pages are titled "Academic Events, Webinars and Workshops"; events show "Not accredited — no CME credits" unless an accreditation is recorded.
  - The CME, statutory and DISHA claims and the fake meeting link were removed, as were the footer "subscribe" box and the dead FAQ link.
- **Research:**
  - **Form fields:** copyright basis, publication date, licence line and authors/institution.
  - **Research page:** an "items are not endorsed" note and a copyright report link.

## 3. Test results
- `npm run test:db` — **163 passed, 0 failed** (PGlite, all migrations). New tests cover:
  - **Verification:** 18+ and registration-number rules; self-approval blocked; a general admin cannot approve; a registration needs a source; degree-only approval leads to "pending"; graduate, intern and lapse flows; history and audit.
  - **Consent and privacy:** sign-up consent recorded server-side; consent is append-only; privacy request status is forced; cross-member isolation; erasure.
  - **Complaints:** guest complaints and their rate limit.
  - **Staff roles:** moderator limits; only super admins change roles.
  - **Events and research:** accreditation rules; the publisher's accreditation claim is overridden; the PDF licence rule.
- Live database checks (in transactions that were rolled back):
  - a guest complaint is accepted;
  - a privacy request starts as "received";
  - consent rows can be read back;
  - members cannot read others' complaints.
- **Browser (production build, local):** all 12 legal and public pages render with no page errors and no horizontal overflow on a phone. The apply form shows category-specific fields and validation. The admin compliance page and the privacy centre render.
- **Not tested live:** a real sign-up with email confirmation; Google first sign-in; the re-acceptance modal with a real account; erasing a real account; screen-reader accessibility.

## 4. Legal compliance matrix

| Law / regulation | Applicability | Relevant obligation | Website implementation | Status |
|---|---|---|---|---|
| Digital Personal Data Protection Act, 2023 | Applies: we process digital personal data of people in India | Notice, consent, purpose limitation, security safeguards, rights (access, correction, erasure, grievance, nomination), breach notification | Privacy Policy; consent records with versions; privacy request workflow; erasure and anonymisation; breach procedure; RLS, private documents, audit log | YELLOW — operator details, Data Protection Officer need (only for "significant" fiduciaries) and notice wording need lawyer review |
| DPDP Rules, 2025 (notified 13/14 Nov 2025) | Rules 1, 2 and 17–21 apply now; rules 3 and 5–16, 22–23 apply from 13 May 2027 (date reported by secondary sources) | Itemised notice, security measures, retention and erasure timelines, children's data (verifiable parental consent), breach notification to the Board and individuals | 18+ only; retention table; breach section; rights workflow | YELLOW — verify the dates against the Gazette text; confirm notice format and retention periods |
| Information Technology Act, 2000 and SPDI Rules, 2011 | Apply until the DPDP provisions are in force | Privacy policy; reasonable security practices; sensitive personal data handling | Privacy Policy; security controls | YELLOW — lawyer review |
| IT (Intermediary Guidelines …) Rules, 2021 | Likely applies: the site hosts user content. Whether it qualifies as an intermediary needs confirmation | Publish rules and privacy policy; Grievance Officer with name and contact; acknowledge within 24 h and resolve within 15 days; act on certain takedowns; inform users of the Grievance Appellate Committee | Rules, policy, complaint workflow with timestamps and 24 h flag, appeal path | RED — Grievance Officer name and contact not supplied; timelines need staff |
| CERT-In Directions (28 Apr 2022) | Apply to "body corporates" and intermediaries; applicability to a small platform needs confirmation | Report specified incidents within 6 hours; keep ICT logs for 180 days in India | Breach section mentions CERT-In; logs held by Supabase and Vercel | RED — log retention (provider plans) and incident contacts to be confirmed |
| National Commission for Homoeopathy Act, 2020 | Context: governs who may practise and the registers (s.32–34) | Do not misrepresent registration; practising requires enrolment in a State or National Register | Separate registration verification; independence disclaimer; no implication that membership grants a right to practise | YELLOW — exact State Board/Council names deliberately not listed; confirm wording with a lawyer |
| NCH ethics and professional conduct regulations | Bind registered practitioners | Advertising and professional-communication limits | Terms §8 (conduct); no-advertising rule | YELLOW — lawyer review of current regulations |
| Copyright Act, 1957 | Applies | No infringing uploads; fair dealing limits | Licence field; PDF rule; Copyright Policy; takedown via complaint form | GREEN (code) / YELLOW (legal wording) |
| Consumer Protection Act, 2019 and E-Commerce Rules | Unclear: the service is free | Fair terms; grievance redress; no unfair limitation of liability | Liability clause limited "to the extent permitted by law" | YELLOW — lawyer review |
| DISHA (draft) | **Not enacted** — a draft only | — | All references removed | GREEN |

Sources consulted, all secondary — verify against the Gazette or India Code:
- [PIB note on the DPDP Rules, 2025](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf)
- [Bar & Bench on the DPDP Rules](https://www.barandbench.com/view-point/meity-notifies-final-digital-personal-data-protection-rules-2025)
- [NCH Act text on the Tripura High Court site](https://www.thc.nic.in/Central%20Governmental%20Acts/National%20Commission%20for%20Homoeopathy%20Act,%202020..pdf)
- [India Code entry for the NCH Act](https://www.indiacode.nic.in/handle/123456789/15621)
- [SFLC analysis of the IT Rules, 2021](https://sflc.in/analysis-information-technology-intermediary-guidelines-and-digital-media-ethics-code-rules-2021)
- [Khaitan & Co on the CERT-In directions](https://khaitanco.com/thought-leaderships/Indian-Computer-Emergency-Response-Team-Direction-Paradigm-Shift-in-Cyber-Incident-Reporting)

## 5. Final status

**GREEN — implemented and tested**
- Five membership categories with separate verification facts and badges.
- Registration verified only with a recorded source; lapse and re-verification; history; audit log.
- Self-approval and self-elevation blocked; least-privilege staff roles; verification documents limited to verification staff.
- Consent records (sign-up, 18+, optional marketing, version re-acceptance).
- Privacy requests, erasure/anonymisation, data download.
- Grievance and complaint workflow (guests and members) with a rate limit.
- Research licence rule; event accreditation rule; patient-data confirmation; report reasons.
- Legal hub and 8 versioned documents; claims and fake links removed.

**YELLOW — implemented, needs external confirmation or more testing**
- All legal wording: a review by an Indian lawyer is required.
- Retention periods (12 months for documents, 3 years for inactive accounts and complaints) are proposals and are carried out manually, not by an automated job.
- Erasure removes data in the database; the **login itself must then be deleted** in Supabase → Authentication → Users. Files are deleted through the Storage API by the admin screen.
- Plain "admin" accounts can still edit profiles directly at database level (they are trusted by design); only review approval and document access were narrowed.
- Staff with limited roles see a reduced admin sidebar, but some dashboard widgets may show empty data for them.
- Email verification and the leaked-password check are Supabase dashboard settings (Authentication → Providers/Policies) — confirm they are on.

**RED — awaiting information or decisions from the platform owner**
1. **Operator details** in `src/legal/config.ts`: legal name and address, privacy email, support email, Grievance Officer name, email and address, and the jurisdiction city.
2. **Who handles complaints** within the IT Rules timelines (24 h / 15 days), and who reports CERT-In incidents.
3. **Test content removal (needs your approval):**
   - the 5 `@homeocircle.test` accounts and their posts ("Priya Sharma (Test)", "Aisha Khan (Test)", "Dr. Anil Mehta (Test)");
   - junk posts by real accounts: "wertyui", "vkjsofoe" (ashraf), "qwerzxcvbnmpiue", "g" (Galaxy of podcasts), "hiujjin" (Homeo India Team).
   - I did not delete any of them.
4. **Existing verified "doctors" (2):** ask them for their registration number and authority, then verify in Admin → Privacy, Complaints & Roles → Registration status.
5. **Backups:** confirm the Supabase plan includes backups (the Free plan has none).

## 6. Unresolved legal questions (for counsel)
1. Is Homeo India an "intermediary" under the IT Act and the 2021 Rules, and is it a "significant social media intermediary"? The second is unlikely at its size.
2. Exact DPDP Rules commencement dates and notice format; whether consent for verification documents needs a separate itemised notice.
3. Whether data hosting outside India (Supabase in Japan, Vercel's global network) is acceptable under DPDP (no restricted country list has been published yet).
4. CERT-In log retention: is 180 days in India required for this platform, and how can it be met with the current providers?
5. Current State Board/Council names and registration rules per state, and whether a NEXT/exit test affects "graduate" members.
6. Whether NCH conduct regulations restrict practitioners' self-description (titles, specialties) on such a platform.
7. Retention periods for verification documents and audit logs.
8. Whether any consumer-protection obligations apply to a free service.

## 7. Deployment, environment and rollback
- **Deploy:** push to `main`; then trigger a Vercel production deployment (project `homeo-india`). The database migration is already applied live; it is idempotent and can be re-run in the Supabase SQL editor.
- **Environment variables** (unchanged): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public), optional `VITE_SITE_URL`, `VITE_GOOGLE_SITE_VERIFICATION`. No secrets are used in the browser.
- **Operator details:** edit `src/legal/config.ts` and redeploy. When a policy changes materially:
  1. bump its version in `src/legal/config.ts`;
  2. insert the same version into `policy_versions`;
  3. redeploy — members are then asked to accept again.
- **Rollback, website:** redeploy the previous Vercel deployment ("Promote to production") or `git revert` the commits.
- **Rollback, database:** everything is additive. If needed:
  - restore the previous `review_practitioner_application` from migration `20261031000000_verify_sets_account_type.sql`;
  - restore `stamp_application` from `20261108000000_security_hardening.sql`;
  - restore the old document policy, `"Applicant and admins can view verification documents"`, from the storage migrations.
  - New tables can be left in place safely.
