import { useState } from "react";
import { Link } from "react-router";
import { MATERIALS, type Process } from "../lib/materials";
import { CURRENCY } from "../lib/pricing";
import { MaterialSphere } from "../components/forge/MaterialChip";
import { Anno, SectionTag, MonoStat } from "../components/forge/primitives";
import { Button } from "../components/ui/button";
import { ArrowRight } from "lucide-react";

const PROCESSES: ("ALL" | Process)[] = ["ALL", "FDM", "SLA", "SLS", "MJF"];

export function Materials() {
  const [filter, setFilter] = useState<"ALL" | Process>("ALL");
  const list = MATERIALS.filter((m) => filter === "ALL" || m.process === filter);

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <SectionTag index="05" label="Materials & finishes" />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h2 className="max-w-lg">Seven materials, four processes,<br />one honest price per cm³.</h2>
        <div className="flex gap-1.5">
          {PROCESSES.map((p) => (
            <button key={p} onClick={() => setFilter(p)} className={`mono text-[0.72rem] rounded-full border px-3 py-1.5 transition-colors ${filter === p ? "border-signal text-signal" : "border-hairline text-ink-dim hover:text-ink"}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <div key={m.id} className="group flex flex-col rounded-[6px] border border-hairline bg-bg-elev p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-28 w-28 items-center justify-center rounded-[5px] bg-bg blueprint-dots">
                <span className="transition-transform duration-700 group-hover:rotate-[14deg]">
                  <MaterialSphere color={m.swatch} surface={m.surface} size={80} />
                </span>
              </div>
              <Anno>{m.process}</Anno>
            </div>
            <h3 className="mt-4 text-ink">{m.name}</h3>
            <p className="mt-1 text-sm text-ink-dim">{m.note}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 hairline-t pt-4">
              <MonoStat label="density" value={m.density} unit="g/cm³" />
              <MonoStat label="rate" value={`${CURRENCY}${m.rate}`} unit="/cm³" />
              <MonoStat label="min wall" value={m.minWall} unit="mm" />
              <MonoStat label="lead time" value={m.leadDays} unit="days" />
            </div>

            <div className="mt-4">
              <Anno>colours</Anno>
              <div className="mt-1.5 flex gap-1.5">
                {m.colors.map((c) => <span key={c} className="h-5 w-5 rounded-full border border-hairline" style={{ background: c }} title={c} />)}
              </div>
            </div>
            <div className="mt-3">
              <Anno>finishes</Anno>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {m.finishes.map((f) => <span key={f} className="mono text-[0.68rem] rounded-full border border-hairline px-2 py-0.5 text-ink-dim">{f}</span>)}
              </div>
            </div>

            <Link to="/configure" className="mt-5"><Button variant="outline" className="w-full gap-2">Configure in {m.name} <ArrowRight size={14} /></Button></Link>
          </div>
        ))}
      </div>
    </div>
  );
}
