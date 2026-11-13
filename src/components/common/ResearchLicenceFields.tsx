import React from 'react';

export type Licence = 'summary_link' | 'open_access' | 'permission' | 'original';
export const LICENCE_LABELS: Record<Licence, string> = {
  summary_link: 'Summary and link only (no full text)',
  open_access: 'Open access — licence allows sharing',
  permission: 'Shared with the copyright holder\'s permission',
  original: 'My own original work',
};
export const pdfAllowed = (l: Licence) => l !== 'summary_link';

/** Licence basis + copyright line for research posts (Copyright Policy). */
export const ResearchLicenceFields: React.FC<{
  licence: Licence; setLicence: (l: Licence) => void;
  notice: string; setNotice: (s: string) => void;
  pubDate: string; setPubDate: (s: string) => void;
  inputClass: string; labelClass?: string;
}> = ({ licence, setLicence, notice, setNotice, pubDate, setPubDate, inputClass, labelClass = 'mb-1.5 block text-[13px] font-semibold text-slate-700' }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <label className="block sm:col-span-2"><span className={labelClass}>Copyright basis *</span>
      <select className={inputClass} value={licence} onChange={(e) => setLicence(e.target.value as Licence)}>
        {(Object.keys(LICENCE_LABELS) as Licence[]).map((k) => <option key={k} value={k}>{LICENCE_LABELS[k]}</option>)}
      </select>
      <span className="mt-1 block text-xs text-slate-500">A full-text PDF can be attached only for open access, permission or your own work. Never invent studies, authors or journals.</span>
    </label>
    <label className="block"><span className={labelClass}>Publication date</span><input className={inputClass} value={pubDate} maxLength={30} onChange={(e) => setPubDate(e.target.value)} placeholder="e.g. March 2025" /></label>
    <label className="block"><span className={labelClass}>Licence / copyright line</span><input className={inputClass} value={notice} maxLength={500} onChange={(e) => setNotice(e.target.value)} placeholder="e.g. CC BY 4.0, © Publisher" /></label>
  </div>
);
