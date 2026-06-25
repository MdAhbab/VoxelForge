import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Sparkles, Compass, Wrench, ArrowRight, Gauge } from "lucide-react";

import { partById } from "../lib/catalog";
import { Viewport3D } from "../components/forge/Viewport3D";
import { Anno, SectionTag, MonoStat } from "../components/forge/primitives";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

interface Issue { id: string; sev: "danger" | "warn"; type: string; where: string; fix: string; fixed?: boolean; }

export function Preflight() {
  const nav = useNavigate();
  const [wallFixed, setWallFixed] = useState(false);
  const [oriented, setOriented] = useState(false);
  const [showOverhangs, setShowOverhangs] = useState(true);

  const mesh = useMemo(() => partById("phone-stand").build({ wall: wallFixed ? 3.2 : 1.4 }), [wallFixed]);

  const [issues, setIssues] = useState<Issue[]>([
    { id: "wall", sev: "danger", type: "Thin walls", where: "back support · 1.4 mm", fix: "Thicken to 3.2 mm" },
    { id: "overhang", sev: "warn", type: "Unsupported overhang", where: "cradle lip · 58°", fix: "Re-orient 18° back" },
    { id: "feature", sev: "warn", type: "Small feature", where: "cable slot fillet · 0.6 mm", fix: "Increase radius" },
  ]);

  function applyFix(id: string) {
    setIssues((p) => p.map((i) => (i.id === id ? { ...i, fixed: true } : i)));
    if (id === "wall") setWallFixed(true);
    if (id === "overhang") setOriented(true);
  }
  const open = issues.filter((i) => !i.fixed);
  const score = Math.max(40, 100 - open.reduce((a, i) => a + (i.sev === "danger" ? 22 : 8), 0));
  const flagged = wallFixed ? [] : ["wall"];

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><SectionTag index="04" label="Printability pre-flight" /><h2 className="mt-3">Adjustable Phone Stand</h2></div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="mono gap-1.5 border-hairline">
            <Gauge size={13} /> score
            <span className={score > 85 ? "text-ok" : score > 65 ? "text-warn" : "text-danger"}>{score}</span>
          </Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* heatmap viewport */}
        <div className="relative overflow-hidden rounded-[6px] border border-hairline bg-bg-elev blueprint-dots">
          <motion.div animate={{ rotate: oriented ? 6 : 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="relative h-[480px]">
            <Viewport3D mesh={mesh} mode="solid" tint="#cfd6df" heatmap showOverhangs={showOverhangs} flaggedTags={flagged} interactive autoRotate />
          </motion.div>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-[4px] border border-hairline bg-bg/80 px-3 py-2 backdrop-blur">
            <Legend color="var(--danger)" label="wall < min" />
            <Legend color="var(--warn)" label="overhang > 45°" />
            <Legend color="var(--ink-dim)" label="passes" />
          </div>
          <button onClick={() => setShowOverhangs((o) => !o)} className="absolute right-3 top-3 mono text-[0.7rem] rounded-[3px] border border-hairline bg-bg/80 px-2 py-1 text-ink-dim backdrop-blur hover:text-ink">
            overhangs · {showOverhangs ? "on" : "off"}
          </button>
        </div>

        {/* issues + orientation */}
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <MonoStat label="open issues" value={open.length} />
            <MonoStat label="overhang" value={oriented ? "12" : "31"} unit="%" />
            <MonoStat label="supports" value={oriented ? "1.4" : "3.1"} unit="cm³" />
          </div>

          <div>
            <Anno>issue list · auto-fix</Anno>
            <div className="mt-2 space-y-2">
              {issues.map((it) => (
                <motion.div key={it.id} layout className={`flex items-start gap-3 rounded-[4px] border p-3 ${it.fixed ? "border-ok/30 bg-ok/5" : "border-hairline bg-bg-elev"}`}>
                  <span className={`mt-0.5 ${it.fixed ? "text-ok" : it.sev === "danger" ? "text-danger" : "text-warn"}`}>
                    {it.fixed ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink">{it.type}</div>
                    <div className="mono text-[0.72rem] text-ink-dim">{it.where}</div>
                  </div>
                  {it.fixed ? (
                    <span className="mono text-[0.7rem] text-ok">applied</span>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => applyFix(it.id)}>
                      <Wrench size={12} /> {it.fix}
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* best orientation — Printability Advisor */}
          <div className="rounded-[5px] border border-signal/30 bg-signal/5 p-3">
            <div className="flex items-center gap-1.5"><Sparkles size={13} className="text-signal" /><Anno className="text-signal">printability advisor</Anno></div>
            <div className="mt-2 flex items-center gap-3">
              <Compass size={18} className="text-signal" />
              <p className="flex-1 text-sm text-ink-dim">
                Best orientation tilts the part <span className="mono text-ink">18°</span> back — cuts supports
                <span className="mono text-ink"> ~55%</span> and aligns layers with the load path.
              </p>
            </div>
            <Button size="sm" className="mt-2.5" disabled={oriented} onClick={() => { setOriented(true); applyFix("overhang"); }}>
              {oriented ? "Orientation applied" : "Apply orientation"}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 bg-signal text-bg hover:bg-signal/90 gap-2" disabled={open.length > 0} onClick={() => nav("/cart")}>
              {open.length > 0 ? `Resolve ${open.length} issue${open.length > 1 ? "s" : ""}` : "Looks good — add to cart"} <ArrowRight size={15} />
            </Button>
            <Button variant="outline" onClick={() => nav("/configure")}>Back to configure</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[1px]" style={{ background: color }} /><Anno>{label}</Anno></span>;
}
