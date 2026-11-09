import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { publisherService } from '../../services/publisherService';
import { normalizeUrl } from '../../lib/safeUrl';
import { useToast } from '../../components/feedback/ToastProvider';
import type { Post } from '../../types';
import { Card, Field, FormError, MyItems, PageHeader, PhotoPicker, PickedPhoto, SubmitButton, errorText, inputClass, when } from './PublishUi';

export const PublishDiscussions: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try { setMine(await publisherService.myDiscussions(currentUser.id)); } catch { setMine([]); } finally { setLoading(false); }
  }, [currentUser?.id]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setError(null);
    if (!title.trim()) return setError('Please add a title.');
    if (!body.trim()) return setError('Please write the discussion.');
    setBusy(true);
    try {
      const imageUrls: string[] = [];
      for (const p of photos) imageUrls.push(await dataService.uploadPostImage(currentUser.id, p.file));
      await dataService.createPost({
        title: title.trim(),
        body: body.trim(),
        category_id: 'general',
        source_url: normalizeUrl(link) || undefined,
        image_urls: imageUrls,
      }, currentUser);
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setTitle(''); setBody(''); setLink(''); setPhotos([]);
      toast.success('Discussion posted. It is live in the community feed.');
      await load();
    } catch (err) {
      setError(errorText(err, 'Could not post this discussion.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={<MessageSquare className="h-5 w-5" />} title="Post a discussion" subtitle="Shows in the community Discussions feed under your name." />
      <Card>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Title" required>
            <input className={inputClass} value={title} maxLength={300} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chronic eczema in a 9-year-old — remedy selection" />
          </Field>
          <Field label="Discussion" required>
            <textarea className={`${inputClass} min-h-[10rem]`} value={body} maxLength={20000} onChange={(e) => setBody(e.target.value)}
              placeholder="Write the case, question or update. Do not include patient names or other identifying details." />
          </Field>
          <Field label="Photos" hint="(optional)">
            <PhotoPicker photos={photos} max={4} onChange={setPhotos} />
          </Field>
          <Field label="Link" hint="(optional)">
            <input className={inputClass} value={link} maxLength={2048} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
          </Field>
          <FormError message={error} />
          <div className="flex justify-end"><SubmitButton busy={busy} label="Post discussion" /></div>
        </form>
      </Card>
      <MyItems
        title="Your discussions"
        items={mine}
        loading={loading}
        empty="You haven't posted a discussion yet."
        onDelete={async (p) => { await publisherService.deleteDiscussion(p.id); toast.success('Discussion deleted.'); await load(); }}
        render={(p) => (
          <>
            <Link to={`/community/${p.id}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-navy hover:text-teal-700">
              {p.title} <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </Link>
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{p.body}</p>
            <p className="mt-1 text-xs text-slate-400">{when(p.created_at)}{p.status !== 'published' ? ` · ${p.status}` : ''}</p>
          </>
        )}
      />
    </div>
  );
};
