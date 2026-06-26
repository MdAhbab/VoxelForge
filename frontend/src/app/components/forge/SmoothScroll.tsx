// VoxelForge — global smooth scroll (Lenis), driven by the GSAP ticker.
//
// The landing page's scroll-scrubbed scenes (scroll-to-print hero, wireframe→solid,
// self-building quote bar) read native window scroll via framer-motion's useScroll;
// Lenis simply smooths that scroll for the premium "instrument" feel. We drive
// Lenis from gsap.ticker so there's a single rAF loop on the page, and we fully
// tear it down on unmount. Disabled entirely under prefers-reduced-motion.
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { usePrefersReducedMotion } from "../../lib/store";

export function SmoothScroll() {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, [reduced]);
  return null;
}
