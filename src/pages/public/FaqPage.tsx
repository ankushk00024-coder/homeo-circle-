import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import faq from '../../seo/faq.json';

/**
 * Frequently asked questions. The same questions are published as FAQPage
 * structured data and in llms.txt by scripts/seo/postbuild.mjs, so answers
 * stay identical for people, search engines and AI assistants.
 */
export const FaqPage: React.FC = () => (
  <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <h1 className="font-serif text-3xl font-bold text-brand-navy sm:text-4xl">Frequently asked questions</h1>
    <p className="mt-2 text-sm text-slate-600">Short answers about Homeo India, membership, verification and privacy.</p>
    <div className="mt-8 space-y-3">
      {faq.items.map((item, i) => (
        <details key={item.q} open={i < 3} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <h2 className="text-base font-bold text-brand-navy">{item.q}</h2>
            <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{item.a}</p>
        </details>
      ))}
    </div>
    <p className="mt-8 text-sm text-slate-600">
      More detail: <Link to="/verification-policy" className="text-teal-700 underline">Verification Policy</Link> ·{' '}
      <Link to="/privacy" className="text-teal-700 underline">Privacy Policy</Link> ·{' '}
      <Link to="/legal" className="text-teal-700 underline">all policies</Link> ·{' '}
      <Link to="/contact" className="text-teal-700 underline">contact us</Link>
    </p>
  </div>
);
