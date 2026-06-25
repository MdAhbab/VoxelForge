import React, { useEffect, useRef } from "react";
import {
  type Mesh, type Vec3, meshTris, decimate, rotateX, rotateY, sub, cross, norm, dot,
} from "../../lib/geometry";

export type ViewMode = "solid" | "wireframe" | "xray";

interface Props {
  mesh: Mesh;
  mode?: ViewMode;
  tint?: string; // base material colour (hex)
  heatmap?: boolean;
  flaggedTags?: string[]; // thin-wall prims
  showOverhangs?: boolean;
  printProgress?: number; // 0..1 — clip the build by layer height
  autoRotate?: boolean;
  interactive?: boolean;
  className?: string;
}

function parseColor(c: string): [number, number, number] {
  c = c.trim();
  if (c.startsWith("#")) {
    const h = c.slice(1);
    const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }
  const m = c.match(/(\d+\.?\d*)/g);
  if (m) return [+m[0], +m[1], +m[2]];
  return [200, 200, 200];
}
const css = (root: HTMLElement, v: string) => getComputedStyle(root).getPropertyValue(v).trim();
const shade = (rgb: [number, number, number], k: number) =>
  `rgb(${rgb.map((c) => Math.max(0, Math.min(255, Math.round(c * k)))).join(",")})`;

export function Viewport3D({
  mesh, mode = "solid", tint, heatmap, flaggedTags = [], showOverhangs,
  printProgress, autoRotate, interactive = true, className,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ yaw: -0.6, pitch: -0.35, dragging: false, lx: 0, ly: 0, vis: true, t: 0 });

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const root = document.documentElement;
    let raf = 0;

    const io = new IntersectionObserver(([e]) => (state.current.vis = e.isIntersecting), { threshold: 0.01 });
    io.observe(canvas);

    // triangle list computed once per mesh change (decimated for smooth preview)
    const tris = decimate(meshTris(mesh));

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!state.current.vis) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const W = rect.width, H = rect.height;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr; canvas.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const s = state.current;
      if (autoRotate && !s.dragging) s.yaw += 0.0045;
      s.t += 1;

      const colBg = css(root, "--bg");
      const colSignal = parseColor(css(root, "--signal"));
      const colWarn = parseColor(css(root, "--warn"));
      const colDanger = parseColor(css(root, "--danger"));
      const colInk = css(root, "--ink");
      const colInkDim = css(root, "--ink-dim");
      const colGrid = css(root, "--blueprint");
      const base = parseColor(tint ?? css(root, "--ink-dim"));

      // fit
      const span = Math.max(mesh.bbox[0], mesh.bbox[1], mesh.bbox[2]);
      const scale = (Math.min(W, H) * 0.62) / span;
      const cx = W / 2, cy = H / 2 + H * 0.06;
      const light = norm([0.45, 0.92, 0.5]);

      const project = (p: Vec3): [number, number, number] => {
        let v = rotateY(p, s.yaw);
        v = rotateX(v, s.pitch);
        const persp = 1 + v[2] / (span * 5);
        return [cx + v[0] * scale * persp, cy - v[1] * scale * persp, v[2]];
      };

      // ---- build plate + isometric grid ----
      const half = span * 0.9;
      const plateY = -mesh.bbox[1] / 2 - 0.5;
      ctx.lineWidth = 1;
      const g = parseColor(colGrid);
      ctx.strokeStyle = `rgba(${g[0]},${g[1]},${g[2]},0.22)`;
      const N = 8;
      for (let i = -N; i <= N; i++) {
        const t = (i / N) * half;
        const a = project([t, plateY, -half]); const b = project([t, plateY, half]);
        const c = project([-half, plateY, t]); const d = project([half, plateY, t]);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
      }

      // ---- triangles ----
      const clipY = printProgress != null ? -mesh.bbox[1] / 2 + printProgress * mesh.bbox[1] : Infinity;

      type Draw = { pts: [number, number][]; z: number; fill: string; stroke: string; alpha: number };
      const draws: Draw[] = [];

      for (const tr of tris) {
        // print clip — in model build direction (Y)
        const maxY = Math.max(tr.a[1], tr.b[1], tr.c[1]);
        if (maxY > clipY + 0.01) continue;

        const n = norm(cross(sub(tr.b, tr.a), sub(tr.c, tr.a)));
        const pa = project(tr.a), pb = project(tr.b), pc = project(tr.c);
        const z = (pa[2] + pb[2] + pc[2]) / 3;
        const lit = 0.4 + 0.6 * Math.max(0, dot(n, light));

        let rgb = base;
        if (heatmap) {
          const thin = flaggedTags.includes(tr.tag);
          const overhang = showOverhangs && n[1] < -0.35;
          if (thin) rgb = colDanger;
          else if (overhang) rgb = colWarn;
          else rgb = parseColor(colInkDim);
        }

        let fill = shade(rgb, lit);
        let stroke = mode === "wireframe" ? colGrid : `rgba(0,0,0,0.18)`;
        let alpha = 1;
        if (mode === "xray") { alpha = 0.14; fill = shade(base, 1); stroke = colSignal; }
        if (mode === "wireframe") { alpha = 0; }

        draws.push({ pts: [[pa[0], pa[1]], [pb[0], pb[1]], [pc[0], pc[1]]], z, fill, stroke, alpha });
      }

      draws.sort((x, y) => x.z - y.z);
      for (const d of draws) {
        ctx.beginPath();
        ctx.moveTo(d.pts[0][0], d.pts[0][1]);
        ctx.lineTo(d.pts[1][0], d.pts[1][1]);
        ctx.lineTo(d.pts[2][0], d.pts[2][1]);
        ctx.closePath();
        if (d.alpha > 0) { ctx.globalAlpha = d.alpha; ctx.fillStyle = d.fill; ctx.fill(); }
        ctx.globalAlpha = mode === "wireframe" ? 0.5 : 0.6;
        ctx.lineWidth = mode === "wireframe" ? 0.8 : 0.5;
        ctx.strokeStyle = d.stroke;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ---- print head sweep line while printing ----
      if (printProgress != null && printProgress < 0.999) {
        const y = -mesh.bbox[1] / 2 + printProgress * mesh.bbox[1];
        const p1 = project([-half, y, -half]); const p2 = project([half, y, -half]);
        const p3 = project([half, y, half]); const p4 = project([-half, y, half]);
        ctx.strokeStyle = `rgb(${colSignal.join(",")})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.closePath();
        ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
        // nozzle dot
        const t = (s.t % 60) / 60;
        const nx = p1[0] + (p2[0] - p1[0]) * t, ny = p1[1] + (p2[1] - p1[1]) * t;
        ctx.fillStyle = `rgb(${colSignal.join(",")})`;
        ctx.beginPath(); ctx.arc(nx, ny, 2.4, 0, Math.PI * 2); ctx.fill();
      }
      void colBg; void colInk;
    }
    frame();
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [mesh, mode, tint, heatmap, flaggedTags.join(","), showOverhangs, printProgress, autoRotate]);

  // pointer orbit
  const onDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    const s = state.current; s.dragging = true; s.lx = e.clientX; s.ly = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = state.current; if (!s.dragging) return;
    s.yaw += (e.clientX - s.lx) * 0.01;
    s.pitch = Math.max(-1.3, Math.min(0.4, s.pitch + (e.clientY - s.ly) * 0.008));
    s.lx = e.clientX; s.ly = e.clientY;
  };
  const onUp = () => { state.current.dragging = false; };

  return (
    <canvas
      ref={ref}
      className={className}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      style={{ width: "100%", height: "100%", touchAction: "none", cursor: interactive ? "grab" : "default", display: "block" }}
    />
  );
}
