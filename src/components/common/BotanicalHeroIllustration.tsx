import React from 'react';
import { BarChart3 } from 'lucide-react';

export const BotanicalHeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full flex justify-center lg:justify-end select-none">
      <div className="relative w-full max-w-[560px] lg:max-w-[620px]">

        {/* Soft atmospheric radial glow aura behind the plant */}
        <div 
          className="absolute inset-0 -m-8 rounded-full pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(circle at 60% 45%, #C2E7F8 0%, #D8EFFB 40%, rgba(241, 247, 252, 0) 75%)',
          }}
        />

        {/* Crisp Vertical Keyword Labels — Upper Right */}
        <div className="absolute right-3 sm:right-6 top-10 sm:top-14 hidden sm:flex flex-col gap-3.5 text-right font-sans text-[10.5px] tracking-[0.24em] text-[#3A6B88] font-bold uppercase z-20 pointer-events-none">
          <span>PEOPLE</span>
          <span>RESEARCH</span>
          <span>APPOINTMENT</span>
          <span>STRONG HOMOEOPATHY</span>
        </div>

        {/* High-quality Botanical Watercolor Illustration with True Alpha Transparency */}
        <img
          src="/hero_botanical_pristine.png"
          alt="Homoeopathic Botanical Plant with Large Teal and Blue Leaves"
          className="relative w-full h-auto object-contain pointer-events-none select-none z-10"
        />

        {/* Crisp Interactive Floating Network Card — Bottom Right */}
        <div className="absolute bottom-4 sm:bottom-6 right-2 sm:right-6 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:px-4 sm:py-3.5 shadow-card border border-[#D0E2EF] flex items-center gap-3 max-w-[270px] sm:max-w-[290px] z-20 transition hover:shadow-card-hover">
          <div className="w-9 h-9 rounded-xl bg-[#EAF5FC] border border-[#CDE3F3] flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-[#0D817B]" />
          </div>
          <p className="text-xs font-semibold text-[#122238] leading-snug">
            A growing network of homoeopathic professionals across India
          </p>
        </div>

      </div>
    </div>
  );
};



