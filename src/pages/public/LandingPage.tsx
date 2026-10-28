import React from 'react';
import { Link } from 'react-router-dom';
import { BotanicalHeroIllustration } from '../../components/common/BotanicalHeroIllustration';
import { Avatar } from '../../components/common/Avatar';
import { Reveal } from '../../components/motion/Reveal';
import { CountUp } from '../../components/motion/CountUp';
import { AnimatedWords } from '../../components/motion/AnimatedWords';
import {
  Users,
  BookOpen,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Calendar,
  GraduationCap,
  Microscope,
  Stethoscope,
  HeartHandshake,
  FileCheck2,
  BadgeCheck,
  Leaf,
} from 'lucide-react';

const metrics = [
  { value: '10K+', label: 'Practitioners we aim to connect', icon: Users },
  { value: '500+', label: 'Clinical case discussions', icon: MessageSquare },
  { value: '200+', label: 'Webinars, CMEs & workshops', icon: Calendar },
  { value: '1K+', label: 'Internships & opportunities', icon: Briefcase },
];

const pillars = [
  { title: 'Clinical Exchange', desc: 'Case observations & rubrics', icon: Stethoscope },
  { title: 'Research & Science', desc: 'Peer-reviewed evidence', icon: Microscope },
  { title: 'Student Mentorship', desc: 'Bridging study & practice', icon: GraduationCap },
  { title: 'National Network', desc: 'Connecting state chapters', icon: Sparkles },
];

const disciplines = [
  'Materia Medica',
  'Repertory',
  'Clinical Case Studies',
  'Organon of Medicine',
  'Paediatrics',
  'Dermatology',
  'Research Methodology',
  'Practice Management',
  'Public Health',
  'Student Mentorship',
];

const whyBenefits = [
  {
    icon: Users,
    title: 'Trusted Community',
    desc: 'Verified doctors, researchers, and enrolled students with clear role distinctions.',
  },
  {
    icon: BookOpen,
    title: 'Evidence & Knowledge',
    desc: 'Discuss clinical cases with DISHA privacy compliance, study limitations, and DOI references.',
  },
  {
    icon: HeartHandshake,
    title: 'Active Mentorship',
    desc: 'Dedicated Student Corner pairing emerging BHMS graduates with experienced mentors.',
  },
  {
    icon: Sparkles,
    title: 'Professional Growth',
    desc: 'Access accredited CMEs, research fellowships, clinical openings, and collaborative studies.',
  },
];

const communityFeatures = [
  {
    img: '/images/doctors_discussion.webp',
    imgSmall: '/images/doctors_discussion-640.webp',
    title: 'Community Discussions',
    desc: 'Ask questions, share case observations, and deliberate repertorial rubrics with fellow doctors.',
    link: '/community',
    linkLabel: 'Join the discussion',
    badge: 'All Members',
  },
  {
    img: '/images/student-corner.svg',
    title: 'Dedicated Student Corner',
    desc: 'Study guides, repertory aids, internships, and clinical mentorship requests.',
    link: '/students',
    linkLabel: 'Explore Student Corner',
    badge: 'Students & Mentors',
  },
  {
    img: '/images/research_books.webp',
    imgSmall: '/images/research_books-640.webp',
    title: 'Research & Knowledge Library',
    desc: 'Clinical trials, meta-analyses, and systematic reviews with transparent limitations.',
    link: '/knowledge',
    linkLabel: 'Discover research',
    badge: 'Evidence Base',
  },
  {
    img: '/images/events-cme.svg',
    title: 'Events, CMEs & Webinars',
    desc: 'State chapter conferences, study circles, and accredited continuing medical education.',
    link: '/events',
    linkLabel: 'View upcoming events',
    badge: 'Continuous Learning',
  },
];

const whoCanJoin = [
  {
    role: 'Doctors & Practitioners',
    desc: 'BHMS, MD (Hom), DHMS practitioners registered with the National Commission for Homoeopathy or State Councils.',
    cta: 'Join as Doctor',
    badge: 'Statutory Verification',
    icon: Stethoscope,
    applyRole: 'doctor',
  },
  {
    role: 'Students & Interns',
    desc: 'Undergraduate BHMS students and clinical interns seeking peer learning, study resources, and clinician mentorship.',
    cta: 'Join as Student',
    badge: 'Educational Access',
    icon: GraduationCap,
    applyRole: 'student',
  },
  {
    role: 'Researchers & Educators',
    desc: 'Academic faculty, clinical investigators, and research scholars advancing evidence-based homoeopathic science.',
    cta: 'Join as Researcher',
    badge: 'Academic Verification',
    icon: Microscope,
    applyRole: 'researcher',
  },
];

const steps = [
  {
    icon: FileCheck2,
    title: 'Apply',
    desc: 'Share your qualification and council registration number. It takes about five minutes.',
  },
  {
    icon: ShieldCheck,
    title: 'Get verified',
    desc: 'Our verification officers check your details against the NCH and State Council registers.',
  },
  {
    icon: BadgeCheck,
    title: 'Join the circle',
    desc: 'Discuss cases, find mentors, attend CMEs and discover opportunities with verified peers.',
  },
];

const SectionHeading: React.FC<{ eyebrow: string; title: React.ReactNode; desc?: string; center?: boolean }> = ({
  eyebrow,
  title,
  desc,
  center = false,
}) => (
  <Reveal className={`space-y-3 ${center ? 'text-center max-w-2xl mx-auto' : 'max-w-xl'}`}>
    <p className="text-xs font-bold text-brand-teal tracking-[0.18em] uppercase">{eyebrow}</p>
    <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-bold text-brand-navy leading-[1.15] tracking-[-0.015em]">
      {title}
    </h2>
    {desc && <p className="text-[15px] text-[#2E425A] leading-relaxed">{desc}</p>}
  </Reveal>
);

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-brand-paper overflow-x-clip">

      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#DCEEF8] via-[#EDF6FC] to-[#D5ECF8]">
        {/* Drifting colour blobs + dotted grid */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />
          <div className="absolute -top-32 right-[8%] w-[30rem] h-[30rem] rounded-full bg-teal-300/30 blur-3xl animate-blob" />
          <div className="absolute top-48 -left-32 w-[26rem] h-[26rem] rounded-full bg-sky-300/30 blur-3xl animate-blob [animation-delay:-7s]" />
          <div className="absolute -bottom-24 right-1/3 w-[22rem] h-[22rem] rounded-full bg-indigo-300/20 blur-3xl animate-blob [animation-delay:-14s]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20 sm:pb-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* LEFT — headline & actions */}
            <div className="lg:col-span-6 space-y-7">
              <div className="eyebrow animate-fade-up">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-brand-teal animate-ping opacity-60" />
                  <span className="relative w-2 h-2 rounded-full bg-brand-teal" />
                </span>
                Unified national homoeopathy platform
              </div>

              <h1 className="text-[44px] sm:text-6xl xl:text-[68px] font-serif font-bold text-brand-navy leading-[1.04] tracking-[-0.02em]">
                <AnimatedWords text="India's" delay={100} />
                <br />
                <span className="italic">
                  <AnimatedWords text="Homoeopathic" delay={220} wordClassName="text-gradient pr-1" />
                </span>
                <br />
                <AnimatedWords text="Professionals," delay={340} />
                <br />
                <span className="relative inline-block">
                  <span className="underline-draw is-active [transition-delay:1.1s]">
                    <AnimatedWords text="connected." delay={460} />
                  </span>
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#2E425A] max-w-lg leading-relaxed animate-fade-up [animation-delay:600ms]">
                A verified professional network bringing together homoeopathic practitioners, researchers and students
                for clinical learning, collaborative research and peer mentorship.
              </p>

              {/* 4 pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5">
                {pillars.map((p, i) => (
                  <div
                    key={p.title}
                    className="group space-y-1.5 animate-fade-up"
                    style={{ animationDelay: `${700 + i * 90}ms` }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white ring-1 ring-[#C8DCEB] flex items-center justify-center shadow-xs transition duration-300 group-hover:-translate-y-0.5 group-hover:ring-brand-teal/40 group-hover:shadow-glow">
                      <p.icon className="w-4 h-4 text-brand-teal" />
                    </div>
                    <p className="text-sm font-bold text-brand-navy leading-tight">{p.title}</p>
                    <p className="text-xs text-[#425972] leading-snug font-medium">{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* Calls to action */}
              <div className="flex flex-wrap items-center gap-3 animate-fade-up [animation-delay:1000ms]">
                <Link to="/apply" className="btn-primary group">
                  Join Homeo Circle
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/community" className="btn-secondary">
                  Explore Discussions
                </Link>
                <Link to="/students" className="btn-secondary !text-teal-800">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  Student Corner
                </Link>
              </div>

              {/* Trust proof */}
              <div className="flex items-center gap-3 animate-fade-up [animation-delay:1100ms]">
                <div className="flex -space-x-2">
                  <Avatar name="Dr. Priya S" size="sm" />
                  <Avatar name="Dr. Arjun N" size="sm" />
                  <Avatar name="Dr. Kavita R" size="sm" />
                  <Avatar name="Rahul V" size="sm" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-brand-navy">
                    <ShieldCheck className="w-4 h-4 text-brand-teal" />
                    <span>Role-based verified accounts</span>
                  </div>
                  <p className="text-xs text-[#425972] font-medium">
                    Practitioners checked against statutory state & national registers
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT — botanical illustration */}
            <div className="lg:col-span-6 relative flex justify-center lg:justify-end animate-fade-in [animation-delay:300ms]">
              <BotanicalHeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── DISCIPLINES MARQUEE ───────────── */}
      <div className="relative z-10 -mt-8 bg-brand-navy py-4 -rotate-1 scale-[1.02] shadow-elevated" aria-hidden="true">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[...disciplines, ...disciplines].map((d, i) => (
            <span key={`${d}-${i}`} className="flex items-center gap-4 px-4 text-sm font-semibold text-white/90 whitespace-nowrap">
              <Leaf className="w-4 h-4 text-[#13B5A9]" />
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* ───────────── STATS ───────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <Reveal>
          <div className="bg-white rounded-3xl shadow-card ring-1 ring-brand-border py-6 px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 lg:divide-x divide-brand-border/70">
              {metrics.map((m) => (
                <div key={m.label} className="group flex items-center gap-4 px-3 sm:px-6">
                  <div className="w-12 h-12 rounded-2xl bg-brand-ice ring-1 ring-brand-border flex items-center justify-center flex-shrink-0 transition duration-300 group-hover:bg-brand-teal group-hover:ring-brand-teal">
                    <m.icon className="w-5 h-5 text-brand-teal transition-colors group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold font-serif text-brand-navy tabular-nums">
                      <CountUp value={m.value} />
                    </div>
                    <div className="text-xs text-[#425972] font-medium leading-snug">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <p className="text-center text-xs text-brand-muted mt-3">Figures are community goals for our first years.</p>
      </section>

      {/* ───────────── VISION & MISSION ───────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            <Reveal className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-200/50 to-sky-200/40 blur-2xl" aria-hidden="true" />
              <div className="group relative rounded-3xl overflow-hidden shadow-elevated ring-1 ring-brand-border aspect-[4/3]">
                <img
                  src="/images/herbal_clinic.webp"
                  srcSet="/images/herbal_clinic-640.webp 640w, /images/herbal_clinic.webp 1200w"
                  sizes="(min-width: 1024px) 600px, 100vw"
                  alt="A homoeopathic dispensary with remedies and a mortar and pestle"
                  width={1200}
                  height={896}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/40 via-transparent to-transparent" />
                <figure className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 ring-1 ring-[#C8DCEB] shadow-card animate-float [animation-duration:9s]">
                  <blockquote className="text-sm font-semibold text-brand-navy font-serif italic">
                    “The highest ideal of cure is rapid, gentle and permanent restoration of health.”
                  </blockquote>
                  <figcaption className="text-xs text-teal-700 font-medium mt-1">
                    — Samuel Hahnemann, Organon of Medicine §2
                  </figcaption>
                </figure>
              </div>
            </Reveal>

            <div className="space-y-8">
              <SectionHeading
                eyebrow="Our vision & mission"
                title={
                  <>
                    A stronger, <span className="underline-draw">evidence-backed</span> homoeopathic community for a
                    healthier India.
                  </>
                }
                desc="Homeo Circle bridges traditional clinical wisdom and modern medical science. We unite practitioners across India to share peer-reviewed research, discuss complex cases, and mentor the next generation of homoeopaths."
              />
              <Reveal delay={100}>
                <Link to="/about" className="btn-secondary group">
                  Read our mission & governance rules
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Reveal>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {whyBenefits.map((b, i) => (
                  <Reveal key={b.title} delay={i * 90}>
                    <div className="card-lift group p-5 flex items-start gap-4 h-full">
                      <div className="w-10 h-10 rounded-xl bg-brand-ice ring-1 ring-brand-border flex items-center justify-center flex-shrink-0 transition duration-300 group-hover:bg-brand-teal group-hover:rotate-6">
                        <b.icon className="w-[18px] h-[18px] text-brand-teal transition-colors group-hover:text-white" />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-brand-navy">{b.title}</p>
                        <p className="text-sm text-[#425972] leading-snug mt-1">{b.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="py-20 bg-white border-y border-brand-border/70 relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="How it works"
            title="Three steps to a verified network"
            desc="Every member is checked before they join, so the people you discuss cases with are who they say they are."
          />
          <div className="relative grid md:grid-cols-3 gap-6 mt-14">
            <div aria-hidden="true" className="hidden md:block absolute top-9 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-brand-teal/0 via-brand-teal/40 to-brand-teal/0" />
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 150} className="relative text-center px-4">
                <div className="relative mx-auto w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-brand-teal to-[#139B94] text-white flex items-center justify-center shadow-glow">
                  <step.icon className="w-8 h-8" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center ring-4 ring-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-serif font-bold text-brand-navy">{step.title}</h3>
                <p className="mt-2 text-sm text-[#425972] leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── WHO CAN JOIN ───────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="Membership categories"
            title="How would you like to join?"
            desc="One account system, with a role-specific experience for each stage of your career."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {whoCanJoin.map((item, idx) => (
              <Reveal key={item.role} delay={idx * 120}>
                <div className="card-lift group relative overflow-hidden p-7 flex flex-col justify-between gap-6 h-full">
                  <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-teal via-[#139B94] to-brand-indigo scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 ring-1 ring-teal-100 flex items-center justify-center transition duration-300 group-hover:scale-110 group-hover:-rotate-6">
                        <item.icon className="w-6 h-6 text-brand-teal" />
                      </div>
                      <span className="text-xs font-mono text-slate-400">0{idx + 1}</span>
                    </div>
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full ring-1 ring-teal-200">
                      {item.badge}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-brand-navy">{item.role}</h3>
                    <p className="text-sm text-[#425972] leading-relaxed">{item.desc}</p>
                  </div>

                  <Link
                    to={`/apply?role=${item.applyRole}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-ice ring-1 ring-brand-border text-sm font-semibold text-brand-navy transition duration-300 group-hover:bg-brand-teal group-hover:text-white group-hover:ring-brand-teal active:scale-[.98]"
                  >
                    <span>{item.cta}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── COMMUNITY FEATURES (BENTO) ───────────── */}
      <section className="bg-brand-pale py-24 border-y border-brand-border/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Explore the community"
            title={<>Meaningful connections,<br />real opportunities.</>}
            desc="A focused professional network built to support your clinical practice, academic research and career."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-5 mt-12">
            {communityFeatures.map((f, i) => {
              const featured = i === 0;
              return (
                <Reveal
                  key={f.title}
                  delay={i * 100}
                  className={featured ? 'md:col-span-2 lg:row-span-2' : i === 3 ? 'md:col-span-2' : ''}
                >
                  <Link
                    to={f.link}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-brand-border shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-elevated ${
                      featured ? 'min-h-[420px] lg:min-h-[560px]' : ''
                    }`}
                  >
                    <div className={`overflow-hidden ${featured ? 'absolute inset-0' : i === 3 ? 'relative aspect-[4/3] md:aspect-[21/9]' : 'relative aspect-[4/3]'}`}>
                      <img
                        src={f.img}
                        srcSet={f.imgSmall ? `${f.imgSmall} 640w, ${f.img} 1200w` : undefined}
                        sizes={featured ? '(min-width: 1024px) 640px, 100vw' : '(min-width: 1024px) 320px, 100vw'}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                      />
                      {featured && <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950/90 via-brand-navy-950/30 to-transparent" />}
                      <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs text-xs font-bold text-teal-800 px-2.5 py-1 rounded-lg ring-1 ring-slate-200">
                        {f.badge}
                      </span>
                    </div>
                    <div className={`p-6 space-y-2 ${featured ? 'relative mt-auto text-white' : 'flex-1 flex flex-col'}`}>
                      <h3 className={`font-bold ${featured ? 'text-2xl sm:text-3xl font-serif !text-white' : 'text-base text-brand-navy font-sans'}`}>
                        {f.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${featured ? 'text-white/85 max-w-md' : 'text-[#3E556E] flex-1'}`}>{f.desc}</p>
                      <span
                        className={`inline-flex items-center gap-1.5 pt-2 text-sm font-semibold ${
                          featured ? 'text-[#7FE3D9]' : 'text-brand-teal'
                        }`}
                      >
                        {f.linkLabel}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── JOIN CTA (DARK) ───────────── */}
      <section className="relative overflow-hidden bg-brand-navy-950 py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-70 bg-[length:200%_200%] animate-gradient-pan bg-gradient-to-r from-teal-600/30 via-sky-500/10 to-indigo-500/30"
        />
        <div aria-hidden="true" className="absolute -top-40 left-1/2 -translate-x-1/2 w-[46rem] h-[46rem] rounded-full border border-white/10 animate-spin-slow">
          <span className="absolute top-10 left-1/2 w-3 h-3 rounded-full bg-[#13B5A9] shadow-[0_0_20px_4px_rgba(19,181,169,0.6)]" />
        </div>
        <div aria-hidden="true" className="absolute -top-20 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full border border-white/5" />

        <Reveal className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20 text-xs font-bold text-teal-200 uppercase tracking-wider backdrop-blur">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Join India’s professional circle</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-serif font-bold !text-white leading-tight">
            Be part of the national <span className="italic text-gradient">homoeopathic</span> community
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            Whether you are a practising clinician, an academic researcher or a student, Homeo Circle gives you the
            peer network and educational support you need.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/apply" className="btn-primary group">
              Apply to join Homeo Circle
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/10 transition active:scale-[.98]"
            >
              Learn about governance
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
};
