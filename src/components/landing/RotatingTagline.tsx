import React, { useEffect, useState } from 'react';

/** Each tagline: a sentence and its short punchline. */
const TAGLINES: { line: string; punch: string }[] = [
  { line: 'Behind every good homeopath are a hundred others who helped.', punch: 'Be one of the hundred.' },
  { line: 'You were never meant to do homeopathy alone.', punch: 'Find your people.' },
  { line: 'Spread across India. Gathered in one place.', punch: "India's homeopathy common room." },
  { line: 'Small doses. Massive movement.', punch: 'Every member matters.' },
  { line: 'Different colleges. Different cities. Same calling.', punch: 'This is where we meet.' },
  { line: "Great homeopaths aren't made in isolation.", punch: 'Learn from each other.' },
  { line: 'Every homeopath in India deserves a place to belong.', punch: 'Your community. Finally.' },
  { line: 'Every conversation here makes the whole field stronger.', punch: 'Strength in numbers. Wisdom in each other.' },
  { line: "Hahnemann started it. We'll carry it forward.", punch: 'The next 200 years, together.' },
  { line: "Come in. You're one of us.", punch: "Where India's homeopaths belong." },
];

const INTERVAL_MS = 20_000;
const SLIDE_MS = 700;

/**
 * Hero tagline (plain text, no box) that changes on its own every 20 seconds. The old line slides
 * out while the new one slides in at the same time, so there is no gap.
 * Dots below let visitors jump to a tagline.
 */
export const RotatingTagline: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  const goTo = (next: number) => {
    setPrev(index);
    setIndex(next);
  };

  // Drop the outgoing line once its slide has finished.
  useEffect(() => {
    if (prev === null) return;
    const id = window.setTimeout(() => setPrev(null), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [prev]);

  useEffect(() => {
    const id = window.setInterval(() => goTo((index + 1) % TAGLINES.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [index]);

  const { line, punch } = TAGLINES[index];

  return (
    <div className="relative mx-auto mt-8 max-w-2xl animate-fade-up [animation-delay:900ms]">
      <div className="relative overflow-hidden">
        <div className="relative">
          <div
            key={`in-${index}`}
            aria-live="polite"
            className={`min-h-[6.5rem] sm:min-h-[6rem] flex flex-col items-center justify-center ${prev !== null ? 'animate-tagline-in' : ''}`}
          >
            <p className="text-[clamp(1.1rem,1.7vw,1.6rem)] text-[#3E4C5E] leading-snug">{line}</p>
            <p className="mt-1 font-serif font-bold text-brand-navy text-[clamp(1.3rem,2vw,1.9rem)]">{punch}</p>
          </div>
          {prev !== null && (
            <div
              key={`out-${prev}`}
              aria-hidden="true"
              className="absolute inset-0 flex flex-col items-center justify-center animate-tagline-out"
            >
              <p className="text-[clamp(1.1rem,1.7vw,1.6rem)] text-[#3E4C5E] leading-snug">{TAGLINES[prev].line}</p>
              <p className="mt-1 font-serif font-bold text-brand-navy text-[clamp(1.3rem,2vw,1.9rem)]">{TAGLINES[prev].punch}</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-label="Choose a tagline">
        {TAGLINES.map((t, i) => (
          <button
            key={t.punch}
            type="button"
            onClick={() => i !== index && goTo(i)}
            aria-label={`Show tagline ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-brand-teal' : 'w-1.5 bg-[#B8D3E2] hover:bg-brand-teal/60'}`}
          />
        ))}
      </div>
    </div>
  );
};
