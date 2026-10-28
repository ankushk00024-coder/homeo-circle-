import React from 'react';

interface AnimatedWordsProps {
  text: string;
  /** Delay before the first word, in ms. */
  delay?: number;
  /** Gap between words, in ms. */
  stagger?: number;
  className?: string;
  wordClassName?: string;
}

/**
 * Splits text into words that rise and un-blur one after another.
 * Screen readers get the plain text once; the animated spans are hidden from them.
 */
export const AnimatedWords: React.FC<AnimatedWordsProps> = ({
  text,
  delay = 0,
  stagger = 70,
  className = '',
  wordClassName = '',
}) => {
  const words = text.split(' ');
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom pb-[0.08em]">
            <span
              className={`inline-block animate-word-rise ${wordClassName}`}
              style={{ animationDelay: `${delay + i * stagger}ms` }}
            >
              {word}
            </span>
            {i < words.length - 1 && ' '}
          </span>
        ))}
      </span>
    </span>
  );
};
