import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Sparkles, Wand2, Box, Upload as UploadIcon, RotateCcw, ScanLine, Layers, Eye, ShieldCheck, FileBox, Bookmark, Maximize2 } from "lucide-react";

import { CATALOG, partById } from "../lib/catalog";
import { MATERIALS, materialById } from "../lib/materials";
import { computeQuote, fmt, searchBudget, CURRENCY } from "../lib/pricing";
import { meshVolumeCm3, scaleMesh, type Mesh } from "../lib/geometry";
import { useCart, useUpload, useAuth, useDesigns } from "../lib/store";
import * as api from "../lib/api";

import { Viewport3D, type ViewMode } from "../components/forge/Viewport3D";
import { ParamSlider } from "../components/forge/ParamSlider";
import { MaterialChip } from "../components/forge/MaterialChip";
import { QuoteBar } from "../components/forge/QuoteBar";
import { Anno, NumberRoll, MonoStat, SectionTag } from "../components/forge/primitives";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";

const UPLOAD_ID = "__upload__";

function defaults(partId: string) {
  const o: Record<string, number> = {};
  for (const p of partById(partId).params) o[p.key] = p.def;
  return o;
}

function parseNL(text: string, partId: string) {
  const part = partById(partId);
  const out: Record<string, number> = {};
  const notes: string[] = [];
  const nums = (text.match(/\d+(\.\d+)?/g) || []).map(Number);
  const t = text.toLowerCase();
  if (/angle|°|degree/.test(t)) {
    const deg = nums.find((n) => n >= 30 && n <= 80);
    if (deg && part.params.some((p) => p.key === "angle")) { out.angle = deg; notes.push(`angle → ${deg}°`); }
  }
  if (/phone|device|width|wide/.test(t)) {
    const w = nums.find((n) => n >= 60 && n <= 110);
    if (w && part.params.some((p) => p.key === "deviceW")) { out.deviceW = w; notes.push(`device width → ${w} mm`); }
  }
  if (/dowel|shaft|bore|fit/.test(t)) {
    const s = nums.find((n) => n >= 4 && n <= 20);
    if (s && part.params.some((p) => p.key === "shaft")) { out.shaft = s; notes.push(`shaft bore → ${s} mm`); }
  }
  for (const p of part.params) {
    if (out[p.key] == null && new RegExp(p.label.split(" ")[0].toLowerCase()).test(t)) {
      const v = nums.find((n) => n >= p.min && n <= p.max);
      if (v != null) { out[p.key] = v; notes.push(`${p.label.toLowerCase()} → ${v}${p.unit}`); }
    }
  }
  return { values: out, notes };
}

export function Configurator() {
  const nav = useNavigate();
  const cart = useCart();
  const { model } = useUpload();
  const { user } = useAuth();
  const designs = useDesigns();

  const [partId, setPartId] = useState(CATALOG[0].id);
  const [params, setParams] = useState<Record<string, number>>(() => defaults(CATALOG[0].id));
  const [scale, setScale] = useState(1);
  const [materialId, setMaterialId] = useState("pla");
  const [finish, setFinish] = useState(materialById("pla").finishes[0]);
  const [infill, setInfill] = useState(20);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState<ViewMode>("solid");
  const [heatmap, setHeatmap] = useState(false);

  const [nl, setNl] = useState("");
  const [nlResult, setNlResult] = useState<{ values: Record<string, number>; notes: string[] } | null>(null);
  const [budget, setBudget] = useState("");
  const [combos, setCombos] = useState<ReturnType<typeof searchBudget>>([]);

  // auto-select an uploaded model when it arrives
  useEffect(() => { if (model) { setPartId(UPLOAD_ID); setScale(1); } }, [model]);

  const isUpload = partId === UPLOAD_ID && !!model;
  const part = isUpload ? null : partById(partId);
  const material = materialById(materialId);

  const mesh: Mesh = useMemo(
    () => (isUpload ? scaleMesh(model!.mesh, scale) : part!.build(params)),
    [isUpload, model, scale, part, params]
  );
  const volume = useMemo(() => meshVolumeCm3(mesh), [mesh]);
  const bboxMax = Math.max(...mesh.bbox);

  const wallKey = part?.params.find((p) => /wall|thick/.test(p.key));
  const thinWall = !isUpload && wallKey ? params[wallKey.key] < material.minWall : false;
  const overSize = bboxMax > material.maxBbox;
  const nonManifold = isUpload ? !model!.manifold : false;
  const flaggedTags = thinWall ? ["wall"] : [];

  const [quote, setQuote] = useState<any>({
    segments: [], total: 0, totalQty: 0, estMinutes: 0, supportCm3: 0, effectiveVolume: 0, currency: "৳"
  });

  useEffect(() => {
    const t = setTimeout(() => {
      api.createQuote({
        source: isUpload ? "upload" : "catalog",
        part_id: isUpload ? undefined : partId,
        upload_id: isUpload ? UPLOAD_ID : undefined,
        volumeCm3: volume,
        materialId,
        infill,
        layerHeight,
        finish,
        qty
      }).then(setQuote).catch(console.error);
    }, 150);
    return () => clearTimeout(t);
  }, [volume, bboxMax, materialId, infill, layerHeight, finish, qty, isUpload, partId]);

  const preflightScore = Math.max(40, 100 - (thinWall ? 22 : 0) - (overSize ? 30 : 0) - (nonManifold ? 18 : 0) - (infill > 60 ? 4 : 0));
  const partName = isUpload ? model!.filename : part!.name;

  function selectPart(id: string) {
    setPartId(id);
    if (id !== UPLOAD_ID) setParams(defaults(id));
    setNlResult(null);
  }
  function selectMaterial(id: string) { setMaterialId(id); setFinish(materialById(id).finishes[0]); }
  function applyNL() {
    if (!nl.trim() || isUpload) return;
    const r = parseNL(nl, partId);
    setNlResult(r);
    if (Object.keys(r.values).length) {
      setParams((p) => ({ ...p, ...r.values }));
      toast.success("Parametric agent applied changes", { description: r.notes.join(" · ") });
    } else toast.message("No matching parameters", { description: "Try mentioning a dimension this part exposes." });
  }
  function solveBudget() {
    const target = Number(budget.replace(/[^\d.]/g, ""));
    if (!target) return;
    const res = searchBudget({ volumeCm3: volume, bboxMax, materialId, infill, layerHeight, finish, qty }, target, MATERIALS);
    setCombos(res);
    if (!res.length) toast.error(`No printable combo under ${fmt(target)}`, { description: "Try raising the budget." });
  }
  function addToCart() {
    cart.add({
      id: crypto.randomUUID(), partName, materialId, materialName: material.name,
      finish, infill, layerHeight, qty, unitPrice: quote.total, bbox: mesh.bbox, preflightScore,
    });
    toast.success("Added to cart", { description: `${partName} · ${material.name}` });
  }
  function saveDesign() {
    if (!user) { toast.message("Sign in to save designs", { description: "Your saved designs live in your account." }); nav("/login", { state: { from: "/configure" } }); return; }
    designs.save({
      name: partName, partName, source: isUpload ? "upload" : "catalog",
      materialId, materialName: material.name, finish, infill, layerHeight,
      params: isUpload ? { scale } : params, unitPrice: quote.total, bbox: mesh.bbox,
    });
    toast.success("Design saved", { description: "Find it in your account." });
  }

  const sources = [
    ...(model ? [{ id: UPLOAD_ID, name: model.filename, category: "Uploaded", upload: true }] : []),
    ...CATALOG.map((p) => ({ id: p.id, name: p.name, category: p.category, upload: false })),
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Anno>Configurator · {isUpload ? "uploaded model" : "live parametric"}</Anno>
          <h2 className="mt-1 truncate">{partName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="mono gap-1.5 border-hairline text-ink-dim">
            <span className={`h-1.5 w-1.5 rounded-full ${preflightScore > 85 ? "bg-ok" : preflightScore > 65 ? "bg-warn" : "bg-danger"}`} />
            pre-flight {preflightScore}
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => nav("/preflight")}><ShieldCheck size={14} /> Pre-flight</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_360px]">
        {/* ---------- LEFT: part source ---------- */}
        <aside className="order-2 lg:order-1 space-y-3">
          <SectionTag index="01" label="Part source" />
          {/* horizontal scroll on mobile, vertical list on desktop */}
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:grid lg:grid-cols-1 lg:overflow-visible lg:px-0">
            {sources.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPart(p.id)}
                className={`group flex shrink-0 items-center gap-3 rounded-[4px] border p-2.5 text-left transition-colors lg:w-full ${
                  p.id === partId ? "border-signal bg-signal/10" : "border-hairline bg-bg-elev hover:border-signal/40"
                }`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[3px] bg-bg blueprint-grid text-ink-dim">
                  {p.upload ? <FileBox size={16} className="text-signal" /> : <Box size={16} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-ink truncate max-w-[140px]">{p.name}</span>
                  <Anno>{p.category}</Anno>
                </span>
              </button>
            ))}
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={() => nav("/upload")}>
            <UploadIcon size={15} /> {model ? "Upload another" : "Upload STL / OBJ / 3MF"}
          </Button>
        </aside>

        {/* ---------- CENTER: viewport ---------- */}
        <section className="order-1 lg:order-2">
          <div className="relative overflow-hidden rounded-[6px] border border-hairline bg-bg-elev">
            <div className="flex items-center justify-between gap-2 px-3 py-2 hairline-b">
              <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as ViewMode)} className="gap-1">
                <ToggleGroupItem value="solid" className="mono text-[0.72rem] data-[state=on]:text-signal"><Layers size={13} className="mr-1" />Solid</ToggleGroupItem>
                <ToggleGroupItem value="wireframe" className="mono text-[0.72rem] data-[state=on]:text-signal">Wire</ToggleGroupItem>
                <ToggleGroupItem value="xray" className="mono text-[0.72rem] data-[state=on]:text-signal"><Eye size={13} className="mr-1" />X-ray</ToggleGroupItem>
              </ToggleGroup>
              <button onClick={() => setHeatmap((h) => !h)} className={`mono text-[0.72rem] rounded-[3px] border px-2 py-1 transition-colors ${heatmap ? "border-warn text-warn" : "border-hairline text-ink-dim hover:text-ink"}`}>
                <ScanLine size={12} className="mr-1 inline" /><span className="hidden sm:inline">pre-flight </span>overlay
              </button>
            </div>

            <div className="relative h-[clamp(300px,52vh,560px)] blueprint-dots">
              <Viewport3D mesh={mesh} mode={mode} tint={material.swatch} heatmap={heatmap} flaggedTags={flaggedTags} showOverhangs={heatmap} autoRotate={false} />
              <div className="pointer-events-none absolute left-3 top-3 space-y-1">
                <Anno>{material.process} · {material.name}</Anno>
                <div className="mono text-[0.72rem] text-ink-dim">{mesh.bbox.map((d) => d.toFixed(0)).join(" × ")} mm</div>
              </div>
              <div className="pointer-events-none absolute bottom-3 right-3 text-right"><Anno>drag to orbit</Anno></div>
              {heatmap && (
                <div className="absolute bottom-3 left-3 flex gap-3 rounded-[4px] border border-hairline bg-bg/80 px-2.5 py-1.5 backdrop-blur">
                  <Legend color="var(--danger)" label="thin wall" /><Legend color="var(--warn)" label="overhang" /><Legend color="var(--ink-dim)" label="ok" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MonoStat label="volume" value={<NumberRoll value={volume} decimals={1} />} unit="cm³" />
            <MonoStat label="material in part" value={<NumberRoll value={quote.effectiveVolume} decimals={1} />} unit="cm³" />
            <MonoStat label="machine time" value={<NumberRoll value={quote.estMinutes} />} unit="min" />
            <MonoStat label="supports" value={<NumberRoll value={quote.supportCm3} decimals={1} />} unit="cm³" />
          </div>
        </section>

        {/* ---------- RIGHT: controls ---------- */}
        <aside className="order-3 space-y-5">
          <Tabs defaultValue="shape">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="shape" className="mono text-[0.72rem]">Shape</TabsTrigger>
              <TabsTrigger value="material" className="mono text-[0.72rem]">Material</TabsTrigger>
              <TabsTrigger value="print" className="mono text-[0.72rem]">Print</TabsTrigger>
              <TabsTrigger value="quote" className="mono text-[0.72rem]">Quote</TabsTrigger>
            </TabsList>

            {/* SHAPE */}
            <TabsContent value="shape" className="space-y-5 pt-4">
              {isUpload ? (
                <>
                  <div className="rounded-[5px] border border-signal/30 bg-signal/5 p-3">
                    <div className="flex items-center gap-1.5"><FileBox size={13} className="text-signal" /><Anno className="text-signal">uploaded · {model!.format}</Anno></div>
                    <div className="mono mt-2 grid grid-cols-2 gap-2 text-[0.72rem] text-ink-dim">
                      <span>{model!.triCount.toLocaleString()} tris</span>
                      <span className={nonManifold ? "text-danger" : "text-ok"}>{nonManifold ? "non-manifold" : "manifold"}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between"><label className="text-sm text-ink">Uniform scale</label><span className="mono text-[0.82rem] text-ink">{Math.round(scale * 100)}<span className="text-ink-dim text-[0.7rem] ml-1">%</span></span></div>
                    <Slider className="mt-2.5" min={0.25} max={2.5} step={0.05} value={[scale]} onValueChange={(v) => setScale(v[0])} />
                    <div className="mt-1 flex justify-between"><Anno>25%</Anno><Anno>250%</Anno></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { const target = 200 / Math.max(...model!.mesh.bbox); setScale(Number(target.toFixed(2))); toast.success("Scaled to fit 200 mm"); }}><Maximize2 size={13} /> Fit 200 mm</Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setScale(1)}><RotateCcw size={13} /> 100%</Button>
                  </div>
                  <MonoStat label="scaled bbox" value={mesh.bbox.map((d) => d.toFixed(0)).join("×")} unit="mm" />
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {part!.presets.map((pr) => (
                      <button key={pr.label} onClick={() => setParams((p) => ({ ...p, ...pr.values }))} className="mono text-[0.7rem] rounded-full border border-hairline px-2.5 py-1 text-ink-dim hover:border-signal/50 hover:text-ink">{pr.label}</button>
                    ))}
                    <button onClick={() => setParams(defaults(partId))} className="mono text-[0.7rem] inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-ink-dim hover:text-ink"><RotateCcw size={11} /> reset</button>
                  </div>
                  {part!.params.map((d) => (
                    <ParamSlider key={d.key} def={d} value={params[d.key]} flagged={/wall|thick/.test(d.key) && params[d.key] < material.minWall} onChange={(v) => setParams((p) => ({ ...p, [d.key]: v }))} />
                  ))}
                  <div className="rounded-[5px] border border-blueprint/30 bg-blueprint/5 p-3">
                    <div className="flex items-center gap-1.5"><Wand2 size={13} className="text-blueprint" /><Anno className="text-blueprint">parametric agent</Anno></div>
                    <div className="mt-2 flex gap-2">
                      <Input value={nl} onChange={(e) => setNl(e.target.value)} placeholder='e.g. "fits a 6.7" phone at 60°"' className="h-9" onKeyDown={(e) => e.key === "Enter" && applyNL()} />
                      <Button size="sm" className="h-9" onClick={applyNL}>Apply</Button>
                    </div>
                    <AnimatePresence>
                      {nlResult && nlResult.notes.length > 0 && (
                        <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1">
                          {nlResult.notes.map((n) => <li key={n} className="mono text-[0.72rem] text-ink-dim">→ {n}</li>)}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </TabsContent>

            {/* MATERIAL */}
            <TabsContent value="material" className="space-y-3 pt-4">
              <div className="grid gap-2">
                {MATERIALS.map((m) => <MaterialChip key={m.id} material={m} selected={m.id === materialId} onClick={() => selectMaterial(m.id)} />)}
              </div>
              <div className="pt-1">
                <Anno>finish</Anno>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {material.finishes.map((f) => <button key={f} onClick={() => setFinish(f)} className={`mono text-[0.72rem] rounded-full border px-3 py-1 ${f === finish ? "border-signal text-signal" : "border-hairline text-ink-dim hover:text-ink"}`}>{f}</button>)}
                </div>
                <p className="mt-3 text-sm text-ink-dim">{material.note}</p>
                <div className="mt-2 grid grid-cols-2 gap-2"><MonoStat label="min wall" value={material.minWall} unit="mm" /><MonoStat label="lead time" value={material.leadDays} unit="days" /></div>
              </div>
            </TabsContent>

            {/* PRINT */}
            <TabsContent value="print" className="space-y-6 pt-4">
              <div>
                <div className="flex items-baseline justify-between"><label className="text-sm text-ink">Infill</label><span className="mono text-[0.82rem] text-ink">{infill}<span className="text-ink-dim text-[0.7rem] ml-1">%</span></span></div>
                <Slider className="mt-2.5" min={5} max={100} step={5} value={[infill]} onValueChange={(v) => setInfill(v[0])} />
              </div>
              <div>
                <div className="flex items-baseline justify-between"><label className="text-sm text-ink">Layer height</label><span className="mono text-[0.82rem] text-ink">{layerHeight.toFixed(2)}<span className="text-ink-dim text-[0.7rem] ml-1">mm</span></span></div>
                <Slider className="mt-2.5" min={0.08} max={0.32} step={0.04} value={[layerHeight]} onValueChange={(v) => setLayerHeight(v[0])} />
                <div className="mt-1 flex justify-between"><Anno>fine · slow</Anno><Anno>coarse · fast</Anno></div>
              </div>
              <div>
                <label className="text-sm text-ink">Quantity</label>
                <div className="mt-2 flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty((q) => Math.max(1, q - 1))}>–</Button>
                  <span className="mono w-10 text-center text-ink">{qty}</span>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty((q) => q + 1)}>+</Button>
                </div>
              </div>
            </TabsContent>

            {/* QUOTE */}
            <TabsContent value="quote" className="space-y-4 pt-4">
              <QuoteBar quote={quote} animateBuild />
              <div className="rounded-[5px] border border-signal/30 bg-signal/5 p-3">
                <div className="flex items-center gap-1.5"><Sparkles size={13} className="text-signal" /><Anno className="text-signal">quote explainer · budget solver</Anno></div>
                <div className="mt-2 flex gap-2">
                  <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={`make it under ${CURRENCY}800`} className="h-9" onKeyDown={(e) => e.key === "Enter" && solveBudget()} />
                  <Button size="sm" className="h-9" onClick={solveBudget}>Solve</Button>
                </div>
                <AnimatePresence>
                  {combos.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
                      {combos.map((c, i) => (
                        <button key={i} onClick={() => { selectMaterial(c.material.id); setInfill(c.infill); setLayerHeight(c.layerHeight); toast.success("Applied cheaper combo"); }} className="flex w-full items-center justify-between rounded-[4px] border border-hairline bg-bg-elev px-2.5 py-2 text-left hover:border-signal/50">
                          <span className="min-w-0"><span className="block text-sm text-ink truncate">{c.material.name}</span><Anno>{c.infill}% infill · {c.layerHeight}mm</Anno></span>
                          <span className="mono text-signal text-sm">{fmt(c.total)}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>

          {/* sticky quote / CTA */}
          <div className="sticky bottom-3 rounded-[6px] border border-hairline bg-panel p-4 shadow-lg shadow-black/20">
            <div className="flex items-end justify-between">
              <div>
                <Anno>total · {qty > 1 ? `${qty} units` : "per unit"}</Anno>
                <div className="font-display text-ink" style={{ fontSize: "2rem", fontWeight: 600 }}><NumberRoll value={quote.totalQty} prefix={CURRENCY} /></div>
              </div>
              {(thinWall || overSize || nonManifold) && (
                <Badge className="bg-danger/15 text-danger border-0 mono text-[0.68rem]">{thinWall ? "thin wall" : overSize ? "over build size" : "non-manifold"}</Badge>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={saveDesign} className="gap-1.5"><Bookmark size={15} /><span className="hidden sm:inline">Save</span></Button>
              <Button variant="outline" onClick={() => nav("/preflight")} className="gap-1.5"><ShieldCheck size={15} /><span className="hidden sm:inline">Pre-flight</span></Button>
              <Button onClick={addToCart} className="bg-signal text-bg hover:bg-signal/90">Add</Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[1px]" style={{ background: color }} /><Anno>{label}</Anno></span>;
}
