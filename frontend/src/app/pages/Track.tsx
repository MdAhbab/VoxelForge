import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ClipboardCheck, Printer, Sparkles, Truck, CheckCircle2 } from "lucide-react";
import { Anno, SectionTag, MonoStat } from "../components/forge/primitives";
import { Button } from "../components/ui/button";

const STAGES = [
  { key: "review", label: "Review", icon: ClipboardCheck, note: "Pre-flight verified · queued" },
  { key: "printing", label: "Printing", icon: Printer, note: "Layer 412 / 980 · PLA" },
  { key: "post", label: "Post-processing", icon: Sparkles, note: "Support removal · finish" },
  { key: "shipped", label: "Shipped", icon: Truck, note: "Courier · tracking VF-4821" },
];

export function Track() {
  const [active, setActive] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(STAGES.length - 1, a + 1)), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-8">
      <SectionTag index="08" label="Order tracking" />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Order <span className="mono text-signal">#VF-4821</span></h2>
          <Anno>placed 2026-06-25 · est. delivery 2026-06-29</Anno>
        </div>
        <div className="flex items-center gap-2 rounded-[4px] border border-ok/30 bg-ok/5 px-3 py-1.5 text-ok">
          <CheckCircle2 size={15} /><span className="text-sm">Order confirmed</span>
        </div>
      </div>

      {/* horizontal process timeline / gantt */}
      <div className="mt-10 rounded-[6px] border border-hairline bg-bg-elev p-6">
        <div className="relative">
          <div className="absolute left-0 right-0 top-5 h-px bg-hairline" />
          <motion.div className="absolute left-0 top-5 h-px bg-signal" initial={{ width: 0 }} animate={{ width: `${(active / (STAGES.length - 1)) * 100}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
          <div className="relative grid grid-cols-4 gap-2">
            {STAGES.map((s, i) => {
              const done = i < active, live = i === active;
              return (
                <div key={s.key} className="flex flex-col items-center text-center">
                  <span className={`grid h-10 w-10 place-items-center rounded-full border ${done ? "border-signal bg-signal text-bg" : live ? "border-signal bg-bg text-signal pulse-ring" : "border-hairline bg-bg text-ink-dim"}`}>
                    <s.icon size={16} />
                  </span>
                  <span className={`mt-2 text-sm ${i <= active ? "text-ink" : "text-ink-dim"}`}>{s.label}</span>
                  <Anno className="mt-0.5 hidden sm:block">{i < active ? "done" : live ? "in progress" : "queued"}</Anno>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-[4px] border border-hairline bg-bg p-4">
          <Anno>current stage · {STAGES[active].label}</Anno>
          <p className="mono mt-2 text-sm text-ink">{STAGES[active].note}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MonoStat label="items" value={3} />
          <MonoStat label="material" value="PLA · ABS" />
          <MonoStat label="batches" value={1} />
          <MonoStat label="carrier" value="Courier" />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link to="/configure"><Button className="bg-signal text-bg hover:bg-signal/90">Design another part</Button></Link>
        <Link to="/"><Button variant="outline">Back home</Button></Link>
      </div>
    </div>
  );
}
