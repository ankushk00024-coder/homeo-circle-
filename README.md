# HOMEO CIRCLE — National Homoeopathy Community & Professional Platform

A unified, professional platform for registered homoeopathic practitioners, academic researchers/educators, and students across India. Built in strict accordance with the Homeo Circle PRD and official National Commission for Homoeopathy (NCH) verification guidelines.

---

## 1. Visual Design & Aesthetic System

Preserves the signature **Pale-Blue, Navy/Deep Indigo, and Teal** branding:

- **Deep Navy / Indigo (`#0F1E36`, `#162A45`):** Editorial headings, navigation headers, dark admin sidebar, structural framing.
- **Teal (`#0D9488`, `#0D817B`):** Primary action buttons, verified doctor badges, active category tabs, and accents.
- **Pale-Blue & Paper Surfaces (`#F1F7FC`, `#DCEEF8`, `#FAFCFC`):** Serene medical canvas with clean card borders.
- **Editorial Typography:** High-contrast headings in *Playfair Display (Serif)* paired with *Plus Jakarta Sans* for UI elements.
- **Botanical Hero Artwork:** Custom SVG botanical branch with rich watercolor leaves, leaf veins, and constellation nodes symbolizing holistic healing.

---

## 2. Unified Account Architecture & Role Workflows

Homeo Circle features **one unified account system**. Users do not need separate accounts for different areas of the website. 

### "How would you like to join Homeo Circle?"
The unified onboarding flow (`/apply`) allows users to choose from three tailored account pathways:

1. **Doctor / Registered Homoeopathic Practitioner:**
   - Qualifications (BHMS, MD (Hom), DHMS).
   - Central Council (NCH) or State Board registration number & authority.
   - Clinical specialization, experience years, clinic/hospital affiliation, professional bio.
   - Verification status: Starts in **Pending** review. Verified by admins against statutory council gazettes.

2. **Student Member:**
   - Homoeopathic medical college or university affiliation.
   - Academic stage (1st, 2nd, 3rd, 4th/Final Year BHMS, Rotatory Internship, MD Scholar).
   - Clinical mentorship interests (Case-taking, Organon rubrics, chronic pathologies).
   - Instant or gated community participation (configurable by administrator).

3. **Academic Researcher / Educator:**
   - Academic institution or research council (e.g. CCRH).
   - Research areas, peer-reviewed publication count, ORCID identifier.
   - Access to submit and peer-review studies in the Research Library.

---

## 3. Core Modules & End-to-End Workflows

### 1. Professional Member Directory & Connect System (`/members`, `/members/:id`)
- **Search & Filters:** Search by name, qualification, state/city, specialization, and clinical interests.
- **Real Connection States:** `Connect`, `Pending`, `Accept`, `Decline`, and `Connected`.
- **Integrity Safeguards:** Prevents self-connection and prevents duplicate pending requests.
- **In-App Notification Workflow:** When a member clicks *Connect*, a real connection request record is created, and an in-app notification is delivered to the recipient with direct **Accept** and **Decline** actions.
- **My Network Tab:** Dedicated tab to manage received connection requests, outgoing sent requests, and established peer connections.
- **Privacy Controls:** Members can toggle visibility between Verified Members Only, Public Directory, or Private.

### 2. Community Discussions (`/community`, `/community/:postId`)
- **Author Controls:** Create, edit, and delete user's own clinical posts.
- **Category Feeds:** General Discussion, Clinical Learning, Research, Student Corner, Practice Management, and Events.
- **Clinical Governance:** Embedded DISHA & NCH compliance warnings on composers; mandatory de-identification of patient names, records, and identifiers.
- **Interactive Engagements:** Heart likes counter, bookmarks (saved posts feed), link sharing, and report modal for clinical inaccuracies or breach of ethics.
- **Nested Comments:** Threaded replies with the ability to delete own comments.

### 3. Dedicated Student Corner (`/students`)
- **Student Dashboard:** Personal academic status, pending mentorship guidance requests, registered webinars, and saved study aids.
- **Discover Clinical Mentors:** Directory of senior practitioners and educators open to mentoring students, with structured "Request Clinical Mentorship" application modal.
- **Study Aids & Materia Medica:** Practical rubrics, Boenninghausen repertorial hints, and clinical case taking tips.
- **Student Webinars & Workshops:** Student-priced and complimentary CME sessions.
- **Internships & Fellowships:** Clerkships, research assistantships, and hospital exposure calls.

### 4. CME Webinars & Events (`/events`)
- **Listings & Categories:** Webinars, National Conferences, Clinical Workshops, State Chapters.
- **Event Registrations:** Store user registrations, prevent duplicate seat claims, and allow user cancellation.
- **"My Registered Events" Tab:** View upcoming confirmed sessions with meeting room URLs accessible upon registration.

### 5. Curated Research & Publications (`/knowledge`)
- **Methodological Transparency:** All indexed studies feature an explicit **Documented Study Limitations** card, DOI links, and journal citations.
- **Submit Research Reference:** Verified doctors, researchers, and admins can submit trials and monographs to the peer library.

### 6. Clinical Opportunities (`/opportunities`)
- **Board:** Associate practitioner openings, student internships, and research grants.
- **Post Opportunity:** Authorized members can publish opportunities with criteria, deadlines, and mode (Remote/On-site/Hybrid).
- **Application Workflow:** Apply with verified profile and receive submission confirmation.

### 7. User Dashboard & Account Settings (`/dashboard`, `/profile`, `/settings`)
- **Role-Adaptive Dashboard:** Displays role badges (Doctor, Student, Researcher, Admin), verification status, pending connection requests, registered events, and saved posts.
- **Profile Completion Meter:** Visual progress bar (0–100%) and checklist (Bio, Specialization, Contact links).
- **Social & Professional Links:** LinkedIn profile, ORCID iD, clinic website, and WhatsApp consultation number.
- **Notification Preferences & Email Transparency:** In-app triggers operate in real time; Settings clearly documents that external email dispatch requires SMTP/Resend server-side configuration.

---

## 4. Protected Admin Panel & Super Admin Provisioning

### Route
The admin console is located at:
```
/admin
```
*(Sub-routes: `/admin/applications`, `/admin/members`, `/admin/content`, `/admin/events`, `/admin/opportunities`, `/admin/knowledge`, `/admin/audit-logs`, `/admin/settings`)*

### Administrative Workflows:
- **Verification Review Queue (`/admin/applications`):** Inspect council registration numbers, copy for gazette search, view submitted qualifications, and take action (Approve, Request Clarification, Decline) with audit logging.
- **Member Directory Management (`/admin/members`):** Search by state/role, adjust role assignments (Doctor, Student, Researcher, Admin), and suspend/reactivate accounts.
- **Content Moderation (`/admin/content`):** Hide/restore clinical posts and resolve reported violations.
- **Verification Policies (`/admin/settings`):** Toggle mandatory verification requirements per role (Doctors, Researchers, Students).
- **Audit Logs (`/admin/audit-logs`):** Immutable log of every administrative decision with actor ID and timestamp.

### Secure Super Admin Provisioning (Zero Client-Side Bypass)
Homeo Circle strictly rejects client-side admin toggles or hardcoded passwords. Administrative privileges are enforced on the backend via PostgreSQL Row Level Security (`is_admin()` helper function).

To provision a Super Admin on your Supabase database:
```sql
-- Execute in Supabase SQL Editor with Service Role permissions:
UPDATE public.profiles
SET 
  role = 'super_admin',
  verification_status = 'verified',
  status = 'active'
WHERE email = 'admin@homeocircle.in';

-- Ensure user role record is present:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'admin@homeocircle.in'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## 5. Technology Stack & Directory Structure

```
├── src/
│   ├── components/
│   │   ├── common/         # Avatar, DevBanner, ProtectedRoute
│   │   └── layout/         # PublicNavbar, MemberNavbar, MemberSidebar, AdminSidebar, Footer
│   ├── context/            # AuthContext (Role switching, unified session)
│   ├── lib/
│   │   ├── mockData.ts     # Initial seed dataset for all roles & entities
│   │   └── supabase.ts     # Dual-engine dataService (Supabase client + LocalStorage fallback)
│   ├── pages/
│   │   ├── admin/          # AdminDashboard, Applications, Members, Content, Settings, AuditLogs
│   │   ├── member/         # Dashboard, Discussions, PostDetail, Members, MemberProfile,
│   │   │                   # Events, Opportunities, Knowledge, StudentsPage, ProfileEdit, Settings
│   │   └── public/         # LandingPage, About, Eligibility, Rules, Privacy, Terms, Apply, Login
│   └── types/              # TypeScript interfaces for all domain entities
├── supabase/
│   └── migrations/
│       ├── 20261022000000_initial_schema.sql      # Core tables & initial RLS policies
│       └── 20261024000000_refined_mvp_schema.sql  # Connection requests, mentorship, notifications, events, settings
├── .env.example            # Clean environment variable template
└── package.json            # Project dependencies (React 19, Vite, Tailwind CSS)
```

---

## 6. Running Locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your Supabase Project URL and Anon Key:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
> **Resilient Dual Storage Engine:** When Supabase environment variables are omitted, the application runs on a persistent local storage engine with pre-seeded multi-role data. All features (posting, editing, connections, notifications, mentorship requests, event registrations, admin approvals) function seamlessly without crashing.

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Run Production Build
```bash
npm run build
```

---

## 7. Instant QA Role Switcher

A **Dev & QA Testing Banner** is pinned to the top of every screen to facilitate testing across all role personas in one click:
- **Doctor (Verified):** Dr. Ananya Sharma (MD Hom, 10 yrs experience, Karnataka Council).
- **Student Member:** Rahul Verma (Final Year BHMS, Nehru Homoeopathic Medical College).
- **Researcher:** Dr. Arjun Nair (Research Scientist, CCRH Central Council).
- **Super Admin:** Dr. Sanjeev Bannerjee (Verification Queue, Policy Toggles, Content Moderation).
- **Pending Applicant:** Dr. Rohit Kumar (Registration undergoing council review).
- **Visitor:** Unauthenticated public user (Tests landing page and protected route gates).
