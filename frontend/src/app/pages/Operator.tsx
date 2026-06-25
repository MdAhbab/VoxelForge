import { useState } from "react";
import { Cpu, Box, ListChecks, SlidersHorizontal, Layers3, Activity } from "lucide-react";
import { MATERIALS } from "../lib/materials";
import { CATALOG } from "../lib/catalog";
import { CURRENCY } from "../lib/pricing";
import { Anno, SectionTag, MonoStat } from "../components/forge/primitives";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

const QUEUE = [
  { id: "VF-4821", part: "Phone Stand ×1, Knob ×4", mat: "PLA / ABS", machine: "Prusa MK4 #2", status: "printing", pct: 42 },
  { id: "VF-4820", part: "Drawer Organiser ×2", mat: "PETG", machine: "Bambu X1 #1", status: "queued", pct: 0 },
  { id: "VF-4818", part: "Bracket ×6", mat: "MJF Nylon", machine: "HP MJF #1", status: "post", pct: 88 },
  { id: "VF-4815", part: "Planter ×1", mat: "Resin", machine: "Form 3 #1", status: "done", pct: 100 },
];
const MACHINES = [
  { name: "Prusa MK4 #2", process: "FDM", rate: 1.1, vol: "250³", state: "running" },
  { name: "Bambu X1 #1", process: "FDM", rate: 1.2, vol: "256³", state: "idle" },
  { name: "Form 3 #1", process: "SLA", rate: 2.4, vol: "145³", state: "running" },
  { name: "HP MJF #1", process: "MJF", rate: 1.9, vol: "380³", state: "running" },
];

export function Operator() {
  const [thinWall, setThinWall] = useState(1.0);
  const [overhang, setOverhang] = useState(45);
  const [autoRepair, setAutoRepair] = useState(true);

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <SectionTag index="09" label="Operator console" />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <h2>Shop control</h2>
        <div className="grid grid-cols-3 gap-5">
          <MonoStat label="queue" value={QUEUE.filter((q) => q.status !== "done").length} />
          <MonoStat label="machines up" value={`${MACHINES.filter((m) => m.state === "running").length}/${MACHINES.length}`} />
          <MonoStat label="materials" value={MATERIALS.length} />
        </div>
      </div>

      <Tabs defaultValue="queue" className="mt-6">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="queue" className="mono text-[0.74rem] gap-1.5"><ListChecks size={13} />Job queue</TabsTrigger>
          <TabsTrigger value="materials" className="mono text-[0.74rem] gap-1.5"><Box size={13} />Materials & rates</TabsTrigger>
          <TabsTrigger value="machines" className="mono text-[0.74rem] gap-1.5"><Cpu size={13} />Machines</TabsTrigger>
          <TabsTrigger value="catalog" className="mono text-[0.74rem] gap-1.5"><Layers3 size={13} />Catalog</TabsTrigger>
          <TabsTrigger value="thresholds" className="mono text-[0.74rem] gap-1.5"><SlidersHorizontal size={13} />Pre-flight</TabsTrigger>
        </TabsList>

        {/* JOB QUEUE */}
        <TabsContent value="queue" className="pt-4">
          <Panel>
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow><Th>Order</Th><Th>Parts</Th><Th>Material</Th><Th>Machine</Th><Th>Status</Th><Th>Progress</Th></TableRow>
              </TableHeader>
              <TableBody>
                {QUEUE.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="mono text-signal">{q.id}</TableCell>
                    <TableCell className="text-ink">{q.part}</TableCell>
                    <TableCell className="mono text-ink-dim">{q.mat}</TableCell>
                    <TableCell className="text-ink-dim">{q.machine}</TableCell>
                    <TableCell><StatusBadge s={q.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-bg"><div className="h-full bg-signal" style={{ width: `${q.pct}%` }} /></div>
                        <span className="mono text-[0.72rem] text-ink-dim">{q.pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>

        {/* MATERIALS */}
        <TabsContent value="materials" className="pt-4">
          <Panel>
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow><Th>Material</Th><Th>Process</Th><Th>Density</Th><Th>{CURRENCY}/cm³</Th><Th>Machine {CURRENCY}/min</Th><Th>Min wall</Th><Th>Lead</Th></TableRow>
              </TableHeader>
              <TableBody>
                {MATERIALS.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-ink">{m.name}</TableCell>
                    <TableCell><Badge variant="outline" className="mono border-hairline">{m.process}</Badge></TableCell>
                    <TableCell className="mono text-ink-dim">{m.density}</TableCell>
                    <TableCell><Input defaultValue={m.rate} className="h-8 w-20 mono" /></TableCell>
                    <TableCell><Input defaultValue={m.machineRate} className="h-8 w-20 mono" /></TableCell>
                    <TableCell className="mono text-ink-dim">{m.minWall} mm</TableCell>
                    <TableCell className="mono text-ink-dim">{m.leadDays}d</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-3 flex justify-end"><Button size="sm" className="bg-signal text-bg hover:bg-signal/90">Save rates</Button></div>
          </Panel>
        </TabsContent>

        {/* MACHINES */}
        <TabsContent value="machines" className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MACHINES.map((m) => (
              <Panel key={m.name}>
                <div className="flex items-center justify-between">
                  <Cpu size={18} className="text-ink-dim" />
                  <span className={`flex items-center gap-1.5 mono text-[0.7rem] ${m.state === "running" ? "text-ok" : "text-ink-dim"}`}>
                    <Activity size={12} /> {m.state}
                  </span>
                </div>
                <h4 className="mt-3 text-ink">{m.name}</h4>
                <Anno>{m.process} · {m.vol} mm</Anno>
                <div className="mt-3"><MonoStat label="rate" value={`${CURRENCY}${m.rate}`} unit="/min" /></div>
              </Panel>
            ))}
          </div>
        </TabsContent>

        {/* CATALOG */}
        <TabsContent value="catalog" className="pt-4">
          <Panel>
            <Table className="min-w-[680px]">
              <TableHeader><TableRow><Th>Part</Th><Th>Category</Th><Th>Parameters</Th><Th>Presets</Th><Th /></TableRow></TableHeader>
              <TableBody>
                {CATALOG.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-ink">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="border-hairline">{p.category}</Badge></TableCell>
                    <TableCell className="mono text-ink-dim text-[0.72rem]">{p.params.map((d) => d.key).join(", ")}</TableCell>
                    <TableCell className="mono text-ink-dim">{p.presets.length}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline">Edit schema</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>

        {/* THRESHOLDS */}
        <TabsContent value="thresholds" className="pt-4">
          <Panel>
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between"><label className="text-sm text-ink">Min wall threshold</label><span className="mono text-ink">{thinWall.toFixed(1)} mm</span></div>
                <Slider className="mt-3" min={0.4} max={3} step={0.1} value={[thinWall]} onValueChange={(v) => setThinWall(v[0])} />
                <Anno className="mt-2 block">Walls thinner than this flag red in pre-flight.</Anno>
              </div>
              <div>
                <div className="flex items-baseline justify-between"><label className="text-sm text-ink">Overhang angle</label><span className="mono text-ink">{overhang}°</span></div>
                <Slider className="mt-3" min={30} max={70} step={1} value={[overhang]} onValueChange={(v) => setOverhang(v[0])} />
                <Anno className="mt-2 block">Surfaces steeper than this need supports.</Anno>
              </div>
              <div className="flex items-center justify-between rounded-[4px] border border-hairline bg-bg p-4 sm:col-span-2">
                <div><div className="text-sm text-ink">Auto-run mesh-repair on upload</div><Anno>Repairs a copy; original preserved.</Anno></div>
                <Switch checked={autoRepair} onCheckedChange={setAutoRepair} />
              </div>
            </div>
            <div className="mt-4 flex justify-end"><Button size="sm" className="bg-signal text-bg hover:bg-signal/90">Save thresholds</Button></div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[6px] border border-hairline bg-bg-elev p-4">{children}</div>;
}
function Th({ children }: { children?: React.ReactNode }) {
  return <TableHead className="anno">{children}</TableHead>;
}
function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = { printing: "text-signal border-signal/40", queued: "text-ink-dim border-hairline", post: "text-warn border-warn/40", done: "text-ok border-ok/40" };
  return <Badge variant="outline" className={`mono ${map[s] || ""}`}>{s}</Badge>;
}
