import React from 'react';
import { Link } from 'react-router-dom';
import { BotanicalHeroIllustration } from '../../components/common/BotanicalHeroIllustration';
import { Avatar } from '../../components/common/Avatar';
import {
  Users,
  BookOpen,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Calendar,
  TrendingUp,
} from 'lucide-react';

export const LandingPage: React.FC = () => {

  const metrics = [
    { value: '10K+', label: 'Practitioners (Target)', icon: Users },
    { value: '500+', label: 'Discussions', icon: MessageSquare },
    { value: '200+', label: 'Events & Webinars', icon: Calendar },
    { value: '1K+', label: 'Opportunities Shared', icon: Briefcase },
  ];

  const pillars = [
    { title: 'People', desc: 'Connect with peers', icon: Users },
    { title: 'Research', desc: 'Share knowledge', icon: BookOpen },
    { title: 'Opportunities', desc: 'Discover & grow', icon: Briefcase },
    { title: 'Stronger Homoeopathy', desc: 'Build the future together', icon: Sparkles },
  ];

  const whyBenefits = [
    { icon: Users, title: 'Trusted Community', desc: 'Only registered practitioners' },
    { icon: BookOpen, title: 'Knowledge Sharing', desc: 'Discuss cases, research and updates' },
    { icon: TrendingUp, title: 'Professional Growth', desc: 'Find opportunities, events and mentors' },
    { icon: Sparkles, title: 'Make a Bigger Impact', desc: 'Work together for a healthier India' },
  ];

  const communityFeatures = [
    {
      img: '/doctors_discussion.jpg',
      title: 'Community Discussions',
      desc: 'Ask questions, share cases and learn from fellow practitioners.',
      link: '/community',
      linkLabel: 'Join the discussion',
    },
    {
      img: '/research_books.jpg',
      title: 'Research & Knowledge',
      desc: 'Explore the latest research, journals and clinical insights.',
      link: '/knowledge',
      linkLabel: 'Discover research',
    },
    {
      img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
      title: 'Events & Webinars',
      desc: 'Attend conferences, webinars and state chapter events.',
      link: '/events',
      linkLabel: 'View upcoming events',
    },
    {
      img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80',
      title: 'Opportunities',
      desc: 'Find jobs, internships, research collaborations and more.',
      link: '/opportunities',
      linkLabel: 'Explore opportunities',
    },
  ];

  const whoCanApply = [
    'Registered homoeopathic practitioners',
    'Valid registration number',
    'Practising in India',
    'Agreement to community guidelines',
  ];

  return (
    <div className="bg-[#F1F7FC]">

      {/* ───────────── HERO ───────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #DCEEF8 0%, #E7F3FB 28%, #EDF6FC 55%, #E2F1FA 80%, #D5ECF8 100%)'
        }}
      >
        {/* Celestial constellation background circles */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-45 overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="510" cy="110" r="14" fill="none" stroke="#2563EB" strokeWidth="1.25" strokeOpacity="0.4" />
            <circle cx="524" cy="170" r="4.5" fill="#0D817B" fillOpacity="0.45" />
            <circle cx="480" cy="80" r="140" fill="none" stroke="#60A5FA" strokeWidth="0.75" strokeDasharray="3 3" strokeOpacity="0.3" />
            <circle cx="480" cy="80" r="260" fill="none" stroke="#60A5FA" strokeWidth="0.75" strokeOpacity="0.2" />
            <circle cx="280" cy="220" r="3.5" fill="#0D817B" fillOpacity="0.25" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* LEFT — Sharp Editorial Typography & Actions */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-xs border border-[#BED9E9] text-[11px] font-semibold text-[#0D817B] tracking-[0.14em] uppercase shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#0D817B]"></span>
                VERIFIED PRACTITIONERS ONLY
              </div>

              <h1 className="text-[44px] sm:text-[54px] lg:text-[62px] font-serif font-bold text-[#122238] leading-[1.08] tracking-[-0.018em]">
                India's<br />
                <span className="text-[#0D817B] italic font-serif">Homoeopathic</span><br />
                Professionals
              </h1>

              <p className="text-base text-[#2E425A] max-w-md leading-relaxed font-normal">
                A trusted, members-only professional community for registered homoeopathic practitioners in India.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4 pt-1">
                {pillars.map((p) => (
                  <div key={p.title} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-[#C8DCEB] flex items-center justify-center shadow-2xs">
                        <p.icon className="w-3.5 h-3.5 text-[#0D817B]" />
                      </div>
                      <span className="text-xs font-bold text-[#122238]">{p.title}</span>
                    </div>
                    <p className="text-[11.5px] text-[#425972] leading-snug font-medium">{p.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0D817B] hover:bg-[#096e69] text-white text-sm font-semibold shadow-xs hover:shadow transition"
                >
                  Apply for verification <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/community"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-[#CCDDE9] text-[#122238] text-sm font-semibold hover:border-[#0D817B] hover:bg-[#FAFCFE] shadow-2xs transition"
                >
                  Explore community
                </Link>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2">
                  <Avatar name="Dr. Priya S" size="sm" />
                  <Avatar name="Dr. Arjun N" size="sm" />
                  <Avatar name="Dr. Kavita R" size="sm" />
                  <Avatar name="Dr. Ravi M" size="sm" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#122238]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0D817B]" />
                    Verified practitioners only
                  </div>
                  <p className="text-[11.5px] text-[#425972] font-medium">Manual verification of registration details</p>
                </div>
              </div>
            </div>

            {/* RIGHT — Botanical Plant with watercolor foliage, berries, and badges */}
            <div className="lg:col-span-6 xl:col-span-6 relative flex justify-center lg:justify-end overflow-visible">
              <BotanicalHeroIllustration />
            </div>

          </div>
        </div>
      </section>

      {/* ───────────── STATS BAR ───────────── */}
      <section className="relative z-10 -mt-7 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-card border border-[#D0E2EF] py-5 px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D7E5F0]/70">
            {metrics.map((m, i) => (
              <div key={m.label} className={`flex items-center gap-4 px-4 sm:px-6 py-3 ${i >= 2 ? 'pt-5 sm:pt-3' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-[#EEF6FC] border border-[#D7E5F0] flex items-center justify-center flex-shrink-0">
                  <m.icon className="w-5 h-5 text-[#0D817B]" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-serif text-[#122238]">{m.value}</div>
                  <div className="text-xs text-[#425972] font-medium">{m.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── WHY HOMEO CIRCLE ───────────── */}
      <section className="bg-[#F1F7FC] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Photo Card */}
            <div className="relative rounded-2xl overflow-hidden shadow-card border border-[#D0E2EF]" style={{aspectRatio:'4/3'}}>
              <img
                src="/herbal_clinic.jpg"
                alt="Homoeopathic medicine practice"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80';
                }}
              />
            </div>

            {/* Text & Feature Cards */}
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-[#0D817B] tracking-[0.18em] uppercase">WHY HOMEO CIRCLE</p>
                <h2 className="text-3xl sm:text-[38px] font-serif font-bold text-[#122238] leading-snug tracking-[-0.015em]">
                  A stronger<br />homoeopathic community<br />for a healthier India.
                </h2>
                <p className="text-sm text-[#2E425A] leading-relaxed max-w-md">
                  Homeo Circle brings together verified homoeopathic practitioners to connect, collaborate and advance the practice through shared knowledge, research and opportunities.
                </p>
                <Link to="/about" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#122238] bg-white border border-[#CCDDE9] shadow-subtle px-4 py-2.5 rounded-xl hover:border-[#0D817B] hover:text-[#0D817B] transition">
                  Learn more about us <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {whyBenefits.map((b) => (
                  <div key={b.title} className="bg-white rounded-2xl p-4 border border-[#D7E5F0]/80 shadow-subtle flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF6FC] border border-[#D7E5F0] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <b.icon className="text-[#0D817B]" style={{width:'18px',height:'18px'}} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#122238]">{b.title}</p>
                      <p className="text-xs text-[#425972] leading-snug mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ───────────── COMMUNITY FEATURES ───────────── */}
      <section className="bg-[#EAF3FA] py-20 border-t border-[#D7E5F0]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-[#0D817B] tracking-[0.18em] uppercase">EXPLORE THE COMMUNITY</p>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#122238] leading-snug tracking-[-0.015em]">
                Meaningful connections,<br />real opportunities.
              </h2>
              <p className="text-sm text-[#2E425A] max-w-lg">
                Join a focused professional network designed to support your practice and passion for homoeopathy.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0 pb-1">
              <button className="w-9 h-9 rounded-full bg-white border border-[#D7E5F0] shadow-2xs flex items-center justify-center hover:bg-[#EEF6FC] transition">
                <ChevronLeft className="w-4 h-4 text-[#425972]" />
              </button>
              <button className="w-9 h-9 rounded-full bg-white border border-[#D7E5F0] shadow-2xs flex items-center justify-center hover:bg-[#EEF6FC] transition">
                <ChevronRight className="w-4 h-4 text-[#425972]" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {communityFeatures.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl overflow-hidden border border-[#D7E5F0] shadow-card hover:shadow-card-hover transition group">
                <div className="overflow-hidden" style={{aspectRatio:'4/3'}}>
                  <img
                    src={f.img}
                    alt={f.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80';
                    }}
                  />
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="text-sm font-bold text-[#122238]">{f.title}</h3>
                  <p className="text-xs text-[#3E556E] leading-relaxed">{f.desc}</p>
                  <Link to={f.link} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D817B] hover:text-[#096e69] pt-1 transition">
                    {f.linkLabel} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── JOIN CTA ───────────── */}
      <section className="bg-[#E4F2F1] py-20 border-t border-[#CCE4E2] relative overflow-hidden">
        {/* Botanical leaf decoration */}
        <div className="absolute bottom-0 left-0 w-56 opacity-30 pointer-events-none select-none">
          <svg viewBox="0 0 300 360" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 90 350 Q 130 250 110 150 T 70 20" stroke="#122238" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M 110 150 C 60 130 20 170 50 230 C 90 240 110 200 110 150 Z" fill="#122238" opacity="0.7"/>
            <path d="M 105 210 C 155 200 190 240 170 300 C 130 310 100 275 105 210 Z" fill="#0D817B" opacity="0.6"/>
            <path d="M 88 280 C 130 290 150 330 118 352 C 78 347 68 312 88 280 Z" fill="#122238" opacity="0.5"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-[#0D817B] tracking-[0.18em] uppercase">BE PART OF SOMETHING MEANINGFUL</p>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#122238] leading-snug tracking-[-0.015em]">
                  Join India's verified<br />homoeopathic community.
                </h2>
                <p className="text-sm text-[#2E425A] max-w-md leading-relaxed">
                  Apply for verification to access discussions, events, research, opportunities and a nationwide network of practitioners.
                </p>
              </div>
              <Link to="/apply" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0D817B] hover:bg-[#096e69] text-white text-sm font-semibold shadow-xs hover:shadow transition">
                Apply for verification <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-[#CCE2DF] shadow-card space-y-4 max-w-sm ml-auto w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EEF6FC] border border-[#D7E5F0] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#0D817B]" />
                </div>
                <h3 className="text-sm font-bold text-[#122238]">Who can apply?</h3>
              </div>
              <ul className="space-y-3">
                {whoCanApply.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-[#122238] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#0D817B] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
