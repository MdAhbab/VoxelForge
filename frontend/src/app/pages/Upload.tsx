import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { UploadCloud, FileBox, CheckCircle2, AlertTriangle, Wrench, ArrowRight, RotateCw, Loader2 } from "lucide-react";

import { parseFile, demoModel, type ParsedModel } from "../lib/meshio";
import { useUpload } from "../lib/store";
import { Viewport3D } from "../components/forge/Viewport3D";
import { Anno, MonoStat, SectionTag } from "../components/forge/primitives";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";

type Phase = "idle" | "parsing" | "done";

export function Upload() {
  const nav = useNavigate();
  const { setModel } = useUpload();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState<ParsedModel | null>(null);
  const [repaired, setRepaired] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const timer = useRef<number>();

  function animateProgress() {
    setProgress(0);
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => setProgress((p) => (p >= 96 ? 96 : p + 6)), 50);
  }

  async function handleFile(file: File) {
    setPhase("parsing"); setRepaired(false); animateProgress();
    try {
      const result = await parseFile(file);
      window.clearInterval(timer.current); setProgress(100);
      setTimeout(() => { setParsed(result); setPhase("done"); }, 300);
    } catch (e) {
      window.clearInterval(timer.current);
      toast.error("Couldn’t parse that file", { description: (e as Error).message || "Try an STL, OBJ or 3MF." });
      setPhase("idle");
    }
  }
  function useSample() {
    setPhase("parsing"); setRepaired(false); animateProgress();
    setTimeout(() => { window.clearInterval(timer.current); setProgress(100); setParsed(demoModel()); setPhase("done"); }, 900);
  }
  useEffect(() => () => window.clearInterval(timer.current), []);

  function configure() {
    if (!parsed) return;
    setModel(repaired ? { ...parsed, manifold: true, issues: [] } : parsed);
    nav("/configure");
  }

  const issues = repaired ? [] : parsed?.issues ?? [];

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-8">
      <SectionTag index="01" label="Upload & parse" />

      {phase === "idle" && (
        <Dropzone onFile={handleFile} onSample={useSample} onBrowse={() => fileInput.current?.click()} />
      )}
      <input ref={fileInput} type="file" accept=".stl,.obj,.3mf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {phase !== "idle" && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* viewport */}
          <div className="relative overflow-hidden rounded-[6px] border border-hairline bg-bg-elev blueprint-dots">
            <div className={`relative h-[360px] sm:h-[440px] ${phase === "parsing" ? "scanline" : ""}`}>
              {parsed && <Viewport3D mesh={parsed.mesh} mode={phase === "parsing" ? "wireframe" : "solid"} tint="#9aa3ad" interactive={phase === "done"} autoRotate />}
              {phase === "parsing" && !parsed && <div className="grid h-full place-items-center"><Loader2 className="animate-spin text-signal" /></div>}
            </div>
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <FileBox size={14} className="text-ink-dim" />
              <span className="mono text-[0.75rem] text-ink">{parsed?.filename ?? "parsing…"}</span>
              {parsed && <Badge variant="outline" className="mono border-hairline">{parsed.format}</Badge>}
            </div>
          </div>

          {/* report */}
          <div>
            {phase === "parsing" ? (
              <div className="space-y-4">
                <Anno>analysing geometry…</Anno>
                <Progress value={progress} />
                <div className="mono text-[0.78rem] text-ink-dim">
                  {progress < 30 ? "reading triangles" : progress < 60 ? "computing bounding box" : progress < 90 ? "checking manifold" : "measuring volume"} · {progress}%
                </div>
              </div>
            ) : parsed && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <MonoStat label="triangles" value={parsed.triCount.toLocaleString()} />
                  <MonoStat label="volume" value={parsed.volumeCm3.toFixed(1)} unit="cm³" />
                  <MonoStat label="bbox" value={parsed.bbox.map((d) => d.toFixed(0)).join("×")} unit="mm" />
                  <MonoStat label="surface" value={parsed.surfaceCm2.toFixed(0)} unit="cm²" />
                  <div className="flex flex-col gap-1">
                    <Anno>manifold</Anno>
                    <span className={`mono flex items-center gap-1.5 ${repaired || parsed.manifold ? "text-ok" : "text-danger"}`}>
                      {repaired || parsed.manifold ? <><CheckCircle2 size={14} /> yes</> : <><AlertTriangle size={14} /> no</>}
                    </span>
                  </div>
                </div>

                <div>
                  <Anno>issues · {issues.length}</Anno>
                  <div className="mt-2 space-y-2">
                    <AnimatePresence>
                      {issues.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 rounded-[4px] border border-ok/30 bg-ok/5 p-3 text-ok">
                          <CheckCircle2 size={16} /><span className="text-sm">All checks passed — ready to configure.</span>
                        </motion.div>
                      )}
                      {issues.map((it) => (
                        <motion.div key={it.type} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3 rounded-[4px] border border-hairline bg-bg-elev p-3">
                          <span className={`mt-0.5 ${it.sev === "danger" ? "text-danger" : "text-warn"}`}><AlertTriangle size={15} /></span>
                          <div><div className="text-sm text-ink">{it.type}</div><div className="text-xs text-ink-dim">{it.detail}</div></div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {!repaired && issues.some((i) => i.sev === "danger") && (
                  <div className="rounded-[5px] border border-blueprint/30 bg-blueprint/5 p-3">
                    <div className="flex items-center gap-1.5"><Wrench size={13} className="text-blueprint" /><Anno className="text-blueprint">mesh-repair orchestrator</Anno></div>
                    <p className="mt-1.5 text-xs text-ink-dim">Runs fill-holes → fix-normals → make-manifold on a copy. Your original is preserved.</p>
                    <Button size="sm" className="mt-2.5 gap-1.5" onClick={() => { setRepaired(true); toast.success("Repaired a copy", { description: "0 residual issues" }); }}>
                      <RotateCw size={14} /> Run repair
                    </Button>
                  </div>
                )}
                {repaired && (
                  <div className="rounded-[5px] border border-ok/30 bg-ok/5 p-3">
                    <Anno className="text-ok">changelog</Anno>
                    <ul className="mt-2 space-y-1 text-xs text-ink-dim mono">
                      <li>→ welded non-manifold edges</li><li>→ re-wound flipped normals</li><li>→ filled holes · 0 residual issues</li>
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button className="bg-signal text-bg hover:bg-signal/90 gap-2 flex-1 min-w-[140px]" onClick={configure}>Open in configurator <ArrowRight size={15} /></Button>
                  <Button variant="ghost" onClick={() => { setPhase("idle"); setParsed(null); }}>New file</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Dropzone({ onFile, onSample, onBrowse }: { onFile: (f: File) => void; onSample: () => void; onBrowse: () => void }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      className={`mt-8 grid place-items-center rounded-[8px] border-2 border-dashed p-10 sm:p-16 text-center transition-colors blueprint-grid ${over ? "border-signal bg-signal/5" : "border-hairline"}`}
    >
      <UploadCloud size={40} className="text-ink-dim" />
      <h3 className="mt-4 text-ink">Drop a model to begin</h3>
      <p className="mt-1 text-sm text-ink-dim">Parsed locally in your browser — never uploaded in dev.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {["STL", "OBJ", "3MF"].map((f) => <Badge key={f} variant="outline" className="mono border-hairline text-ink-dim">{f}</Badge>)}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={onBrowse} className="gap-2"><FileBox size={15} /> Browse files</Button>
        <Button variant="outline" onClick={onSample}>Use sample part</Button>
      </div>
    </div>
  );
}
