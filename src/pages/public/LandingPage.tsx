import React from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from '../../components/motion/Reveal';
import { CommunityHero } from '../../components/landing/CommunityHero';
import {
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Microscope,
  Stethoscope,
  FileCheck2,
  BadgeCheck,
} from 'lucide-react';

const communityFeatures = [
  {
    img: '/images/doctors_discussion.webp',
    imgSmall: '/images/doctors_discussion-640.webp',
    title: 'Community Discussions',
    desc: 'Ask questions and share cases with fellow homeopaths.',
    link: '/community',
    linkLabel: 'Join the discussion',
    badge: 'All Members',
  },
  {
    img: '/images/student-corner.svg',
    title: 'Dedicated Student Corner',
    desc: 'Study help, internships and mentors.',
    link: '/students',
    linkLabel: 'Explore Student Corner',
    badge: 'Students & Mentors',
  },
  {
    img: '/images/research_books.webp',
    imgSmall: '/images/research_books-640.webp',
    title: 'Research & Knowledge Library',
    desc: 'Papers, trials and reviews in one place.',
    link: '/knowledge',
    linkLabel: 'Discover research',
    badge: 'Evidence Base',
  },
  {
    img: '/images/events-cme.svg',
    title: 'Events, CMEs & Webinars',
    desc: 'Conferences, study circles and CMEs.',
    link: '/events',
    linkLabel: 'View upcoming events',
    badge: 'Continuous Learning',
  },
];

const whoCanJoin = [
  { role: 'Doctors', desc: 'BHMS, MD (Hom) and DHMS practitioners.', cta: 'Join as Doctor', icon: Stethoscope, applyRole: 'doctor' },
  { role: 'Students', desc: 'BHMS students and interns.', cta: 'Join as Student', icon: GraduationCap, applyRole: 'student' },
  { role: 'Researchers', desc: 'Faculty and research scholars.', cta: 'Join as Researcher', icon: Microscope, applyRole: 'researcher' },
];

const steps = [
  {
    icon: FileCheck2,
    title: 'Apply',
    desc: 'Fill a short form. Doctors upload their degree; students add their college.',
  },
  {
    icon: ShieldCheck,
    title: 'Get verified',
    desc: 'Our team reviews your details and approves your profile.',
  },
  {
    icon: BadgeCheck,
    title: 'Join the circle',
    desc: 'Post, connect with members and join events.',
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
      <CommunityHero />

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
                desc="One place for India's homeopaths to learn, share and grow together."
              />
              <Reveal delay={100}>
                <Link to="/about" className="btn-secondary group">
                  About Homeo Circle
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Reveal>

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
            title="Three simple steps"
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
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="Who can join" title="Pick your path" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {whoCanJoin.map((item, idx) => (
              <Reveal key={item.role} delay={idx * 100}>
                <Link
                  to={`/apply?role=${item.applyRole}`}
                  className="card-lift group flex items-center gap-4 p-5 h-full"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-50 ring-1 ring-teal-100 flex items-center justify-center flex-shrink-0 transition duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-brand-teal">
                    <item.icon className="w-5 h-5 text-brand-teal transition-colors group-hover:text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-brand-navy">{item.role}</h3>
                    <p className="text-xs text-[#425972]">{item.desc}</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-teal">
                      {item.cta}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
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
            title={<>Everything in one place.</>}
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


          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/apply" className="btn-primary group">
              Join the Circle
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
};
