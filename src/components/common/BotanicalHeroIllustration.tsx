import React from 'react';
import { BarChart3, ShieldCheck, MessageSquare } from 'lucide-react';

export const BotanicalHeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full flex justify-center lg:justify-end select-none">
      <div className="relative w-full max-w-[560px] lg:max-w-[620px]">

        {/* Soft radial glow behind the plant */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -m-8 rounded-full pointer-events-none opacity-70"
          style={{
            background: 'radial-gradient(circle at 60% 45%, #C2E7F8 0%, #D8EFFB 40%, rgba(241, 247, 252, 0) 75%)',
          }}
        />

        {/* Slowly rotating orbit rings */}
        <div aria-hidden="true" className="absolute inset-[6%] rounded-full border border-dashed border-brand-teal/25 animate-spin-slow pointer-events-none">
          <span className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-brand-teal shadow-glow" />
        </div>
        <div aria-hidden="true" className="absolute inset-[18%] rounded-full border border-sky-400/20 animate-spin-slow [animation-direction:reverse] [animation-duration:60s] pointer-events-none">
          <span className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-sky-500/70" />
        </div>

        {/* Keyword labels */}
        <div className="absolute right-3 sm:right-6 top-0 sm:top-2 hidden sm:flex flex-col gap-3.5 text-right font-sans text-xs tracking-[0.24em] text-[#3A6B88] font-bold uppercase z-20 pointer-events-none">
          {['People', 'Research', 'Mentorship', 'Strong homoeopathy'].map((label, i) => (
            <span key={label} className="animate-fade-up" style={{ animationDelay: `${900 + i * 120}ms` }}>
              {label}
            </span>
          ))}
        </div>

        {/* Botanical watercolour illustration (gently floating) */}
        <img
          src="/images/hero_botanical.webp"
          alt="Watercolour illustration of a homoeopathic botanical plant with teal and blue leaves"
          width={525}
          height={380}
          fetchPriority="high"
          className="relative w-full h-auto object-contain pointer-events-none select-none z-10 animate-float"
        />

        {/* Floating card — verified */}
        <div className="absolute top-[18%] left-0 sm:-left-4 z-20 hidden sm:flex items-center gap-2.5 bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-card ring-1 ring-[#D0E2EF] animate-float [animation-delay:-2s] [animation-duration:8s]">
          <span className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-brand-teal" />
          </span>
          <span className="text-xs font-semibold text-brand-navy leading-tight">
            Council-verified
            <br />
            <span className="text-brand-muted font-medium">members only</span>
          </span>
        </div>

        {/* Floating card — discussion */}
        <div className="absolute top-[52%] left-[4%] z-20 hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-full pl-2 pr-3.5 py-1.5 shadow-card ring-1 ring-[#D0E2EF] animate-float [animation-delay:-5s] [animation-duration:10s]">
          <span className="w-6 h-6 rounded-full bg-brand-navy flex items-center justify-center">
            <MessageSquare className="w-3 h-3 text-white" />
          </span>
          <span className="text-xs font-semibold text-brand-navy">New case discussion</span>
        </div>

        {/* Floating network card — bottom right */}
        <div className="absolute bottom-4 sm:bottom-6 right-2 sm:right-6 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:px-4 sm:py-3.5 shadow-card ring-1 ring-[#D0E2EF] flex items-center gap-3 max-w-[270px] sm:max-w-[290px] z-20 transition duration-300 hover:-translate-y-1 hover:shadow-card-hover animate-float [animation-delay:-3.5s] [animation-duration:9s]">
          <div className="w-9 h-9 rounded-xl bg-[#EAF5FC] ring-1 ring-[#CDE3F3] flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-brand-teal" />
          </div>
          <p className="text-xs font-semibold text-brand-navy leading-snug">
            A growing network of homoeopathic professionals across India
          </p>
        </div>
      </div>
    </div>
  );
};
