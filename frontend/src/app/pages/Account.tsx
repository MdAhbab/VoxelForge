import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Package2, Bookmark, User2, MapPin, Bell, LogOut, ArrowRight, Trash2, ShieldCheck } from "lucide-react";

import { useAuth, useDesigns } from "../lib/store";
import { materialById } from "../lib/materials";
import { fmt } from "../lib/pricing";
import { MaterialSphere } from "../components/forge/MaterialChip";
import { Anno, SectionTag, MonoStat } from "../components/forge/primitives";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const ORDERS = [
  { id: "VF-4821", date: "2026-06-25", status: "printing", items: "Phone Stand ×1, Knob ×4", total: 904 },
  { id: "VF-4790", date: "2026-06-18", status: "done", items: "Drawer Organiser ×2", total: 612 },
  { id: "VF-4731", date: "2026-06-02", status: "done", items: "Bracket ×6", total: 1184 },
];

export function Account() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { designs, remove } = useDesigns();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <SectionTag index="—" label="Account" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-signal/15 text-signal" style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 600 }}>
            {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <div>
            <h2 className="leading-none">{user.name}</h2>
            <div className="mt-1.5 flex items-center gap-2">
              <Anno>{user.email}</Anno>
              <Badge variant="outline" className="mono gap-1 border-hairline">
                {user.role === "admin" ? <ShieldCheck size={12} /> : <User2 size={12} />}{user.role}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && <Button variant="outline" className="gap-1.5" onClick={() => nav("/operator")}><ShieldCheck size={15} /> Operator console</Button>}
          <Button variant="outline" className="gap-1.5" onClick={() => { logout(); nav("/"); }}><LogOut size={15} /> Sign out</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="orders" value={ORDERS.length} />
        <Stat label="saved designs" value={designs.length} />
        <Stat label="in production" value={ORDERS.filter((o) => o.status !== "done").length} />
        <Stat label="lifetime spend" value={fmt(ORDERS.reduce((a, o) => a + o.total, 0))} />
      </div>

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList>
          <TabsTrigger value="orders" className="mono text-[0.74rem] gap-1.5"><Package2 size={13} />Orders</TabsTrigger>
          <TabsTrigger value="designs" className="mono text-[0.74rem] gap-1.5"><Bookmark size={13} />Saved designs</TabsTrigger>
          <TabsTrigger value="profile" className="mono text-[0.74rem] gap-1.5"><User2 size={13} />Profile</TabsTrigger>
        </TabsList>

        {/* ORDERS */}
        <TabsContent value="orders" className="space-y-3 pt-5">
          {ORDERS.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-hairline bg-bg-elev p-4">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-[5px] bg-bg blueprint-dots text-ink-dim"><Package2 size={18} /></span>
                <div>
                  <div className="flex items-center gap-2"><span className="mono text-signal">{o.id}</span><Badge variant="outline" className={`mono ${o.status === "done" ? "text-ok border-ok/40" : "text-signal border-signal/40"}`}>{o.status}</Badge></div>
                  <div className="text-sm text-ink-dim mt-0.5">{o.items} · {o.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="mono text-ink">{fmt(o.total)}</span>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => nav("/track")}>Track <ArrowRight size={13} /></Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* SAVED DESIGNS */}
        <TabsContent value="designs" className="pt-5">
          {designs.length === 0 ? (
            <div className="grid place-items-center rounded-[6px] border border-dashed border-hairline py-16 text-center">
              <Bookmark size={28} className="text-ink-dim" />
              <h4 className="mt-3 text-ink">No saved designs yet</h4>
              <p className="mt-1 text-sm text-ink-dim">Configure a part and hit “Save design” to keep it here.</p>
              <Button className="mt-4 bg-signal text-bg hover:bg-signal/90" onClick={() => nav("/configure")}>Open configurator</Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {designs.map((d) => {
                const m = materialById(d.materialId);
                return (
                  <motion.div key={d.id} layout className="rounded-[6px] border border-hairline bg-bg-elev p-4">
                    <div className="flex items-start justify-between">
                      <div className="grid h-14 w-14 place-items-center rounded-[5px] bg-bg blueprint-dots"><MaterialSphere color={m.swatch} surface={m.surface} size={36} /></div>
                      <button onClick={() => remove(d.id)} className="text-ink-dim hover:text-danger"><Trash2 size={15} /></button>
                    </div>
                    <h4 className="mt-3 text-ink truncate">{d.name}</h4>
                    <Anno>{d.materialName} · {d.finish}</Anno>
                    <div className="mono mt-1 text-[0.72rem] text-ink-dim">{d.bbox.map((x) => x.toFixed(0)).join("×")} mm · {d.infill}%</div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="mono text-signal">{fmt(d.unitPrice)}</span>
                      <Button size="sm" variant="outline" onClick={() => nav("/configure")}>Open</Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile" className="pt-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card icon={User2} title="Personal details">
              <Field label="Name"><Input defaultValue={user.name} /></Field>
              <Field label="Email"><Input defaultValue={user.email} /></Field>
              <Button size="sm" className="bg-signal text-bg hover:bg-signal/90">Save changes</Button>
            </Card>
            <Card icon={MapPin} title="Default shipping">
              <Field label="Address"><Input defaultValue="House 12, Road 3, Dhanmondi" /></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="City"><Input defaultValue="Dhaka" /></Field><Field label="Postcode"><Input defaultValue="1209" /></Field></div>
              <Button size="sm" variant="outline">Update address</Button>
            </Card>
            <Card icon={Bell} title="Notifications">
              <Toggle label="Order status updates" on /><Toggle label="Price-drop on saved designs" on /><Toggle label="New materials & finishes" />
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-[6px] border border-hairline bg-bg-elev p-4"><MonoStat label={label} value={value} /></div>;
}
function Card({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[6px] border border-hairline bg-bg-elev p-5">
      <div className="flex items-center gap-2"><Icon size={16} className="text-signal" /><h4 className="text-ink">{title}</h4></div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Toggle({ label, on }: { label: string; on?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[4px] border border-hairline bg-bg p-3">
      <span className="text-sm text-ink">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-signal" : "bg-switch-background"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </label>
  );
}
