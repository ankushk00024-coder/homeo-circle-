import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { AnimatedWords } from '../motion/AnimatedWords';
import { RotatingTagline } from './RotatingTagline';

type PhotoSpec = {
  src: string;
  alt: string;
  tilt: number;
  /** Absolute placement on large screens (percentages of the hero). */
  position: string;
  delay: number;
  width: number;
  height: number;
};

const photos: PhotoSpec[] = [
  {
    src: '/images/community-clinic.webp',
    alt: 'A smiling homeopath in a white coat talking with colleagues',
    tilt: -8,
    position: 'lg:left-[3.3%] lg:top-[16%] lg:w-[20%]',
    delay: 250,
    width: 1400,
    height: 1000,
  },
  {
    src: '/images/community-students.webp',
    alt: 'Three BHMS students studying together with books and a laptop',
    tilt: 8,
    position: 'lg:left-[7.4%] lg:top-[47%] lg:w-[18%]',
    delay: 400,
    width: 674,
    height: 482,
  },
  {
    src: '/images/community-meetup.webp',
    alt: 'Practitioners chatting at a homoeopathy conference',
    tilt: 7.5,
    position: 'lg:right-[2.9%] lg:top-[14%] lg:w-[17.7%]',
    delay: 320,
    width: 766,
    height: 536,
  },
  {
    src: '/images/community-circle.webp',
    alt: 'A group of doctors sitting in a circle sharing experiences',
    tilt: -6.5,
    position: 'lg:right-[4.7%] lg:top-[53%] lg:w-[18.7%]',
    delay: 480,
    width: 762,
    height: 536,
  },
];

/** A short hand-drawn stroke that draws itself in. */
const Stroke: React.FC<{ d: string; delay: number; len?: number; width?: number }> = ({ d, delay, len = 120, width = 2 }) => (
  <path
    d={d}
    className="draw-in"
    style={{ '--len': len, animationDelay: `${delay}ms` } as React.CSSProperties}
    fill="none"
    stroke="currentColor"
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

/** Three little "emphasis" ticks. */
const Ticks: React.FC<{ className: string; color?: string; rotate?: number }> = ({ className, color = '#3BAE7E', rotate = 0 }) => (
  <svg viewBox="0 0 40 40" className={`absolute pointer-events-none ${className}`} style={{ color, transform: `rotate(${rotate}deg)` }} aria-hidden="true">
    <Stroke d="M6 22 L14 24" delay={1500} len={12} width={3} />
    <Stroke d="M12 10 L18 17" delay={1600} len={12} width={3} />
    <Stroke d="M26 4 L25 13" delay={1700} len={12} width={3} />
  </svg>
);

export const CommunityHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#EAF4FA] via-[#E8F5F7] to-[#EDF6FB]">
      {/* ── Atmosphere: mint glows, faint arcs, dotted grid ─────────────── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] rounded-full bg-[#CFF1EC]/60 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[30rem] h-[30rem] rounded-full bg-[#D4ECF8]/70 blur-3xl animate-blob" />
        <div className="absolute bottom-0 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#CDEFE7]/60 blur-3xl animate-blob [animation-delay:-9s]" />
        <div className="absolute left-1/2 top-[18%] -translate-x-1/2 w-[34rem] h-[34rem] rounded-full border border-[#CFE3EE]/70" />
        <div className="absolute left-1/2 -bottom-[28rem] -translate-x-1/2 w-[46rem] h-[46rem] rounded-full border border-[#CFE3EE]/70" />
        <div className="absolute left-0 top-1/4 w-40 h-1/2 bg-grid opacity-50" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-0 lg:min-h-[clamp(760px,57vw,930px)] pt-12 pb-16 lg:py-0">

        {/* ── Centre copy ──────────────────────────────────────────────── */}
        <div className="relative z-20 mx-auto max-w-4xl text-center lg:absolute lg:inset-x-0 lg:top-[26%]">
          <h1 className="font-serif font-bold tracking-[-0.025em] leading-[0.98] text-[clamp(3rem,6.4vw,6.4rem)]">
            <span className="block text-brand-navy">
              <AnimatedWords text="Every homeopath" delay={150} />
            </span>
            <span className="relative inline-block italic font-extrabold text-[#0E8A80] pb-[0.12em]">
              <AnimatedWords text="needs a home." delay={420} />
              {/* Lime brush underline */}
              <svg
                viewBox="0 0 520 26"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute left-[14%] -bottom-[0.06em] w-[80%] h-[0.2em] text-[#A6D23C]"
              >
                <Stroke d="M6 16 C 130 9, 320 6, 514 12" delay={1100} len={530} width={11} />
              </svg>
            </span>
          </h1>

          <RotatingTagline />

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4 animate-fade-up [animation-delay:1200ms]">
            <Link
              to="/apply"
              className="group inline-flex items-center gap-3 rounded-2xl bg-brand-navy px-9 py-4 text-lg font-semibold text-white shadow-elevated transition duration-300 hover:-translate-y-0.5 hover:bg-[#1B3150] active:scale-[.98]"
            >
              Join the Circle
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/explore"
              className="group inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-brand-navy shadow-card ring-1 ring-[#DCE8F1] transition duration-300 hover:-translate-y-0.5 hover:ring-brand-teal/40 hover:shadow-card-hover active:scale-[.98]"
            >
              Explore the community
              <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* ── Tilted photos (absolute on desktop, 2×2 grid on smaller screens) ── */}
        <div className="relative z-10 mt-14 grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-10 lg:mt-0 lg:block lg:absolute lg:inset-0 lg:pointer-events-none [&>*]:pointer-events-auto">
          {photos.map((photo) => (
            <div
              key={photo.src}
              className={`photo-enter lg:absolute ${photo.position}`}
              style={{ animationDelay: `${photo.delay}ms` }}
            >
              <Link
                to="/explore"
                aria-label={`Explore the community: ${photo.alt}`}
                className="photo-card"
                style={{ '--tilt': `${photo.tilt}deg` } as React.CSSProperties}
              >
                <span className="photo-shake">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    decoding="async"
                    style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                  />
                </span>
              </Link>
            </div>
          ))}
        </div>

        {/* ── Handwritten notes with arrows (desktop) ──────────────────── */}
        <div aria-hidden="true" className="hidden lg:block absolute inset-0 z-20 pointer-events-none text-[#2B3A4E]">
          {/* Top-left */}
          <div className="absolute left-[16.6%] top-[7.5%] animate-fade-in [animation-delay:1300ms]">
            <svg viewBox="0 0 44 40" className="absolute -left-12 top-3 w-10">
              <Stroke d="M40 16 C 28 6, 12 8, 7 28" delay={1500} len={60} />
              <Stroke d="M2 21 L7 29 L14 23" delay={1900} len={24} />
            </svg>
            <p className="hand-note text-[clamp(1rem,1.4vw,1.4rem)] -rotate-[8deg]">
              Real conversations,
              <br />
              Stronger together.
            </p>
            <svg viewBox="0 0 30 64" className="absolute left-[58%] top-[115%] w-6">
              <Stroke d="M12 3 C 24 18, 22 40, 10 58" delay={1700} len={70} />
              <Stroke d="M4 49 L10 59 L18 52" delay={2100} len={26} />
            </svg>
          </div>

          {/* Top-right */}
          <div className="absolute right-[19.5%] top-[8%] text-center animate-fade-in [animation-delay:1400ms]">
            <p className="hand-note text-[clamp(1rem,1.3vw,1.3rem)]">
              A community
              <br />
              that understands
              <br />
              our purpose.
            </p>
            <svg viewBox="0 0 40 56" className="absolute left-[55%] top-[105%] w-9">
              <Stroke d="M6 4 C 4 24, 14 40, 32 50" delay={1800} len={66} />
              <Stroke d="M21 53 L33 51 L28 40" delay={2200} len={28} />
            </svg>
          </div>
          <Ticks className="right-[3.2%] top-[6%] w-14" rotate={20} />

          {/* Bottom-left */}
          <div className="absolute left-[14.8%] top-[78%] animate-fade-in [animation-delay:1500ms]">
            <svg viewBox="0 0 40 60" className="absolute -left-14 -top-12 w-10">
              <Stroke d="M36 54 C 16 50, 6 32, 10 6" delay={1900} len={70} />
              <Stroke d="M3 13 L10 4 L17 12" delay={2300} len={26} />
            </svg>
            <p className="hand-note text-[clamp(1rem,1.4vw,1.4rem)] -rotate-[4deg]">
              Learning today
              <br />
              for a better tomorrow.
            </p>
          </div>
          <Ticks className="left-[3.5%] top-[57%] w-12" rotate={-60} />
          <Ticks className="left-[24.5%] top-[73%] w-12" rotate={110} color="#7CB93A" />

          {/* Bottom-right */}
          <div className="absolute right-[6.8%] top-[81%] animate-fade-in [animation-delay:1600ms]">
            <svg viewBox="0 0 40 50" className="absolute -left-12 -top-4 w-9">
              <Stroke d="M32 46 C 14 44, 6 28, 12 6" delay={2000} len={60} />
              <Stroke d="M5 12 L12 4 L19 11" delay={2400} len={26} />
            </svg>
            <p className="hand-note text-[clamp(1rem,1.4vw,1.4rem)] -rotate-[10deg]">
              Different journeys.
              <br />
              Same mission.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
