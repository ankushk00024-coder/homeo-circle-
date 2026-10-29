import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { Avatar } from './Avatar';

export const CONNECT_NOTE_LIMIT = 300;

export interface ConnectTarget {
  name: string;
  avatar?: string;
  /** e.g. "Doctor · BHMS · Pune" */
  subtitle?: string;
}

interface ConnectDialogProps {
  target: ConnectTarget | null;
  onClose: () => void;
  /** Sends the request; throw to keep the dialog open and show the error. */
  onSend: (note: string) => Promise<void>;
}

/**
 * "Add a note" dialog shown before a connection request is sent, like
 * LinkedIn. The note is optional and goes to the recipient with the request.
 */
export const ConnectDialog: React.FC<ConnectDialogProps> = ({ target, onClose, onSend }) => {
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const open = Boolean(target);

  // Reset only when the dialog opens (callers pass a fresh target object each render).
  useEffect(() => {
    if (!open) return;
    setNote('');
    setError(null);
    setSending(false);
    const t = setTimeout(() => textRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!target) return null;

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      await onSend(note.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the request. Please try again.');
      setSending(false);
    }
  };

  const firstName = target.name.replace(/^Dr\.?\s+/i, '').split(' ')[0] || target.name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-0 sm:p-4 animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !sending) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-dialog-title"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 id="connect-dialog-title" className="text-base font-bold text-brand-navy">
            Add a note to your invitation
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar src={target.avatar} name={target.name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-brand-navy truncate">{target.name}</p>
              {target.subtitle && <p className="text-xs text-slate-500 truncate">{target.subtitle}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="connect-note" className="sr-only">Message</label>
            <textarea
              id="connect-note"
              ref={textRef}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, CONNECT_NOTE_LIMIT))}
              rows={5}
              placeholder={`Hi ${firstName}, I'd like to connect with you on Homeo Circle…`}
              className="w-full px-3.5 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none resize-none text-slate-800 placeholder:text-slate-400"
            />
            <div className="flex justify-between mt-1 text-[11px] text-slate-400">
              <span>Optional. Introduce yourself or say why you'd like to connect.</span>
              <span className={note.length >= CONNECT_NOTE_LIMIT ? 'text-amber-600 font-semibold' : ''}>
                {note.length}/{CONNECT_NOTE_LIMIT}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-teal text-white text-sm font-semibold shadow-sm hover:bg-brand-teal-hover transition disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending…' : note.trim() ? 'Send with note' : 'Send without a note'}
          </button>
        </div>
      </div>
    </div>
  );
};
