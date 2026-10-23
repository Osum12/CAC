import { useEffect, useRef } from 'react';

/**
 * The atlas linework behind a page, drifting slower than the page as you scroll so the
 * background has some depth. Decorative only; it stays still when reduced motion is asked for.
 */
export function AtlasBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      el.style.setProperty('--atlas-y', `${Math.round(-window.scrollY * 0.3)}px`);
      el.style.setProperty('--atlas-x', `${Math.round(window.scrollY * 0.06)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return <div ref={ref} className="atlas-backdrop" aria-hidden="true" />;
}
