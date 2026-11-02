import React from 'react';

/**
 * Photos attached to a discussion post, laid out like LinkedIn: one photo
 * full width, two side by side, three or four in a grid. Clicking a photo
 * opens it full size in a new tab.
 */
export const PostImages: React.FC<{ urls?: string[]; compact?: boolean }> = ({ urls, compact = false }) => {
  const list = (urls || []).filter(Boolean).slice(0, 4);
  if (list.length === 0) return null;

  const height = compact ? 'max-h-72' : 'max-h-[28rem]';
  const grid =
    list.length === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className={`grid ${grid} gap-1.5 rounded-xl overflow-hidden ring-1 ring-slate-200`}>
      {list.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`block bg-slate-100 ${list.length === 3 && i === 0 ? 'row-span-2' : ''}`}
        >
          <img
            src={url}
            alt={`Photo ${i + 1}`}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover ${list.length === 1 ? height : 'aspect-[4/3]'} ${list.length === 3 && i === 0 ? '!aspect-auto' : ''}`}
          />
        </a>
      ))}
    </div>
  );
};
