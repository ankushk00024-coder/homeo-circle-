import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { publisherService } from '../../services/publisherService';
import { normalizeUrl, safeHref } from '../../lib/safeUrl';
import { useToast } from '../../components/feedback/ToastProvider';
import type { KnowledgePost } from '../../types';
import { Card, Field, FormError, MyItems, PageHeader, PdfPicker, PhotoPicker, PickedPhoto, SubmitButton, errorText, inputClass, when } from './PublishUi';

const TYPES = ['Clinical Trial', 'Systematic Review', 'Observational Study', 'Materia Medica Analysis'] as const;

export const PublishResearch: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [journal, setJournal] = useState('');
  const [authors, setAuthors] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [contentType, setContentType] = useState<(typeof TYPES)[number]>('Clinical Trial');
  const [link, setLink] = useState('');
  const [limitations, setLimitations] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [pdf, setPdf] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<KnowledgePost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try { setMine(await publisherService.myResearch(currentUser.id)); } catch { setMine([]); } finally { setLoading(false); }
  }, [currentUser?.id]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setError(null);
    if (!title.trim()) return setError('Please add a title.');
    if (!summary.trim()) return setError('Please add a summary.');
    setBusy(true);
    try {
      const imageUrls: string[] = [];
      for (const p of photos) imageUrls.push(await dataService.uploadResearchFile(currentUser.id, p.file));
      const attachmentUrl = pdf ? await dataService.uploadResearchFile(currentUser.id, pdf) : undefined;
      await dataService.createKnowledgePost({
        title: title.trim(),
        summary: summary.trim(),
        journal: journal.trim() || 'Homeo India',
        author_name: authors.trim() || undefined,
        author_affiliation: affiliation.trim() || undefined,
        content_type: contentType,
        source_url: normalizeUrl(link) || attachmentUrl || '',
        limitations: limitations.trim() || 'See the full paper for methods and limitations.',
        image_urls: imageUrls,
        attachment_url: attachmentUrl,
        created_by: currentUser.id,
      });
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setTitle(''); setSummary(''); setJournal(''); setAuthors(''); setAffiliation(''); setLink(''); setLimitations(''); setPhotos([]); setPdf(null);
      toast.success('Research posted. It is live on the Research page.');
      await load();
    } catch (err) {
      setError(errorText(err, 'Could not post this research.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={<BookOpen className="h-5 w-5" />} title="Post research" subtitle="Shows on the community Research page." />
      <Card>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Title" required>
            <input className={inputClass} value={title} maxLength={300} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Individualised homeopathy in childhood asthma: a randomised trial" />
          </Field>
          <Field label="Summary" required>
            <textarea className={`${inputClass} min-h-[8rem]`} value={summary} maxLength={20000} onChange={(e) => setSummary(e.target.value)} placeholder="What was studied, how, and what was found." />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Authors" hint="(as on the paper)">
              <input className={inputClass} value={authors} maxLength={300} onChange={(e) => setAuthors(e.target.value)} placeholder="e.g. Dr. A. Sharma, Dr. R. Iyer et al." />
            </Field>
            <Field label="Institution" hint="(optional)">
              <input className={inputClass} value={affiliation} maxLength={300} onChange={(e) => setAffiliation(e.target.value)} placeholder="e.g. CCRH, New Delhi" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Journal or source" hint="(optional)">
              <input className={inputClass} value={journal} maxLength={300} onChange={(e) => setJournal(e.target.value)} placeholder="e.g. Indian Journal of Research in Homoeopathy" />
            </Field>
            <Field label="Type">
              <select className={inputClass} value={contentType} onChange={(e) => setContentType(e.target.value as (typeof TYPES)[number])}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Link to the paper" hint="(optional)">
            <input className={inputClass} value={link} maxLength={2048} onChange={(e) => setLink(e.target.value)} placeholder="https://doi.org/…" />
          </Field>
          <Field label="Limitations" hint="(optional)">
            <textarea className={`${inputClass} min-h-[5rem]`} value={limitations} maxLength={5000} onChange={(e) => setLimitations(e.target.value)} placeholder="Sample size, design limits, etc." />
          </Field>
          <Field label="Photos" hint="(optional)">
            <PhotoPicker photos={photos} max={6} onChange={setPhotos} />
          </Field>
          <Field label="PDF" hint="(optional)">
            <PdfPicker file={pdf} onChange={setPdf} />
          </Field>
          <FormError message={error} />
          <div className="flex justify-end"><SubmitButton busy={busy} label="Post research" busyLabel="Uploading…" /></div>
        </form>
      </Card>
      <MyItems
        title="Your research"
        items={mine}
        loading={loading}
        empty="You haven't posted any research yet."
        onDelete={async (k) => { await publisherService.deleteResearch(k.id); toast.success('Research deleted.'); await load(); }}
        render={(k) => (
          <>
            <p className="font-semibold text-brand-navy">{k.title}</p>
            {k.author_name && <p className="text-xs text-slate-500">{k.author_name}{k.author_affiliation ? ` · ${k.author_affiliation}` : ''}</p>}
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{k.summary}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
              <span>{k.content_type}</span>
              <span>{when(k.created_at)}</span>
              {safeHref(k.attachment_url) && (
                <a href={safeHref(k.attachment_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-700 hover:underline">
                  <FileText className="h-3.5 w-3.5" /> PDF
                </a>
              )}
            </p>
          </>
        )}
      />
    </div>
  );
};
