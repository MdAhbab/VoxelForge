import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useScroll, useTransform, useMotionValueEvent, useInView } from "motion/react";
import { ArrowRight, Layers, ScanLine, Gauge, Boxes } from "lucide-react";

import { partById } from "../lib/catalog";
import type { Mesh } from "../lib/geometry";
import { MATERIALS } from "../lib/materials";
import { computeQuote, fmt, CURRENCY } from "../lib/pricing";
import { meshVolumeCm3 } from "../lib/geometry";
import { usePrefersReducedMotion } from "../lib/store";

import { Viewport3D } from "../components/forge/Viewport3D";
import { MaterialSphere } from "../components/forge/MaterialChip";
import { QuoteBar } from "../components/forge/QuoteBar";
import { Anno, SectionTag, DimensionLine, NumberRoll } from "../components/forge/primitives";
import { Button } from "../components/ui/button";

export function Landing() {
  const reduced = usePrefersReducedMotion();
  const phoneMesh = useMemo(() => partById("phone-stand").build({}), []);

  return (
    <div>
      <Hero mesh={phoneMesh} reduced={reduced} />
      <CapabilityStrip />
      <Materialize mesh={phoneMesh} reduced={reduced} />
      <ConfiguratorTeaser />
      <QuoteScene />
      <PreflightShowcase />
      <MaterialsTurntable />
      <CTABand />
    </div>
  );
}

/* ---------------- Hero: scroll-to-print ---------------- */
function Hero({ mesh, reduced }: { mesh: Mesh; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setProgress(Math.min(1, v * 1.25)));

  const vol = meshVolumeCm3(mesh) * (0.2 + 0.8 * progress);
  const tick = computeQuote({ volumeCm3: vol, bboxMax: 110, materialId: "pla", infill: 20, layerHeight: 0.2, finish: "As printed", qty: 1 }).total;
  const rotate = useTransform(scrollYProgress, [0.8, 1], [0, reduced ? 0 : 18]);

  return (
    <section ref={ref} className={`relative ${reduced ? "" : "lg:h-[240vh]"}`}>
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">
        <div className="absolute inset-0 blueprint-grid opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
        <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-0">
          <div className="z-10">
            <Anno>additive manufacturing · made tactile</Anno>
            <h1 className="mt-4 max-w-xl">
              Design it. <span className="text-ink-dim">Price it.</span> <span className="text-signal">Print it.</span>
            </h1>
            <p className="mono mt-5 max-w-md text-ink-dim">
              <span className="text-ink">{CURRENCY}<NumberRoll value={tick} /></span> · live quote · layer {Math.round(progress * 100)}%
              <span className="ml-2 inline-block h-3 w-px animate-pulse bg-signal align-middle" />
            </p>
            <p className="mt-4 max-w-md text-ink-dim">
              Upload a model or start from a live parametric catalog, drag dimensions in a real-time 3D
              viewport, and watch the price build itself — layer by layer.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/configure"><Button className="bg-signal text-bg hover:bg-signal/90 gap-2">Open the configurator <ArrowRight size={16} /></Button></Link>
              <Link to="/upload"><Button variant="outline" className="gap-2">Upload a model</Button></Link>
            </div>
            <div className="mt-8 max-w-sm"><DimensionLine label={`${mesh.bbox.map((d: number) => d.toFixed(0)).join(" × ")} MM`} /></div>
          </div>

          <motion.div style={{ rotate }} className="relative h-[42vh] min-h-[260px] lg:h-[64vh]">
            <Viewport3D mesh={mesh} mode="solid" tint="#cfd6df" printProgress={progress} interactive={false} autoRotate={progress > 0.99} />
            <div className="pointer-events-none absolute right-2 top-2"><Anno>scroll to print →</Anno></div>
          </motion.div>
        </div>
        {!reduced && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2"><Anno>scroll</Anno></div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Capability strip ---------------- */
function CapabilityStrip() {
  const items = [
    { icon: Layers, t: "Live parametric", d: "Sliders morph the mesh & re-price in the same frame." },
    { icon: Gauge, t: "Glass-box quote", d: "Material · machine · supports · finishing · margin." },
    { icon: ScanLine, t: "Pre-flight heatmap", d: "Thin walls & overhangs flagged before you pay." },
    { icon: Boxes, t: "AR + nesting", d: "View at true scale; nest multi-part builds." },
  ];
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-16">
      <div className="grid gap-px overflow-hidden rounded-[6px] border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.t} className="bg-bg-elev p-5">
            <it.icon size={18} className="text-signal" />
            <h4 className="mt-3 text-ink">{it.t}</h4>
            <p className="mt-1 text-sm text-ink-dim">{it.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Wireframe → solid materialization ---------------- */
function Materialize({ mesh, reduced }: { mesh: any; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const [p, setP] = useState(reduced ? 1 : 0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setP(v));
  const mode = p < 0.45 ? "wireframe" : p < 0.7 ? "xray" : "solid";

  return (
    <section ref={ref} className="mx-auto max-w-[1400px] px-4 sm:px-6 py-20">
      <SectionTag index="02" label="From idea to object" />
      <div className="mt-8 grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h2>Wireframe to material,<br />scrubbed by scroll.</h2>
          <p className="mt-4 max-w-md text-ink-dim">
            Every part begins as an edge cage and resolves into a physically-shaded surface — the same
            transition the printer performs, made visible. The viewport is one shared context, paused when off-screen.
          </p>
          <div className="mt-6 flex gap-6">
            <span className="anno">mode · <span className="text-signal">{mode}</span></span>
            <span className="anno">progress · {Math.round(p * 100)}%</span>
          </div>
        </div>
        <div className="relative h-[360px] rounded-[6px] border border-hairline bg-bg-elev blueprint-dots">
          <Viewport3D mesh={mesh} mode={mode as any} tint="#8fb9c9" interactive={false} autoRotate />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Configurator teaser (interactive) ---------------- */
function ConfiguratorTeaser() {
  const part = useMemo(() => partById("knob"), []);
  const [dia, setDia] = useState(36);
  const mesh = useMemo(() => part.build({ dia }), [part, dia]);
  const quote = computeQuote({ volumeCm3: meshVolumeCm3(mesh), bboxMax: dia, materialId: "abs", infill: 30, layerHeight: 0.2, finish: "As printed", qty: 1 });
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-20">
      <SectionTag index="03" label="The tool, embedded" />
      <div className="mt-8 grid items-center gap-8 lg:grid-cols-2">
        <div className="relative h-[340px] rounded-[6px] border border-hairline bg-bg-elev blueprint-dots">
          <Viewport3D mesh={mesh} mode="solid" tint="#2b2f36" interactive autoRotate />
        </div>
        <div>
          <h2>It's live — try it.</h2>
          <p className="mt-3 max-w-md text-ink-dim">Drag the diameter. The mesh and the price move together, instantly.</p>
          <div className="mt-6 max-w-sm">
            <div className="flex items-baseline justify-between"><label className="text-sm text-ink">Diameter</label><span className="mono text-ink">{dia} mm</span></div>
            <input type="range" min={18} max={60} value={dia} onChange={(e) => setDia(+e.target.value)} className="mt-2 w-full accent-[var(--signal)]" />
          </div>
          <div className="mt-6 flex items-end gap-6">
            <div><Anno>instant quote</Anno><div className="font-display text-ink" style={{ fontSize: "2rem", fontWeight: 600 }}><NumberRoll value={quote.total} prefix={CURRENCY} /></div></div>
            <Link to="/configure"><Button variant="outline" className="gap-2">Full configurator <ArrowRight size={15} /></Button></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Self-building quote bar ---------------- */
function QuoteScene() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const quote = computeQuote({ volumeCm3: 42, bboxMax: 110, materialId: "resin", infill: 20, layerHeight: 0.12, finish: "Primed", qty: 1 });
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-20" ref={ref}>
      <SectionTag index="04" label="The price is a glass box" />
      <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2>Every taka,<br />accounted for.</h2>
          <p className="mt-4 max-w-md text-ink-dim">
            The cost bar assembles segment by segment — material, machine time, supports, finishing, margin —
            so nothing is hidden. Ask the agent to hit a budget and it names the trade-offs.
          </p>
        </div>
        <div className="rounded-[6px] border border-hairline bg-bg-elev p-6">
          <div className="mb-4 flex items-end justify-between">
            <Anno>itemised quote · standard resin</Anno>
            <span className="font-display text-ink" style={{ fontSize: "1.8rem", fontWeight: 600 }}>{fmt(quote.total)}</span>
          </div>
          {inView && <QuoteBar quote={quote} animateBuild />}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Pre-flight showcase ---------------- */
function PreflightShowcase() {
  const mesh = useMemo(() => partById("tray").build({ wall: 1.2 }), []);
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-20">
      <SectionTag index="05" label="Catch failures before the print" />
      <div className="mt-8 grid items-center gap-8 lg:grid-cols-2">
        <div className="relative h-[360px] rounded-[6px] border border-hairline bg-bg-elev blueprint-dots">
          <Viewport3D mesh={mesh} mode="solid" tint="#cfd6df" heatmap showOverhangs flaggedTags={["wall"]} interactive autoRotate />
          <div className="absolute bottom-3 left-3 flex gap-3 rounded-[4px] border border-hairline bg-bg/80 px-2.5 py-1.5 backdrop-blur">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[1px] bg-danger" /><Anno>thin wall</Anno></span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[1px] bg-warn" /><Anno>overhang</Anno></span>
          </div>
        </div>
        <div>
          <h2>A heatmap, not a surprise.</h2>
          <p className="mt-4 max-w-md text-ink-dim">
            Walls below the material's minimum glow red; unsupported overhangs glow orange. The Printability
            Advisor proposes fixes and the strongest orientation — you apply them with one tap.
          </p>
          <Link to="/preflight" className="mt-6 inline-block"><Button variant="outline" className="gap-2">See pre-flight <ArrowRight size={15} /></Button></Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Materials turntable ---------------- */
function MaterialsTurntable() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-20">
      <SectionTag index="06" label="Materials gallery" />
      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-hairline bg-hairline sm:grid-cols-3 lg:grid-cols-4">
        {MATERIALS.map((m) => (
          <div key={m.id} className="group bg-bg-elev p-6 text-center">
            <div className="flex justify-center transition-transform duration-500 group-hover:rotate-[8deg]">
              <MaterialSphere color={m.swatch} surface={m.surface} size={72} />
            </div>
            <h4 className="mt-4 text-ink">{m.name}</h4>
            <Anno>{m.process} · {m.surface}</Anno>
            <div className="mono mt-2 text-[0.72rem] text-ink-dim">{CURRENCY}{m.rate}/cm³ · {m.leadDays}d</div>
          </div>
        ))}
      </div>
      <div className="mt-6"><Link to="/materials"><Button variant="outline" className="gap-2">All materials & finishes <ArrowRight size={15} /></Button></Link></div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function CTABand() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-20">
      <div className="relative overflow-hidden rounded-[8px] border border-signal/30 bg-signal/5 px-6 py-16 text-center blueprint-grid">
        <h2 className="mx-auto max-w-2xl">Start with a slider, finish with a part on your desk.</h2>
        <div className="mt-7 flex justify-center gap-3">
          <Link to="/configure"><Button className="bg-signal text-bg hover:bg-signal/90 gap-2">Open the configurator <ArrowRight size={16} /></Button></Link>
          <Link to="/materials"><Button variant="outline">Browse materials</Button></Link>
        </div>
      </div>
    </section>
  );
}
