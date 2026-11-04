import React from 'react';

/**
 * Photos attached to a discussion post, always shown whole (never cropped).
 * One photo keeps its own shape; two to four sit in a grid where each photo
 * is fitted inside its tile. Clicking a photo opens it full size.
 */
export const PostImages: React.FC<{ urls?: string[]; compact?: boolean }> = ({ urls, compact = false }) => {
  const list = (urls || []).filter(Boolean).slice(0, 4);
  if (list.length === 0) return null;

  if (list.length === 1) {
    return (
      <a
        href={list[0]}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="block rounded-xl overflow-hidden ring-1 ring-slate-200 bg-slate-50"
      >
        <img
          src={list[0]}
          alt="Post photo"
          loading="lazy"
          decoding="async"
          className={`block w-full h-auto object-contain mx-auto ${compact ? 'max-h-[32rem]' : 'max-h-[44rem]'}`}
        />
      </a>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden ring-1 ring-slate-200 bg-slate-50">
      {list.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`block bg-slate-100 ${list.length === 3 && i === 0 ? 'col-span-2' : ''}`}
        >
          <img
            src={url}
            alt={`Post photo ${i + 1}`}
            loading="lazy"
            decoding="async"
            className={`w-full object-contain ${list.length === 3 && i === 0 ? 'h-72 sm:h-80' : 'h-48 sm:h-64'}`}
          />
        </a>
      ))}
    </div>
  );
};
