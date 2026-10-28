import React, { useEffect, useRef, useState } from 'react';

/** Counts a value like "10K+" or "500+" up from 0 when it scrolls into view. */
export const CountUp: React.FC<{ value: string; duration?: number }> = ({ value, duration = 1600 }) => {
  const match = value.match(/^([\d.]+)(.*)$/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : '';
  const ref = useRef<HTMLSpanElement>(null);
  // Reduced motion (or no IntersectionObserver): show the final number immediately.
  const [skipAnimation] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)
  );
  const [current, setCurrent] = useState(skipAnimation ? target : 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !target || skipAnimation) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        setCurrent(target * (1 - Math.pow(1 - progress, 3))); // ease-out cubic
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target, duration, skipAnimation]);

  if (!match) return <span>{value}</span>;
  const shown = Number.isInteger(target) ? Math.round(current) : current.toFixed(1);
  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden="true">{shown}{suffix}</span>
    </span>
  );
};
