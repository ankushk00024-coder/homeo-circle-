import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { policy, PolicyKey, POLICIES } from './config';

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Readable legal page: title, version, dates, table of contents, short
 * numbered sections, and links to the other policies.
 */
export const LegalDocument: React.FC<{ doc: PolicyKey; intro?: React.ReactNode; sections: LegalSection[] }> = ({ doc, intro, sections }) => {
  const meta = policy(doc);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <Link to="/legal" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy">
        <ArrowLeft className="h-4 w-4" /> Legal & Policies
      </Link>
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="font-serif text-3xl font-bold text-brand-navy sm:text-4xl">{meta.title}</h1>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <div><dt className="inline font-semibold text-slate-600">Version </dt><dd className="inline">{meta.version}</dd></div>
          <div><dt className="inline font-semibold text-slate-600">Effective </dt><dd className="inline">{fmt(meta.effective)}</dd></div>
          <div><dt className="inline font-semibold text-slate-600">Last updated </dt><dd className="inline">{fmt(meta.updated)}</dd></div>
        </dl>
        {intro && <div className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">{intro}</div>}
      </header>

      <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Contents</p>
          <ol className="space-y-1 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="legal-prose min-w-0 space-y-9 text-[15px] leading-relaxed text-slate-700">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 space-y-3">
              <h2 className="font-serif text-xl font-bold text-brand-navy">{i + 1}. {s.title}</h2>
              {s.body}
            </section>
          ))}

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <p className="mb-2 font-semibold text-brand-navy">Other policies</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {POLICIES.filter((p) => p.key !== doc).map((p) => (
                <li key={p.key}>
                  <Link to={p.path} className="inline-flex items-center gap-1.5 text-teal-700 hover:underline"><FileText className="h-3.5 w-3.5" />{p.title}</Link>
                </li>
              ))}
            </ul>
          </aside>
        </article>
      </div>
    </div>
  );
};

/** Small helpers for consistent formatting inside documents. */
export const P: React.FC<{ children: React.ReactNode }> = ({ children }) => <p>{children}</p>;
export const UL: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="list-disc space-y-1.5 pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
);
export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{children}</div>
);
export const Table: React.FC<{ head: string[]; rows: React.ReactNode[][] }> = ({ head, rows }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full min-w-[36rem] text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2 align-top">{c}</td>)}</tr>)}
      </tbody>
    </table>
  </div>
);
