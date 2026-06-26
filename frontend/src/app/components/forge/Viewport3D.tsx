// VoxelForge — viewport entry point.
//
// This is a thin wrapper around the WebGL implementation (ForgeViewport). It:
//  • lazy-loads the Three.js bundle so it stays off the initial/critical path;
//  • only mounts the canvas once it scrolls into view, and stops rendering when it
//    leaves — so a long page with several viewports never runs them all at once;
//  • resolves the theme's CSS colour tokens to plain hex once per theme (the GL
//    layer can't read CSS variables), passing them down so nothing reads styles
//    per frame.
// The public API (props + ViewMode) is unchanged, so every call site is untouched.
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { Mesh } from "../../lib/geometry";
import { useTheme } from "../../lib/store";
import type { ForgeColors } from "./ForgeViewport";

const ForgeViewport = lazy(() => import("./ForgeViewport"));

export type ViewMode = "solid" | "wireframe" | "xray";

interface Props {
  mesh: Mesh;
  mode?: ViewMode;
  tint?: string;
  heatmap?: boolean;
  flaggedTags?: string[];
  showOverhangs?: boolean;
  printProgress?: number;
  autoRotate?: boolean;
  interactive?: boolean;
  className?: string;
}

function readColors(): ForgeColors {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    base: v("--ink-dim", "#8a93a3"),
    danger: v("--danger", "#ff5470"),
    warn: v("--warn", "#ff8a5b"),
    inkDim: v("--ink-dim", "#8a93a3"),
    signal: v("--signal", "#2be0c8"),
    blueprint: v("--blueprint", "#5b8cff"),
    grid: v("--blueprint", "#5b8cff"),
  };
}

function Skeleton() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-8 w-8 rounded-[3px] border border-hairline bg-bg-elev pulse-ring" />
    </div>
  );
}

export function Viewport3D({
  mesh, mode = "solid", tint, heatmap, flaggedTags = [], showOverhangs,
  printProgress, autoRotate, interactive = true, className,
}: Props) {
  const { theme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [colors, setColors] = useState<ForgeColors | null>(null);

  // Resolve theme tokens once per theme change.
  useEffect(() => { setColors(readColors()); }, [theme]);

  // Mount on first entry; toggle `active` (render on/off) with visibility.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setMounted(true); setActive(e.isIntersecting); },
      { rootMargin: "200px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ width: "100%", height: "100%", touchAction: "none" }}>
      {mounted && colors ? (
        <Suspense fallback={<Skeleton />}>
          <ForgeViewport
            mesh={mesh}
            mode={mode}
            tint={tint}
            heatmap={heatmap}
            flaggedTags={flaggedTags}
            showOverhangs={showOverhangs}
            printProgress={printProgress}
            autoRotate={autoRotate}
            interactive={interactive}
            colors={colors}
            active={active}
          />
        </Suspense>
      ) : (
        <Skeleton />
      )}
    </div>
  );
}
