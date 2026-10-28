# Homeo Circle — Frontend Audit & UI/Animation Plan

> **Status (branch `feat/security-fixes-and-ui-upgrade`):** Part A (A1–A6) is
> implemented. B1, B3 (focus, dialogs, reduced motion), B4 (code-splitting,
> WebP images, slower polling) and B5 cleanup are implemented. D1–D10 are
> implemented. Still open:
> - the hard-coded hex colour clean-up (B2)
> - splitting the very large page files (B5)
> - the demo-only data features listed in `docs/backend/README.md`

Scope: everything under `src/`, plus `index.html`, `tailwind.config.js` and `public/`
(commit `24031a5`). This is a static code review. I could not run
`npm ci` / `npm run build` / `oxlint` in this session, so build and lint errors are
not covered. Run them locally after making these changes.

The plan uses **only what's already in the repo**: React 19, Tailwind 3.4, lucide-react.
No new dependencies.

---

## Part A — Fix these first (they block a real launch)

### A1. Every visitor is logged in as "Dr. Ananya Sharma" by default 🔴
`src/context/AuthContext.tsx:78-88`: when localStorage is empty, the initial state is
`TEST_USERS.member`. A first-time visitor is therefore a *verified doctor*. They can open
`/dashboard`, `/members` and everything else behind `ProtectedRoute`.

**Also:**
- The logged-in profile, **including `role`**, is stored in
  `localStorage.homeocircle_current_user`. Anyone can edit it in DevTools to
  `"role":"super_admin"` and get the admin UI.
- `supabase.auth.getSession()` / `onAuthStateChange` are never called. The app
  doesn't restore a real Supabase session on refresh and doesn't react to token
  expiry or sign-out.
- `loginWithEmail` falls through to "local matching" whenever Supabase doesn't return
  a user. Any email containing `admin` or `sanjeev` becomes an admin.

**Fix (replace the state and login logic in `AuthContext.tsx`):**
```tsx
const DEMO_MODE = import.meta.env.DEV && !isSupabaseConfigured;

const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);

useEffect(() => {
  if (!supabase) return;
  const loadProfile = async (userId: string | undefined) => {
    if (!userId) { setCurrentUser(null); setAuthLoading(false); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setCurrentUser(data ?? null);
    setAuthLoading(false);
  };
  supabase.auth.getSession().then(({ data }) => loadProfile(data.session?.user.id));
  const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
    loadProfile(session?.user.id);
  });
  return () => sub.subscription.unsubscribe();
}, []);
```
- Delete the `localStorage.getItem/setItem('homeocircle_current_user')` code.
- Make the "local matching" block run only `if (DEMO_MODE)`.
- Expose `authLoading` in the context. In `ProtectedRoute`, render a spinner while
  `authLoading` is true; otherwise users get bounced to `/login` on every refresh.
- Treat the client-side `isAdmin` as cosmetic only. Real protection is RLS plus the
  Edge Function from the backend migration.

### A2. Demo shortcuts ship to production 🔴
- `LoginPage.tsx:278-320`: the "Evaluator Demo Profiles" panel calls `loginAs('admin')`.
  Wrap it in `{DEMO_MODE && ( … )}`.
- `loginAs` should be a no-op unless `DEMO_MODE`.
- `DevBanner.tsx` isn't rendered anywhere. Keep it only behind `DEMO_MODE`, or delete it.

### A3. Real data is silently replaced by mock data 🔴
`src/lib/supabase.ts`, e.g. line ~106:
`if (!error && data && data.length > 0) return data;`. With an **empty** live database
(day one) or **any** error, users see the fake posts and members from `mockData.ts`.
Writes such as `await supabase.from('posts').delete()…` ignore `error`, then also
update localStorage. So the UI says "done" even when the database refused the change.

**Fix pattern (apply to every method):**
```ts
if (isSupabaseConfigured && supabase) {
  const { data, error } = await query;
  if (error) throw error;          // let the page show an error state
  return data ?? [];               // empty means empty, not mock data
}
return getLocal(...);              // mock only when Supabase isn't configured at all
```

### A4. Admin application review never reaches the database 🔴
`dataService.updateApplicationStatus` (`supabase.ts:930`) only edits localStorage.
Replace its body with the Edge Function from the backend migration:
```ts
const { data, error } = await supabase.functions.invoke('review-practitioner-application', {
  body: { application_id: appId, new_status: status,
          decision_reason: decisionReason ?? null, verification_source: verificationSource ?? null },
});
if (error) throw error;
```

### A5. "Forgot password" does nothing 🔴
`LoginPage.tsx:74-82` only shows a success message. Call:
```ts
await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/login?reset=1` });
```
You also need a small "set new password" screen that calls
`supabase.auth.updateUser({ password })`.

### A6. No navigation on phones in the member area 🔴
`MemberSidebar` is `hidden md:block` and the navbar links are `hidden lg:flex`.
`MemberNavbar` has no hamburger. **On a phone, a member can't reach Discussions,
Events, etc.** except through the avatar dropdown. `AdminSidebar` is always `w-64`
with `min-h-screen`. On mobile it stacks above the content, so admins scroll a full
screen before seeing anything.

Fix: add a bottom tab bar (code in **B6**) and make `AdminSidebar` `hidden md:flex`,
with a slide-in drawer for small screens.

---

## Part B — Things that look broken or cheap right now

### B1. ~100 Tailwind classes do nothing
The project is **Tailwind 3.4**, but the code uses Tailwind **v4** names and a plugin
that isn't installed:

| Class used | Count | In Tailwind 3.4 |
|---|---|---|
| `shadow-xs` | 60 | doesn't exist → no shadow |
| `shadow-2xs` | 21 | doesn't exist |
| `backdrop-blur-xs` | 16 | doesn't exist |
| `py-0.2` | 17 | invalid → no padding |
| `animate-in fade-in slide-in-from-top-2 zoom-in-95` | 8 | needs `tailwindcss-animate` (not installed) |
| `animate-fadeIn` | 5 | never defined |

So the dropdown, modal and toast animations you think you have **don't run**. The fix
is in B2: define these names in `tailwind.config.js`, then search and replace.

### B2. Readability
- `text-[10px]` ×103, `text-[11px]` ×123, `text-xs` ×573. Large parts of the app use
  10–12px text. That's too small for long-form clinical content and fails comfortable
  reading on mobile.
  - Rule: body text at least `text-sm` (14px), ideally `text-[15px]`.
  - Meta and labels at least `text-xs` (12px).
  - Replace `text-[10px]`/`text-[11px]` with `text-xs` everywhere except tiny badges.
- 190 hard-coded hex colours (`#0D817B`, `#122238` …) duplicate the `brand.*` tokens
  already in `tailwind.config.js`. Use `text-brand-teal`, `text-brand-navy`, etc. That
  way a future theme or dark mode is a one-file change.

### B3. Accessibility
- 5× `focus:outline-none` and only 1 `focus-visible`, so keyboard users can't see focus.
  Add the global `:focus-visible` rule in B3-CSS below.
- 14× `alert()`/`confirm()`. Replace them with an in-app toast and a confirm modal.
- No `prefers-reduced-motion` handling. It's required once animations are added
  (handled below).

### B4. Performance
- All ~40 pages are imported eagerly in `App.tsx`, so the landing page downloads the
  whole admin panel. Use `React.lazy` + `Suspense` (code in B7).
- `public/*.jpg|png` are 430–780 KB each. Convert to WebP at ~1200px wide (≈80–150 KB).
  Add `width`, `height`, `loading="lazy"` and `decoding="async"` to below-the-fold `<img>`.
- 5 Unsplash hot-links (landing cards, avatars). Download them into `public/` so the site
  doesn't depend on Unsplash.
- `MemberNavbar` polls notifications **every 5 s**. Use Supabase Realtime
  (`supabase.channel('notif').on('postgres_changes', …)`), or poll every 60 s.

### B5. Housekeeping
- `index.html` favicon points to `/vite.svg`, which doesn't exist. Use `/favicon.svg`.
  Also add `og:title`, `og:image` and `theme-color` meta tags for WhatsApp/LinkedIn shares.
- Dead Vite template files: `src/App.css` (not imported), `src/assets/react.svg`,
  `vite.svg`, `hero.png`, and `public/icons.svg` / `botanical_hero.svg`, which are
  unused. Delete them.
- `package.json` `"name": "temp-app"` should be renamed to `homeo-circle`.
- `StudentsPage.tsx` (1033 lines), `DiscussionsPage.tsx` (761) and `ApplyPage.tsx` (742)
  should be split into components (`PostCard`, `MentorCard`, `FilterBar`, `Modal` …).
  Many cards are copy-pasted across pages.
- 20× `: any`; use `unknown` and narrow with `instanceof Error`.
- No scroll-to-top on route change (component in B7).

---

## Part C — Making it "dashing": design direction

The brand (navy + botanical teal + Playfair serif) is already good. It feels flat
because it's mostly white cards on pale blue with tiny text. Concrete upgrades:

1. **Bigger, bolder type hierarchy.** Hero `text-5xl→7xl`, section titles `text-4xl`,
   body `text-[15px]`. Add gradient text on one hero word:
   `bg-gradient-to-r from-brand-teal to-sky-600 bg-clip-text text-transparent`.
2. **Depth.** Cards get `ring-1 ring-brand-border/60`, a soft shadow and a hover *lift*.
   Hero gets 2–3 blurred, slowly drifting colour blobs behind the illustration.
3. **One dark section** for contrast: the "Who can join" / final CTA band in
   `bg-brand-navy-950` with an animated teal gradient glow. Every page is currently
   the same light blue.
4. **Glass navbar that tightens on scroll.** It's already `backdrop-blur-md`; add a
   shadow and smaller height after 8px of scroll.
5. **Bento grid** for the four "community features" on the landing page (one big tile,
   three small) instead of four identical cards.
6. **Skeleton loaders** instead of blank space while `dataService` loads.
7. **Micro-interactions:** button press scale, icon nudge on hover, a pulsing ring on the
   unread notification badge, count-up stats.

---

## Part D — Step-by-step implementation (no new libraries)

### D1. `tailwind.config.js`: add animations and the missing v4 tokens
Inside `theme.extend`, add:
```js
keyframes: {
  'fade-in':    { from: { opacity: '0' }, to: { opacity: '1' } },
  'fade-up':    { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
  'slide-down': { from: { opacity: '0', transform: 'translateY(-6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
  'scale-in':   { from: { opacity: '0', transform: 'scale(.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
  float:        { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
  blob:         { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '33%': { transform: 'translate(30px,-20px) scale(1.08)' }, '66%': { transform: 'translate(-20px,15px) scale(.95)' } },
  shimmer:      { '100%': { transform: 'translateX(100%)' } },
  'gradient-pan': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
},
animation: {
  'fade-in':    'fade-in .3s ease-out both',
  'fade-up':    'fade-up .55s cubic-bezier(.22,1,.36,1) both',
  'slide-down': 'slide-down .18s ease-out both',
  'scale-in':   'scale-in .22s cubic-bezier(.22,1,.36,1) both',
  float:        'float 6s ease-in-out infinite',
  blob:         'blob 18s ease-in-out infinite',
  shimmer:      'shimmer 1.6s infinite',
  'gradient-pan': 'gradient-pan 10s ease infinite',
},
backdropBlur: { xs: '2px' },
```
Inside the existing `boxShadow` object, add the two sizes the code already uses:
```js
'2xs': '0 1px 0 0 rgba(20, 36, 63, 0.04)',
'xs':  '0 1px 2px 0 rgba(20, 36, 63, 0.06)',
```
Then search and replace across `src/`:
| Find | Replace |
|---|---|
| `animate-in fade-in slide-in-from-top-2 duration-150` | `animate-slide-down` |
| `animate-in fade-in zoom-in-95` | `animate-scale-in` |
| `animate-in fade-in` | `animate-fade-in` |
| `animate-fadeIn` | `animate-fade-in` |
| `py-0.2` | `py-0.5` |

Do them in this order, longest first. After this, the existing dropdowns, modals and
toasts animate.

### D2. `src/index.css`: global motion, focus and helper classes
Append:
```css
@layer base {
  html { scroll-behavior: smooth; }
  :focus-visible { outline: 2px solid #0D817B; outline-offset: 2px; border-radius: 6px; }
}

@layer components {
  /* Scroll reveal (used by <Reveal>) */
  .reveal { opacity: 0; transform: translateY(18px);
    transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1);
    transition-delay: var(--reveal-delay, 0ms); }
  .reveal.is-visible { opacity: 1; transform: none; }

  /* Card with hover lift */
  .card-lift { @apply bg-white rounded-2xl ring-1 ring-brand-border/70 shadow-card
                     transition duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover; }

  /* Primary button with press feedback + light sweep */
  .btn-primary { @apply relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 rounded-xl
                        bg-brand-teal text-white text-sm font-semibold shadow-card
                        transition duration-200 hover:bg-brand-teal-hover hover:shadow-card-hover
                        active:scale-[.98]; }
  .btn-primary::after { content: ''; @apply absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg]
                        bg-gradient-to-r from-transparent via-white/25 to-transparent
                        transition-all duration-700; }
  .btn-primary:hover::after { left: 150%; }

  /* Skeleton block */
  .skeleton { @apply relative overflow-hidden rounded-xl bg-slate-200/70; }
  .skeleton::after { content: ''; @apply absolute inset-0 -translate-x-full animate-shimmer
                     bg-gradient-to-r from-transparent via-white/60 to-transparent; }
}

/* Respect users who turn animations off (also makes reveals visible instantly) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important;
                           transition-duration: .01ms !important; scroll-behavior: auto !important; }
  .reveal { opacity: 1; transform: none; }
}
```

### D3. New file `src/components/common/Reveal.tsx`: fade-up on scroll
```tsx
import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;      // ms, use i * 80 for staggered grids
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setVisible(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
```
Usage (landing page, `whyBenefits.map`):
```tsx
{whyBenefits.map((b, i) => (
  <Reveal key={b.title} delay={i * 90}>
    <div className="card-lift p-6"> … </div>
  </Reveal>
))}
```
Wrap every section heading on Landing, About and Eligibility the same way.

### D4. New file `src/components/common/CountUp.tsx`: animated stats bar
```tsx
import React, { useEffect, useRef, useState } from 'react';

export const CountUp: React.FC<{ value: string; duration?: number }> = ({ value, duration = 1400 }) => {
  const match = value.match(/^([\d.]+)(.*)$/);           // "10K+" → 10, "K+"
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : '';
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !match) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(target); return; }
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - start) / duration, 1);
        setN(target * (1 - Math.pow(1 - p, 3)));       // ease-out cubic
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, duration]);

  if (!match) return <span>{value}</span>;
  return <span ref={ref}>{Number.isInteger(target) ? Math.round(n) : n.toFixed(1)}{suffix}</span>;
};
```
In `LandingPage.tsx` stats bar, replace `{m.value}` with `<CountUp value={m.value} />`.

### D5. Hero upgrade (`LandingPage.tsx`)
1. Replace the static SVG circles with drifting blobs (put them inside the hero `<section>`,
   before the content):
```tsx
<div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
  <div className="absolute -top-24 right-[10%] w-[28rem] h-[28rem] rounded-full bg-teal-300/30 blur-3xl animate-blob" />
  <div className="absolute top-40 -left-24 w-[22rem] h-[22rem] rounded-full bg-sky-300/30 blur-3xl animate-blob [animation-delay:-6s]" />
  <div className="absolute bottom-0 right-1/3 w-[18rem] h-[18rem] rounded-full bg-indigo-300/20 blur-3xl animate-blob [animation-delay:-12s]" />
</div>
```
2. Stagger the hero text in on load:
   - badge: `animate-fade-up`
   - `<h1>`: `animate-fade-up [animation-delay:80ms]`
   - paragraph: `[animation-delay:160ms]`
   - pillars: `[animation-delay:240ms]`
   - CTA row: `[animation-delay:320ms]`
3. Gradient accent on the italic word:
   `<span className="italic bg-gradient-to-r from-brand-teal via-teal-500 to-sky-600 bg-clip-text text-transparent">Homoeopathic</span>`
4. Make the illustration float: in `BotanicalHeroIllustration.tsx`, add `animate-float`
   to the image wrapper, and `animate-float [animation-delay:-3s]` to the floating badge
   cards so they bob out of sync.
5. Primary CTA: replace its long class list with `className="btn-primary"` and add
   `group`. Put `group-hover:translate-x-1 transition-transform` on the `ArrowRight`.
6. Make the hero `<h1>` bigger: `text-[44px] sm:text-6xl lg:text-7xl`.

### D6. Mobile bottom tab bar (fixes A6 and feels app-like)
New file `src/components/layout/MobileTabBar.tsx`:
```tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Users, GraduationCap, Calendar } from 'lucide-react';

const tabs = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/community', label: 'Discuss', icon: MessageSquare },
  { to: '/members',   label: 'Network', icon: Users },
  { to: '/students',  label: 'Students', icon: GraduationCap },
  { to: '/events',    label: 'Events', icon: Calendar },
];

export const MobileTabBar: React.FC = () => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-brand-border
                  pb-[env(safe-area-inset-bottom)]">
    <ul className="grid grid-cols-5">
      {tabs.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink to={to} className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition
             ${isActive ? 'text-brand-teal' : 'text-slate-500'}`}>
            {({ isActive }) => (
              <>
                <span className={`p-1.5 rounded-xl transition ${isActive ? 'bg-teal-50 scale-110' : ''}`}>
                  <Icon className="w-5 h-5" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);
```
In `App.tsx` `MemberLayout`, render `<MobileTabBar />` after `<Footer />`, and add
`pb-20 md:pb-8` to the content wrapper so the bar doesn't cover the content.

### D7. Page transitions, scroll-to-top, code-splitting (`App.tsx`)
```tsx
import React, { Suspense, lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return null;
};

// Fade each page in when the route changes
const AnimatedOutlet: React.FC = () => {
  const { pathname } = useLocation();
  return <div key={pathname} className="animate-fade-up"><Outlet /></div>;
};

// Lazy pages (repeat for every page; named exports need the .then mapping)
const DashboardPage = lazy(() => import('./pages/member/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
// …

const PageFallback = () => (
  <div className="space-y-4 p-4"><div className="skeleton h-8 w-1/3" /><div className="skeleton h-40" /><div className="skeleton h-40" /></div>
);
```
- Replace `<Outlet />` in all three layouts with `<AnimatedOutlet />`.
- Wrap `<Routes>` in `<Suspense fallback={<PageFallback />}>`.
- Put `<ScrollToTop />` right inside `<BrowserRouter>`.
- Keep `LandingPage` and `LoginPage` eager (first paint); lazy-load everything else.

### D8. Skeleton loaders
Where pages do `if (loading) return …` (68 loading spots), render skeletons instead.
Example post-card skeleton:
```tsx
<div className="card-lift p-5 space-y-3">
  <div className="flex items-center gap-3"><div className="skeleton w-10 h-10 rounded-full" /><div className="skeleton h-3 w-40" /></div>
  <div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-5/6" />
</div>
```

### D9. Micro-interactions (copy these class strings)
| Element | Classes to add |
|---|---|
| Any card | `card-lift` (or `transition duration-300 hover:-translate-y-1 hover:shadow-card-hover`) |
| Card image | wrapper `overflow-hidden`; img `transition-transform duration-700 group-hover:scale-105` (already on landing; add to Events/Knowledge) |
| Buttons | `active:scale-[.98] transition` |
| Icon in link | parent `group`, icon `transition-transform group-hover:translate-x-1` |
| Sidebar active item | `relative before:absolute before:left-0 before:inset-y-2 before:w-1 before:rounded-full before:bg-brand-teal` |
| Unread badge | sibling `<span className="absolute inset-0 rounded-full bg-brand-teal animate-ping opacity-60" />` inside a `relative` wrapper |
| Like button | on click, toggle a state that adds `animate-scale-in` and `fill-rose-500 text-rose-500` to the `Heart` |
| Dropdowns/modals | `animate-slide-down` / `animate-scale-in` (via D1 replacements); modal backdrop `animate-fade-in` |
| Navbar on scroll | `const [scrolled,setScrolled]=useState(false)`; on `scroll`, `setScrolled(window.scrollY>8)`; add `shadow-card` and a smaller height when scrolled |

### D10. Dark CTA band (landing page, before the footer)
```tsx
<section className="relative overflow-hidden bg-brand-navy-950 py-20">
  <div aria-hidden className="absolute inset-0 opacity-60 animate-gradient-pan bg-[length:200%_200%]
       bg-gradient-to-r from-teal-600/30 via-sky-500/10 to-indigo-500/30" />
  <Reveal className="relative max-w-3xl mx-auto px-4 text-center space-y-6">
    <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white">Join India's verified homoeopathic network</h2>
    <p className="text-slate-300 text-lg">Clinical discussions, mentorship and research — with peers you can trust.</p>
    <Link to="/apply" className="btn-primary">Apply for membership</Link>
  </Reveal>
</section>
```

---

## Suggested order of work
1. **Part A** (A1–A6): correctness and security. Nothing else matters if any visitor is a verified doctor.
2. **D1 + D2**: one config file and one CSS file. Instantly fixes ~100 dead classes and adds the motion system.
3. **D6 + D7**: mobile nav, page transitions, lazy loading.
4. **D3–D5, D10**: landing page wow factor.
5. **B2 / D8 / D9**: readability pass, skeletons, micro-interactions page by page.
6. **B4/B5 cleanup**: images, dead files, splitting large pages.

After each step, run:
```bash
npm run build
```
```bash
npm run lint
```
Then check on a real phone and with *Reduce motion* turned on in OS settings.
