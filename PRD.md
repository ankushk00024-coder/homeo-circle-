PRODUCT REQUIREMENTS DOCUMENT

National Homeopathy Community

A verified, members-only professional network for registered homoeopathic practitioners in India

| Document detail | Decision |
| --- | --- |
| Version | v1.0 — implementation-ready working draft |
| Primary audience | Registered homoeopathic practitioners in India |
| Product type | Responsive web application |
| Frontend | React + TypeScript + Tailwind CSS (Antigravity-assisted development) |
| Backend | Supabase: PostgreSQL, Auth, Storage and Row Level Security |
| Deployment | Vercel or another compatible host; confirm before deployment |
| Admin panel | Included as a protected area of the same application |
| Launch approach | Build in phases; core product first, admin workflows after the member experience foundation |
| Brand | Working name only; final brand/domain to be supplied by the client |

Purpose: give Antigravity a clear scope, architecture, screens, data model, security rules and acceptance criteria so it can build consistently without inventing extra features.

## 1. Executive summary

Build a trustworthy, mobile-friendly professional community exclusively for homoeopathic practitioners whose registration can be verified against the relevant official register. The website should help approved members connect with peers, participate in professional discussions, discover events and opportunities, and access curated knowledge. The product is not a patient-care service, a public social network, or a claim that membership verifies clinical competence.

The MVP must prioritize secure access and a usable member experience over feature count. Supabase is the source of truth for authentication, data, storage and permissions. Admin capabilities must be implemented in the same application behind server/database-enforced role checks; a hidden frontend route alone is not security.

## 2. Product goals

- Provide a private, verified professional space for registered homoeopathic practitioners in India.
- Make it straightforward to apply, review verification status, and access the community after approval.
- Enable useful peer exchange through profiles, discussions, events, opportunities and knowledge posts.
- Give authorized administrators tools to review applicants, manage members and moderate content.
- Protect registration documents, personal details and any sensitive information through data minimization and access controls.
- Keep the MVP affordable and maintainable; prefer simple, tested workflows over unnecessary integrations.
## 3. Non-goals for the MVP

- No patient accounts, public patient advice, diagnosis, treatment booking or telemedicine.
- No AI diagnosis, treatment recommendation, remedy prescription or claims that community posts prove treatment effectiveness.
- No native iOS/Android application.
- No automated verification API unless an official, lawful and reliable integration is separately confirmed.
- No paid memberships, payments, subscriptions, ads, sponsored listings or course marketplace in v1.
- No public access to private posts, member directory, registration documents or internal member details.
- No complex real-time chat, video calling or direct messaging in the first release.
## 4. Users and roles

| Role | Access and responsibilities |
| --- | --- |
| Public visitor | Can view public landing pages, eligibility, privacy, community rules and the application entry point. Cannot view private content or the member directory. |
| Applicant | Can submit an application and view their own application status. Must not access member content while pending or declined. |
| Verified member | Can view and edit permitted profile fields, browse the member directory, read/create discussions, comment, browse events/opportunities, and report content. |
| Moderator | Can review reported content and hide/remove content within assigned permissions. Cannot access verification documents unless explicitly authorized. |
| Admin | Can review applications, approve/decline/hold applicants, manage member status, publish/edit listings, moderate content and view basic operational metrics. |
| Super admin | Can manage administrator roles and high-impact configuration. Assign to as few trusted people as possible. |

## 5. Primary user journeys

### 5.1 Applicant journey

1. Visitor reads the purpose, eligibility criteria, privacy summary and community rules.
1. Visitor submits full name, contact information, registration number, state/authority and consent to credential verification.
1. Application is stored as pending; the applicant receives an on-screen confirmation.
1. An authorized admin checks the relevant official register. If unclear, the admin requests clarification or keeps the application on hold.
1. Admin approves or declines the application and records the decision and reason internally.
1. Only approved applicants with an active account can access private member pages. Declined or suspended users cannot access member data.
### 5.2 Verified member journey

1. Member signs in and lands on a welcoming dashboard with recent discussions, upcoming events and current opportunities.
1. Member completes a professional profile with professional interests and optional experience fields.
1. Member browses the directory, filters by state/interests, and opens member profiles that are intended to be visible to members.
1. Member creates a discussion or asks a professional question, then receives replies through the website.
1. Member discovers an event or opportunity and follows its source/registration link.
1. Member can report content or update their profile/privacy settings.
### 5.3 Admin journey

1. Admin signs in through the normal authentication system and passes a database-backed admin authorization check.
1. Admin sees counts for pending applications, active members, open reports and upcoming/past-due listings.
1. Admin opens an application, reviews only necessary verification details and records a decision.
1. Admin publishes or updates events/opportunities and records source URLs and deadlines.
1. Admin handles reports, records actions, and can suspend or reactivate accounts where justified.
## 6. Information architecture and pages

| Route / page | Purpose and required UI |
| --- | --- |
| / | Public landing page: clear value proposition, benefits, how verification works, eligibility, CTA to apply, FAQs, footer links. |
| /about | Mission, community scope and what membership verification does and does not mean. |
| /eligibility | Who can apply, acceptable registration authorities/registers, review process and appeal/contact path. |
| /apply | Accessible application form with validation, consent and privacy notice. |
| /application-status | Authenticated applicant-only status page; reveal only the current user's own status and next steps. |
| /login | Sign-in form, password reset and clear error states. |
| /dashboard | Verified-member home: recent discussions, events, opportunities, announcements and onboarding checklist. |
| /community | Member-only discussion feed with categories, pagination and create-post flow. |
| /community/:postId | Post detail, comments/replies, report action and author details allowed by profile privacy settings. |
| /members | Member-only searchable directory with safe filters such as name, state and professional interests. |
| /members/:id | Member profile page showing only approved, member-visible fields. |
| /events | Member-only event listing with date, format, organizer, source and registration link. |
| /opportunities | Member-only jobs, fellowships, research calls and collaborations with eligibility, deadline, source and last-checked date. |
| /knowledge | Curated research/knowledge posts with source links, study type/limitations where relevant; not medical advice. |
| /profile | Current member's profile editor and privacy preferences. |
| /settings | Account settings, password reset entry, notification preferences if implemented, account deletion/contact process. |
| /admin | Protected admin overview and links to management modules; access enforced beyond frontend routing. |
| /admin/applications | Application queue with filters by status/date/state; detail view and approve/hold/decline actions. |
| /admin/members | Search members, view status, suspend/reactivate, inspect basic audit history. |
| /admin/content | Manage posts, categories, reports and moderation decisions. |
| /admin/events | Create/edit/publish/archive events. |
| /admin/opportunities | Create/edit/publish/archive opportunities; track deadline and last-checked date. |
| /admin/knowledge | Create/edit/archive curated knowledge posts with sources. |
| /admin/settings | Restricted admin role management and basic community settings; super-admin only. |
| /privacy | Privacy policy page with data collected, purpose, access, retention, contact and deletion/appeal path. |
| /community-rules | Conduct, privacy, promotion, patient information, research claims and moderation rules. |
| /terms | Terms of use and eligibility terms, reviewed by the client/legal adviser before public launch. |
| Not found / access denied | Friendly 404, unauthenticated redirect, pending/declined/suspended state and forbidden-access screens. |

## 7. Functional requirements

### 7.1 Authentication and access

- Use Supabase Auth for account creation/sign-in and password recovery. Choose email/password as the baseline; email OTP/magic link may be added if configured and tested.
- An authenticated account is not automatically a verified member. Maintain separate account/authentication state and practitioner-verification status.
- Every protected page must check the current session and eligibility/role. Private database tables must have Row Level Security (RLS) enabled.
- Only an approved, active practitioner can read or write member-only content. Pending, declined, suspended and deleted users must be blocked.
- Do not expose the Supabase service-role key in frontend code, client bundles, public environment variables or browser requests.
- Admin actions must be authorized server-side or by secure database policies, not merely by hiding buttons or routes.
- Handle loading, expired sessions, network errors, duplicate accounts and password reset states clearly.
### 7.2 Practitioner verification

- Collect only required fields: full legal name, email, phone if necessary, registration number, registration authority/state, consent to verification, and optional minimum supporting evidence when official records cannot resolve the application.
- Application status values: draft (optional), submitted, pending_review, needs_information, verified, declined, suspended. Keep status transitions controlled.
- Verification must be manual in v1: admin checks the relevant official state register or National Register for Homoeopathy as applicable and records the source/check date and outcome.
- A degree certificate, social-media account, referral or self-asserted registration number alone is not sufficient proof of registration.
- Only authorized reviewers may access supporting documents. Never show documents or registration numbers publicly by default.
- Display a 'Verified Homoeopathic Practitioner' badge only for approved accounts. Add explanatory text: verification confirms registration status was checked, not clinical competence or endorsement.
- Provide a way to request correction/appeal and re-review unclear records. Record admin, timestamp and decision notes.
- If official register access is unavailable, keep the application pending or request limited additional evidence; do not silently approve.
### 7.3 Member profiles and directory

- Profile fields: display name, profile photo (optional), state/region, registration authority (member-visible only if appropriate), professional interests, experience range (optional), clinic/institution (optional), short bio and preferred contact method (optional).
- Keep registration documents, personal phone/email, internal review notes and full registration identifiers private by default.
- Members can edit their own permitted profile fields; admins can moderate profile abuse.
- Directory filters: name search, state/region, interest/category. Do not build a public search index of private profiles.
- Include empty states and privacy-friendly defaults. Never display fields marked private.
### 7.4 Discussions and comments

- Members can create a post with title, body, category and optional source link. Support text-only posts in v1.
- Members can comment/reply, edit their own posts where appropriate, and report posts/comments.
- Categories may include General Discussion, Practice & Professional Life, Research & Publications, Events & Conferences, Career & Collaboration, and Community Announcements.
- Use pagination or bounded queries; do not load the entire feed at once.
- No patient-identifying details, patient photographs, private consultation screenshots, spam, impersonation or undisclosed advertising.
- Add a clear disclaimer that peer discussion is not a substitute for professional judgment and does not establish treatment effectiveness.
- Moderators/admins can hide or remove content, record the reason, and review reports.
### 7.5 Events, opportunities and knowledge

- Events fields: title, summary, organizer, start/end date and time, timezone, online/offline format, location or meeting link (if suitable), eligibility, registration URL, source URL, publication status and last-checked date.
- Opportunity fields: title, type, organization, description, eligibility, location/mode, deadline, source URL, contact/application URL, status and last-checked date.
- Knowledge fields: title, summary, source URL, author/editor, publication date, content type, key limitations and review status.
- Only admins or approved contributors may publish in v1; public submissions can be a later feature.
- Expired opportunities should be labelled expired or archived. Admins must be able to correct or remove inaccurate listings.
- Do not present an anecdote, testimonial, single preliminary study or unreviewed post as definitive proof of effectiveness. Show source links and limitations.
### 7.6 Reporting and moderation

- Members can report a post/comment/profile with a reason and optional note.
- Report status values: open, under_review, resolved, dismissed.
- Admins/moderators can view reports, hide/remove content, warn a user or request review; suspension is admin-only.
- Record key actions in an audit log: application decisions, role/status changes, content removal, suspensions and admin changes.
- Do not let a reporter see private admin notes or other users' reports.
### 7.7 Notifications

- MVP baseline: in-app status feedback and clear confirmation screens.
- Optional phase-one email notifications: application received, additional information requested, approved, declined and password reset. Configure only after provider settings and sender identity are confirmed.
- Do not promise email delivery until the provider is configured and tested. Keep notifications free-tier compatible where practical.
## 8. Admin panel requirements

Build the admin panel as part of the same responsive application, with a distinct navigation layout. All admin pages and actions must be protected by verified admin roles in Supabase/database policies or trusted server functions.

| Admin module | Minimum requirements |
| --- | --- |
| Overview | Counts: pending applications, verified active members, open reports, published events, active opportunities. Counts must come from actual data. |
| Application review | Queue; status/state filters; detail view; official source/check date; approve, request information, decline, appeal/re-review; decision reason; audit record. |
| Member management | Search by name/email or registration authority as permitted; view status; suspend/reactivate; show safe profile fields and key audit events. |
| Content moderation | List posts/comments/reports; review, hide/remove, resolve/dismiss reports; capture reason. |
| Events | Create, edit, publish, unpublish, archive; validate dates and URLs. |
| Opportunities | Create/edit/publish/archive; deadline and last-checked fields; expired listing state. |
| Knowledge | Create/edit/archive research and educational posts; source links and limitation fields. |
| Admin roles | Super-admin only; least-privilege assignment; never allow a user to grant themselves elevated privileges. |
| Audit log | Who did what, when, and on which record for important administrative actions. |

## 9. Suggested Supabase data model

Use PostgreSQL with UUID primary keys, created_at/updated_at timestamps, foreign keys and appropriate indexes. Use migrations in version control. Names may be refined during implementation, but keep the status and security semantics.

| Table | Key fields / purpose |
| --- | --- |
| profiles | id = auth.users.id; display_name; avatar_path; state; bio; interests; institution; experience_range; profile_visibility; created_at; updated_at. Only safe member-visible fields. |
| user_roles | user_id; role enum (member, moderator, admin, super_admin); created_at. Write access restricted to trusted admin/server workflow. |
| practitioner_applications | id; user_id; full_name; registration_number; registration_authority; state; contact details as needed; consent_at; status; submitted_at; reviewed_at; reviewed_by; decision_reason; verification_source; verification_checked_at; internal_notes. |
| verification_documents | id; application_id; private storage path; document type; uploaded_at; retention/deletion status. Restricted to authorized reviewers; do not make bucket public. |
| posts | id; author_id; title; body; category_id; source_url nullable; status (published/hidden/removed); created_at; updated_at. |
| comments | id; post_id; author_id; parent_comment_id nullable; body; status; created_at; updated_at. |
| categories | id; name; slug; type (discussion/event/opportunity/knowledge); active. |
| events | id; title; summary; organizer; start_at; end_at; format; location; registration_url; source_url; status; last_checked_at; created_by. |
| opportunities | id; title; organization; type; description; eligibility; location_mode; deadline; source_url; application_url; status; last_checked_at; created_by. |
| knowledge_posts | id; title; summary; source_url; content_type; limitations; status; published_at; created_by. |
| reports | id; reporter_id; target_type; target_id; reason; note; status; assigned_to; resolution_note; created_at; resolved_at. |
| admin_audit_logs | id; actor_id; action; target_type; target_id; metadata JSONB with minimal non-sensitive detail; created_at. Insert through trusted actions only. |

Implementation note: avoid duplicating sensitive applicant data in public/member profile tables. Use a private application table and, after approval, copy only approved safe fields into profiles. Never put secrets or full documents into audit metadata.

## 10. Security and privacy requirements

- Enable RLS on every table that is reachable through the Supabase client. Write and test policies for select/insert/update/delete; do not rely on frontend conditions.
- Use least privilege. Members may access only member-visible data; applicants may access only their own application status; moderators receive only the permissions they need.
- Use a private Supabase Storage bucket for verification documents and short-lived signed URLs only after an authorization check. Never use public bucket URLs for identity documents.
- Keep SUPABASE_SERVICE_ROLE_KEY and any other server secrets exclusively in trusted server environment variables. Frontend may use the project URL and anon/publishable key only with correct RLS.
- Validate and sanitize inputs; constrain upload size and file types; rate-limit sensitive actions where supported; guard against spam and oversized content.
- Do not collect patient records. Add a warning on the post composer prohibiting identifiable patient information.
- Publish a privacy notice covering purposes, who can access registration data, retention, correction, appeal and deletion/contact routes. Client should review applicable legal requirements before launch.
- Use HTTPS in production, secure auth/session defaults and no sensitive data in logs or analytics.
- Create test accounts for pending applicant, verified member, declined applicant, suspended member, moderator, admin and super-admin; verify each permission boundary.
## 11. UI/UX and visual direction

- Visual tone: credible, calm, modern and professional; avoid looking like a consumer wellness shop or a generic social-media clone.
- Suggested palette: deep navy/medical blue for trust, white/light neutral surfaces, restrained teal/green for verified status, and accessible contrast for text and buttons. Final brand colours can be adjusted.
- Use clean typography, generous spacing, simple cards, consistent icons, clear page titles and one primary CTA per page.
- Design mobile-first. Forms, directory filters, cards and admin tables must work at narrow screen widths.
- Provide loading skeletons, empty states, success/error messages, confirmation dialogs for destructive actions and clear form validation.
- Accessibility baseline: semantic HTML, keyboard navigation, visible focus states, labels for fields, alt text, sufficient contrast and sensible heading hierarchy.
- Never use fake member counts, fake testimonials, fabricated events or placeholder content that appears real. Seed data must be clearly marked as demo-only and removed before production.
## 12. Technology and repository requirements

| Layer | Requirement |
| --- | --- |
| Frontend | React + TypeScript; use Next.js if server-rendered routes/server functions are needed, otherwise a consistent React setup is acceptable. Tailwind CSS for styling. |
| UI components | Use reusable components and a consistent design system; avoid building every page as a separate one-off. |
| Backend | Supabase PostgreSQL, Supabase Auth, Supabase Storage and RLS. |
| Validation | Use typed validation schemas for forms and server actions where applicable. |
| Environment | Provide .env.example with variable names only; never commit real credentials. |
| Database changes | Version migrations in the repository and document how to apply them. |
| Quality | Lint/type-check/build scripts; meaningful error handling; no dead buttons or pretend integrations. |
| Deployment | Deploy only after environment variables, redirect URLs, RLS and production smoke tests are configured. |

### 13. Suggested environment variables

NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= # server-only; omit unless trusted server code requires it

If using Vite rather than Next.js, use the appropriate VITE_ prefix for browser-safe variables. Never prefix a service-role key with a public/client prefix. Real values must be supplied through local environment configuration or the hosting provider's secret manager.

## 14. MVP scope and phased implementation

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| Phase 0 — Foundation | Inspect repository, confirm framework, set up app shell, routes, design tokens, environment template and Supabase client wrapper. | Project builds; navigation and shared layout work; no secrets committed. |
| Phase 1 — Public site and auth | Landing page, eligibility, rules/privacy pages, apply/login flows, auth state handling. | Public pages render; application submission works; login/logout/reset states handled. |
| Phase 2 — Verification and private access | Application status, admin review workflow, role checks, profiles and RLS policies. | Pending/declined/suspended accounts cannot access private member content; admin can review applications securely. |
| Phase 3 — Community core | Dashboard, directory, discussion feed, comments, report flow. | Verified members can use core community functions; unauthorized data access tests pass. |
| Phase 4 — Opportunities and admin content | Events, opportunities, knowledge listings and their admin CRUD screens. | Admin can publish/edit/archive records; expired listings are labelled; source fields display. |
| Phase 5 — QA and handover | Responsive polish, security checks, test data cleanup, deployment, README and client handover. | Production build passes; role matrix passes; setup and handover documentation delivered. |

Build sequentially. Do not begin advanced integrations until the previous phase builds and its acceptance criteria pass. Keep the initial release small enough to test with a handful of real, consenting practitioners.

## 15. Acceptance criteria / definition of done

- The project installs and runs from documented commands on a clean machine.
- The production build and TypeScript checks pass without errors.
- All routes listed as MVP routes exist and have working navigation or a documented reason for deferral.
- A user can submit an application and see only their own status.
- Admin approval is required before a practitioner can access private member routes and data.
- RLS blocks unauthorised access when tested directly through the client/API, not just through the UI.
- Verification documents are private and inaccessible to ordinary members and public visitors.
- Member profile visibility defaults are privacy-conscious; private contact and registration details are not shown by default.
- A verified member can create/read discussions and comments, browse members, view events/opportunities and report content.
- An admin can manage applications, members, content, events, opportunities and reports within their role.
- Critical admin actions are recorded in an audit log.
- Loading, empty, success, error, unauthorized and not-found states are implemented.
- No fake API integration, fake verification, nonfunctional button or demo data is presented as a production feature.
- README covers setup, environment variables, Supabase setup, migrations, RLS policies, seed/test accounts and deployment.
## 16. Test matrix

| Test identity | Expected result |
| --- | --- |
| Public visitor | Can read public pages and apply; cannot read private member tables, posts or profiles. |
| Pending applicant | Can sign in and view own status; cannot read/write member content or directory. |
| Declined applicant | Can view own outcome and appeal/contact route; cannot access private content. |
| Verified active member | Can access permitted member pages and only the data allowed by RLS. |
| Suspended member | Cannot access member-only data or create content. |
| Moderator | Can access assigned moderation queue/actions; cannot change roles or view private verification documents without explicit permission. |
| Admin | Can manage applications and content; cannot grant themselves super-admin if not already authorized. |
| Super admin | Can manage admin roles and high-impact settings; actions are audited. |

## 17. Analytics and success metrics

- Application volume, verification approval/hold/decline counts and median review time.
- Number of active verified members and weekly/monthly returning members.
- Useful posts, comments/replies, and posts receiving a helpful response.
- Event views/registration clicks and opportunities viewed.
- Reports opened/resolved and time to resolution.
- Member feedback and repeat contribution. Do not use follower count as the only success metric.
## 18. Content, legal and operational dependencies

- Client supplies final name, logo, domain, brand assets and approved copy.
- Client identifies who is authorized to verify registrations and which official registers/authorities are applicable by state.
- Client supplies privacy policy, terms and community rules or arranges appropriate review before public launch.
- Client decides application retention periods and who can access verification documents.
- Client provides a real admin email and controls the Supabase/hosting accounts. Prefer client-owned accounts so ownership and billing remain transparent.
- Client supplies genuine initial events, opportunities and knowledge sources. Do not invent listings.
- Confirm whether email notifications are in MVP; if yes, choose a provider and verify sender/domain configuration.
## 19. Decisions that must not be silently invented

- Final brand name, logo, domain and exact colour palette.
- Whether sign-up begins by submitting an application or creating an account first. Recommended default: account + application, then restricted status until verified.
- Which state/national registers will be used and how manual verification is documented.
- Whether members can edit/delete posts after publication and whether comments can be nested.
- Whether a moderator role is needed at launch or only admin/super-admin.
- Email notification provider, sender domain and any paid integrations.
- Final hosting provider and production environment.
## 20. Instructions to Antigravity — build rules

1. Read this entire PRD before changing or creating files. First inspect the existing repository and report the current framework, routes, dependencies and any existing Supabase setup.
1. Do not replace working code or recreate the project from scratch unless the repository is empty or the current structure is unusable. Preserve existing working features.
1. Implement in phases and keep the app runnable after each phase. Start with Phase 0 and Phase 1, then proceed to Phase 2 only after the foundation is checked.
1. Before implementing Supabase, create a clear setup checklist and list the exact dashboard values/credentials the owner must provide. Never invent credentials or claim a connection succeeded unless it has been tested.
1. Create SQL migrations and RLS policies in version control. Explain how to apply them. Enable RLS for all exposed tables and include policies for each role and status.
1. Use mock data only for visual development and mark it clearly as demo data. Do not represent mock verification as real verification. Remove demo data before production.
1. No dead buttons, fake integrations, hard-coded admin bypasses, frontend-only permissions or exposed service-role keys.
1. After each phase, run lint/type-check/build where available, fix errors, and summarize files changed, working features, remaining blockers and manual setup steps.
1. If a requirement is ambiguous, use the safest minimal implementation and document the assumption rather than silently expanding scope.
1. Prioritize a polished, consistent, responsive UI and a functional secure flow over unnecessary animations or excessive features.
## 21. Recommended first Antigravity task

Read the attached PRD completely. First inspect the current workspace and report the existing framework, project structure, routes, dependencies and whether Supabase is already configured. Do not overwrite working code. Then implement Phase 0 only: establish a consistent responsive app shell, design tokens, route structure, reusable navigation/footer, placeholder page layouts for the approved routes, and a README plus .env.example. Use demo placeholders only where necessary and label them. Run the available checks and report exact results. Do not create fake authentication, fake verification or pretend Supabase is connected. Wait for review before moving to the next phase.

## 22. Reference and verification principle

This PRD is based on the previously supplied National Homeopathy Community working requirements, especially the decision to restrict private membership to registered practitioners whose registration is checked against the relevant official register. It translates those requirements into a software-oriented implementation brief. It is not legal advice, a clinical guideline or confirmation that any particular registration database exposes a usable API.

National Commission for Homoeopathy reference noted in the source brief: https://www.nch.org.in/upload/NCH_Manner_of_Preparation_and_Maintenance_of_National_Register_for_Practitioner_of_Homoeopathy_Regulations2022.pdf
