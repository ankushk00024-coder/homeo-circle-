# NeoHomeo — Minimal Premium Landing Page & Waitlist Platform

A minimal, editorial, and distinctive landing page for **NeoHomeo**, a digital homeopathic care platform connecting patients with verified homeopathic physicians.

---

## 🎨 Visual Identity & Brand System

- **Lavender** (`#C8B3E8`): Dominant visual identity, pill chips, and brand accents.
- **Chartreuse** (`#D4FF3F`): High-contrast primary call-to-action buttons.
- **Tomato Red** (`#E34234`): Spared for selective alerts, notification badges, and secondary micro-interactions.
- **Near Black** (`#1A1A1A`): Deep typography and high-contrast readability.
- **Soft Lavender Background** (`#F8F3FF`): Calm, breathable, soothing atmosphere.
- **White** (`#FFFFFF`): Elevated content cards, forms, and dialog surfaces.

### Typography
- **Headlines & Editorial Titles**: `Playfair Display` (editorial serif with elegant italics).
- **Body, UI, & Navigation**: `Plus Jakarta Sans` (modern, legible sans-serif).

---

## 🚀 Features Built

1. **Public Landing Page**:
   - **Sticky Glassmorphic Header**: Organic petal logo, section navigation, Admin portal trigger, and "Join the Waitlist" CTA.
   - **Hero Section**: Editorial headline (*"Better care starts with the right connection."*), subtitle, primary CTA, community proof badge, and an interactive **Digital Care Companion** preview card with live Patient / Doctor toggle.
   - **4-Stage Care Flow Strip**: Discover, Prepare, Connect, and Continue.
   - **Interactive Care Journey ("A More Connected Experience")**: 3 tabbed views showcasing pre-consultation intake, encrypted health records vault, and longitudinal progress tracking with live screen previews.
   - **How It Works**: 4-step editorial grid outlining practitioner matching, pre-consultation dossiers, focused consultations, and ongoing follow-up adherence.
   - **Audience Segmentation**: 3 cards for Patients, Doctors, and Supporters with custom role badges.
   - **Clinical Philosophy & Trust Framework**: Council-verified practitioners, unhurried consultations, encrypted privacy, and integrative healthcare harmony.
   - **Healthcare & Regulatory Disclaimer Banner**: Clear, prominent medical notice complying with healthcare regulations.
   - **FAQ Accordion**: 6 comprehensive questions addressing launch timing, doctor verification against statutory councils, telehealth efficacy, and privacy.
   - **Footer**: Brand links, newsletter subscription, and legal modal dialogs (Privacy Policy, Terms of Use, Medical Disclaimer, Council Verification Standards).

2. **Waitlist Registration Experience**:
   - Role switcher tabs (`I am a Patient`, `I am a Doctor`, `I am a Supporter`).
   - Dynamic role-specific fields (e.g. State/National Council Registration No., Degree, and Experience for doctors; Health goals and previous homeopathy experience for patients).
   - Form validation, confetti celebration effect upon submission (`canvas-confetti`), unique Ticket Pass Number (`#NH-XXXX`), and shareable early invite link copy.
   - Backed by persistent `localStorage` with real-time cross-component data synchronization.

3. **Password-Protected Admin Portal**:
   - Accessible via the **Admin** button in the header/footer or keyboard shortcut (`Ctrl + Shift + A`).
   - Secure login screen. **Default access password: `neohomeo2025`**.
   - **Live KPI Metric Cards**: Total candidates, patient share, doctor credentials count, and supporter breakdown.
   - **Search & Filter Toolbar**: Search in real-time by candidate name, email, city, council registration number, or specialty. Role tabs for instant filtering.
   - **Candidate Roster Table**: View all submissions with color-coded role tags, location, and status badges (`Pending`, `Contacted`, `Verified`).
   - **Candidate Dossier Modal**: Deep-dive into doctor council numbers, patient health goals, and edit internal staff notes.
   - **Real CSV Export**: Generates and downloads an RFC-compliant `.csv` file (`neohomeo_waitlist_YYYY-MM-DD.csv`).
   - **Reset Demo Data**: Easily restore demonstration records for testing.

---

## 🛠️ Quickstart

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit [http://localhost:5173/](http://localhost:5173/) in your browser.

- To access the Admin Portal directly: Click the **Admin** button in the top navigation or navigate to `http://localhost:5173/#admin`.
- Default Admin Password: `neohomeo2025`
