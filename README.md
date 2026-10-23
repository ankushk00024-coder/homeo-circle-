# HOMEO CIRCLE — National Homeopathy Community

A verified, members-only professional network for registered homoeopathic practitioners in India, built in strict accordance with the Product Requirements Document (PRD) and official National Commission for Homoeopathy (NCH) verification guidelines.

---

## 1. Visual Design & Aesthetic System

Reproduces the **Indigo + Teal + Paper White** design direction shown in the UI reference:

- **Deep Indigo / Navy (`#0F1E36`, `#1E3A5F`):** Headings, dark admin sidebar, professional identity, and structural framing.
- **Teal (`#0D9488`, `#14B8A6`):** Primary buttons, verified doctor badges, active tabs, and key accents.
- **Paper White & Pale Surfaces (`#FAFCFC`, `#F4F7F6`):** Clean backgrounds with subtle 24px medical grid pattern.
- **Editorial Typography:** High-contrast headings in *Playfair Display (Serif)* paired with *Plus Jakarta Sans* for UI elements.
- **Botanical Hero Artwork:** Custom SVG botanical branch with rich indigo/teal watercolor leaves, delicate leaf veins, and constellation nodes.

---

## 2. Core Features & User Journeys

### 1. Public Portal
- **Landing Page (`/`):** Full hero with botanical artwork, 4 key value pillars (People, Research, Opportunities, Stronger Homeopathy), social proof avatars, target metrics bar (10K+ Practitioners, 500+ Discussions, 200+ Events, 1K+ Opportunities), 3-step verification explanation, and FAQs.
- **About & Governance (`/about`):** Explicit definition of community scope, and what verification does and does not mean (confirms registration status; not clinical competence endorsement).
- **Practitioner Eligibility (`/eligibility`):** Acceptable degrees (BHMS, MD (Hom), DHMS) and statutory state boards/registers recognized under Indian law.
- **Community Rules (`/community-rules`):** Patient de-identification rules under DISHA & DPDP Act 2023, prohibition of miracle cure claims, and commercial spam policies.
- **Privacy Policy (`/privacy`):** Credential collection details, private Supabase Storage buckets, and member profile defaults.
- **Terms of Use (`/terms`):** Professional disclaimers and statutory declaration.

### 2. Authentication & Practitioner Verification
- **Practitioner Application (`/apply`):** Comprehensive registration form collecting legal name, degree, registration number, state council authority, experience, supporting document upload, and statutory declaration consent.
- **Personal Status Tracker (`/application-status`):** Real-time applicant dashboard displaying verification progress (submitted, pending_review, needs_information, verified, declined), review notes, and appeals form.
- **Sign In (`/login`):** Email & password sign-in, password reset flow, documented Google OAuth modal, and 1-click test login presets.

### 3. Private Member Community
- **Member Dashboard (`/dashboard`):** Welcome banner with Verified Practitioner badge, onboarding checklist, recent discussions, and upcoming events.
- **Discussions Feed (`/community`):** Categories filter tabs, modal post composer with mandatory DISHA patient privacy warning, interactive heart likes, comment counters, share link, and save buttons. Right sidebar with discussion search, trending hashtags, and upcoming webinar card.
- **Post Detail (`/community/:postId`):** Full case study reader, author credentials card, comments & reply threads, and "Report Content" modal.
- **Find Members (`/members`):** Searchable peer directory with search by name, specialization, city, state dropdown, and "Connect" button.
- **Member Profile (`/members/:id`):** Safe member-visible profile (bio, clinical focus, affiliated hospital, verified council record).
- **Upcoming Events (`/events`):** Date badges (19 DEC, 11 JAN, 26 JAN), webinar cards, speaker details, and interactive registration modal.
- **Opportunities Board (`/opportunities`):** Job openings, research fellowships, and clinic collaborations with commitment tags and application modal.
- **Knowledge Base (`/knowledge`):** Indexed clinical trials and systematic reviews with explicit study limitation statements and journal DOI links.
- **Profile & Settings (`/profile`, `/settings`):** Privacy controls and notification toggles.

### 4. Admin Management Panel
- **Overview Dashboard (`/admin`):** Live counts for Total Members (248), Pending Applications (12), Discussions (36), Upcoming Events (15), and Recent Applications review queue.
- **Application Review Queue (`/admin/applications`):** Filter by status and state, audit modal with registration number copy, official council register checklist, and Approve / Request Clarification / Decline actions with audit logging.
- **Member Management (`/admin/members`):** Practitioner directory search, status inspection, and account suspension/reactivation.
- **Content Moderation (`/admin/content`):** Post hiding/restoring and report queue resolution.
- **Events Publishing (`/admin/events`):** Create and schedule new CMEs, webinars, and study circles.
- **Opportunities Management (`/admin/opportunities`):** Post and edit job openings and research grants.
- **Research Publishing (`/admin/knowledge`):** Index peer-reviewed studies with mandatory limitation fields.
- **Audit Logs (`/admin/audit-logs`):** Immutable log of all administrative actions, reviewer IDs, timestamps, and metadata.

---

## 3. Technology Stack

- **Frontend:** React 19 + TypeScript + Vite.
- **Styling:** Tailwind CSS + PostCSS + Autoprefixer.
- **Icons:** Lucide React.
- **Routing:** React Router v7.
- **Backend & Auth:** Official `@supabase/supabase-js`.
- **Database & Storage:** PostgreSQL with Row Level Security (RLS) policies and private storage buckets.

---

## 4. Setup Instructions & Running Locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables (Optional)
If you have a Supabase project, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase Project URL and Anon Key:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
> **Note:** If `.env` is omitted or unconfigured, the application automatically runs in **Resilient Local Mock Storage Mode**. All pages, role transitions, application submissions, and admin approvals work instantly without crashing or dead buttons!

### Step 3: Run Development Server
```bash
npm run dev
```

### Step 4: Run Type-Check & Build
```bash
npm run build
```

---

## 5. Supabase Database Migration & RLS Security

The database schema and Row Level Security policies are located in:
`supabase/migrations/20261022000000_initial_schema.sql`

To apply the migration to your Supabase project:
1. Open the **Supabase Dashboard** -> **SQL Editor**.
2. Paste the contents of `supabase/migrations/20261022000000_initial_schema.sql`.
3. Click **Run**.
4. (Optional) Run `supabase/seed.sql` to populate category lookups.

### Security Guarantees:
- **Zero Frontend-Only Security:** Row Level Security (RLS) is enabled on all 12 tables.
- **Restricted Member Content:** Only users with `is_verified_member() = true` can read posts, member profiles, events, and opportunities.
- **Applicant Data Minimization:** Applicants can ONLY read and write their own application record (`auth.uid() = user_id`).
- **Private Documents:** Verification document uploads are saved to private buckets accessible only by authorized verification officers.
- **Protected Admin Panel:** Admin routes and database update operations are locked behind `is_admin()` checks.

---

## 6. Instant QA Role Switcher

A **Dev & QA Testing Banner** is pinned to the top of every screen:
- **Verified Member:** Dr. Ananya Sharma (MD (Hom), 10 yrs, Karnataka Board).
- **Administrator:** Dr. Sanjeev Bannerjee (Super Admin, Review Queue & Moderation).
- **Pending Applicant:** Dr. Rohit Kumar (MD (Hom), Delhi Board, In Review Queue).
- **Visitor:** Unauthenticated public user (Tests public routes and restriction boundaries).

Clicking any button instantly switches the session context, allowing you to test the entire application lifecycle in seconds!
