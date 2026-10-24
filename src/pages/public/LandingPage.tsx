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
  GraduationCap,
  Microscope,
  Stethoscope,
  HeartHandshake
} from 'lucide-react';

export const LandingPage: React.FC = () => {

  const metrics = [
    { value: '10K+', label: 'Practitioners (Target Across India)', icon: Users },
    { value: '500+', label: 'Clinical Case Discussions', icon: MessageSquare },
    { value: '200+', label: 'Webinars, CMEs & Workshops', icon: Calendar },
    { value: '1K+', label: 'Internships & Opportunities', icon: Briefcase },
  ];

  const pillars = [
    { title: 'Clinical Exchange', desc: 'Case observations & rubrics', icon: Stethoscope },
    { title: 'Research & Science', desc: 'Peer-reviewed evidence', icon: Microscope },
    { title: 'Student Mentorship', desc: 'Bridging study & practice', icon: GraduationCap },
    { title: 'National Network', desc: 'Connecting state chapters', icon: Sparkles },
  ];

  const whyBenefits = [
    { 
      icon: Users, 
      title: 'Trusted Community', 
      desc: 'Verified doctors, researchers, and enrolled students with clear role distinctions.' 
    },
    { 
      icon: BookOpen, 
      title: 'Evidence & Knowledge', 
      desc: 'Discuss clinical cases with DISHA privacy compliance, study limitations, and DOI references.' 
    },
    { 
      icon: HeartHandshake, 
      title: 'Active Mentorship', 
      desc: 'Dedicated Student Corner pairing emerging BHMS graduates with experienced mentors.' 
    },
    { 
      icon: Sparkles, 
      title: 'Professional Growth', 
      desc: 'Access accredited CMEs, research fellowships, clinical openings, and collaborative studies.' 
    },
  ];

  const communityFeatures = [
    {
      img: '/doctors_discussion.jpg',
      title: 'Community Discussions',
      desc: 'Ask questions, share case observations, and deliberate repertorial rubrics with fellow doctors.',
      link: '/community',
      linkLabel: 'Join the discussion',
      badge: 'All Members'
    },
    {
      img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80',
      title: 'Dedicated Student Corner',
      desc: 'Explore study guides, repertory aids, internships, and request clinical mentorship.',
      link: '/students',
      linkLabel: 'Explore Student Corner',
      badge: 'Students & Mentors'
    },
    {
      img: '/research_books.jpg',
      title: 'Research & Knowledge Library',
      desc: 'Index of clinical trials, meta-analyses, and systematic reviews with transparent limitations.',
      link: '/knowledge',
      linkLabel: 'Discover research',
      badge: 'Evidence Base'
    },
    {
      img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
      title: 'Events, CMEs & Webinars',
      desc: 'Attend state chapter conferences, study circles, and accredited continuing medical education.',
      link: '/events',
      linkLabel: 'View upcoming events',
      badge: 'Continuous Learning'
    },
  ];

  const whoCanJoin = [
    {
      role: 'Doctors & Practitioners',
      desc: 'BHMS, MD (Hom), DHMS practitioners registered with the National Commission for Homoeopathy or State Councils.',
      cta: 'Join as Doctor',
      badge: 'Statutory Verification'
    },
    {
      role: 'Students & Interns',
      desc: 'Undergraduate BHMS students and clinical interns seeking peer learning, study resources, and clinician mentorship.',
      cta: 'Join as Student',
      badge: 'Educational Access'
    },
    {
      role: 'Researchers & Educators',
      desc: 'Academic faculty, clinical investigators, and research scholars advancing evidence-based homoeopathic science.',
      cta: 'Join as Researcher',
      badge: 'Academic Verification'
    }
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-xs border border-[#BED9E9] text-[11px] font-semibold text-[#0D817B] tracking-[0.14em] uppercase shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#0D817B] animate-pulse"></span>
                UNIFIED NATIONAL HOMOEOPATHY PLATFORM
              </div>

              <h1 className="text-[44px] sm:text-[54px] lg:text-[60px] font-serif font-bold text-[#122238] leading-[1.08] tracking-[-0.018em]">
                India's<br />
                <span className="text-[#0D817B] italic font-serif">Homoeopathic</span><br />
                Professionals
              </h1>

              <p className="text-base text-[#2E425A] max-w-lg leading-relaxed font-normal">
                A unified, professional network bringing together homeopathic practitioners, doctors, researchers, and students for clinical learning, collaborative research, and peer mentorship.
              </p>

              {/* 4 Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-4 pt-1">
                {pillars.map((p) => (
                  <div key={p.title} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-[#C8DCEB] flex items-center justify-center shadow-2xs">
                        <p.icon className="w-3.5 h-3.5 text-[#0D817B]" />
                      </div>
                      <span className="text-xs font-bold text-[#122238] leading-tight">{p.title}</span>
                    </div>
                    <p className="text-[11px] text-[#425972] leading-snug font-medium">{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* Calls to Action */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0D817B] hover:bg-[#096e69] text-white text-sm font-semibold shadow-xs hover:shadow transition"
                >
                  Join Homeo Circle <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/community"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-[#CCDDE9] text-[#122238] text-sm font-semibold hover:border-[#0D817B] hover:bg-[#FAFCFE] shadow-2xs transition"
                >
                  Explore Discussions
                </Link>
                <Link
                  to="/students"
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-white/70 border border-[#CCDDE9] text-teal-800 text-sm font-semibold hover:border-teal-500 hover:bg-white shadow-2xs transition"
                >
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  Student Corner
                </Link>
              </div>

              {/* Verified Trust Proof */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2">
                  <Avatar name="Dr. Priya S" size="sm" />
                  <Avatar name="Dr. Arjun N" size="sm" />
                  <Avatar name="Dr. Kavita R" size="sm" />
                  <Avatar name="Rahul V" size="sm" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#122238]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0D817B]" />
                    <span>Role-based verified accounts</span>
                  </div>
                  <p className="text-[11.5px] text-[#425972] font-medium">
                    Practitioners audited against statutory state & national registers
                  </p>
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

      {/* ───────────── STATS BAR (Target Metrics Clearly Labeled) ───────────── */}
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

      {/* ───────────── VISION & MISSION ───────────── */}
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
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-[#C8DCEB] shadow-sm">
                <p className="text-xs font-semibold text-brand-navy">
                  “The highest ideal of cure is rapid, gentle and permanent restoration of health.”
                </p>
                <p className="text-[11px] text-teal-700 font-medium mt-0.5">
                  — Samuel Hahnemann, Organon of Medicine §2
                </p>
              </div>
            </div>

            {/* Text & Feature Cards */}
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-[#0D817B] tracking-[0.18em] uppercase">OUR VISION & MISSION</p>
                <h2 className="text-3xl sm:text-[38px] font-serif font-bold text-[#122238] leading-snug tracking-[-0.015em]">
                  A stronger, evidence-backed<br />homoeopathic community<br />for a healthier India.
                </h2>
                <p className="text-sm text-[#2E425A] leading-relaxed max-w-lg">
                  Homeo Circle bridges the gap between traditional clinical wisdom and modern medical science. We unite practitioners across India to share peer-reviewed research, discuss complex clinical cases, and provide structured mentorship to the next generation of homoeopaths.
                </p>
                <div className="pt-1">
                  <Link to="/about" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#122238] bg-white border border-[#CCDDE9] shadow-subtle px-4 py-2.5 rounded-xl hover:border-[#0D817B] hover:text-[#0D817B] transition">
                    Read our full mission & governance rules <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
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

      {/* ───────────── WHO CAN JOIN SECTION (3 ROLES) ───────────── */}
      <section className="bg-white py-16 border-y border-[#D7E5F0]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-[11px] font-bold text-[#0D817B] tracking-[0.18em] uppercase">MEMBERSHIP CATEGORIES</span>
            <h2 className="text-3xl font-serif font-bold text-[#122238]">How Would You Like to Join?</h2>
            <p className="text-sm text-[#425972]">
              One unified account system with role-specific experiences tailored for your career stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whoCanJoin.map((item, idx) => (
              <div 
                key={item.role} 
                className="bg-[#F8FBFE] rounded-2xl p-6 border border-[#D0E2EF] hover:border-teal-500 hover:shadow-card transition flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      {item.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-400">0{idx + 1}</span>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#122238]">{item.role}</h3>
                  <p className="text-xs text-[#425972] leading-relaxed">{item.desc}</p>
                </div>

                <Link
                  to={`/apply?role=${item.role.toLowerCase().includes('student') ? 'student' : item.role.toLowerCase().includes('research') ? 'researcher' : 'doctor'}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#C8DCEB] hover:bg-teal-700 hover:text-white hover:border-teal-700 text-xs font-semibold text-[#122238] shadow-2xs transition"
                >
                  <span>{item.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── COMMUNITY FEATURES ───────────── */}
      <section className="bg-[#EAF3FA] py-20 border-b border-[#D7E5F0]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-[#0D817B] tracking-[0.18em] uppercase">EXPLORE THE COMMUNITY</p>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#122238] leading-snug tracking-[-0.015em]">
                Meaningful connections,<br />real opportunities.
              </h2>
              <p className="text-sm text-[#2E425A] max-w-lg">
                Join a focused professional network designed to support your clinical practice, academic research, and medical career.
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
              <div key={f.title} className="bg-white rounded-2xl overflow-hidden border border-[#D7E5F0] shadow-card hover:shadow-card-hover transition group flex flex-col justify-between">
                <div>
                  <div className="overflow-hidden relative" style={{aspectRatio:'4/3'}}>
                    <img
                      src={f.img}
                      alt={f.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80';
                      }}
                    />
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-teal-800 px-2 py-0.5 rounded-md border border-slate-200">
                      {f.badge}
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-sm font-bold text-[#122238]">{f.title}</h3>
                    <p className="text-xs text-[#3E556E] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
                <div className="p-5 pt-0">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-teal-200 text-[11px] font-bold text-teal-800 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Join India’s Professional Circle</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#122238]">
            Be Part of the National Homoeopathic Community
          </h2>

          <p className="text-sm text-[#2E425A] max-w-xl mx-auto leading-relaxed">
            Whether you are a practicing clinician, an academic researcher, or a medical student, Homeo Circle offers the peer network and educational support you need.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/apply"
              className="px-6 py-3.5 bg-[#0D817B] hover:bg-[#096e69] text-white text-sm font-semibold rounded-xl shadow transition"
            >
              Apply to Join Homeo Circle
            </Link>
            <Link
              to="/about"
              className="px-6 py-3.5 bg-white border border-[#CCDDE9] text-[#122238] text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              Learn About Governance
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
