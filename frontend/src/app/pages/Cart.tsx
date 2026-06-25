import { useNavigate } from "react-router";
import { Trash2, Plus, Minus, ArrowRight, Boxes, Package } from "lucide-react";
import { useCart } from "../lib/store";
import { materialById } from "../lib/materials";
import { fmt, CURRENCY } from "../lib/pricing";
import { MaterialSphere } from "../components/forge/MaterialChip";
import { Anno, SectionTag, MonoStat } from "../components/forge/primitives";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const BED = 220; // mm square build plate

export function Cart() {
  const nav = useNavigate();
  const { items, remove, setQty, subtotal, count } = useCart();

  // naive shelf nesting of part footprints onto the bed
  const placed: { x: number; y: number; w: number; h: number; label: string }[] = [];
  let cx = 0, cy = 0, rowH = 0;
  for (const it of items) {
    for (let n = 0; n < it.qty; n++) {
      const w = it.bbox[0] + 6, h = it.bbox[2] + 6;
      if (cx + w > BED) { cx = 0; cy += rowH; rowH = 0; }
      if (cy + h > BED) break;
      placed.push({ x: cx, y: cy, w, h, label: it.partName });
      cx += w; rowH = Math.max(rowH, h);
    }
  }
  const usedArea = placed.reduce((a, p) => a + p.w * p.h, 0);
  const fill = Math.min(100, Math.round((usedArea / (BED * BED)) * 100));
  const batches = Math.max(1, Math.ceil(usedArea / (BED * BED * 0.8)));
  const leadDays = Math.max(...items.map((i) => materialById(i.materialId).leadDays), 1) + (batches - 1);
  const shipping = subtotal > 2500 ? 0 : 120;

  if (count === 0) return <EmptyCart onBrowse={() => nav("/configure")} />;

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <SectionTag index="06" label="Cart & build nesting" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* line items */}
        <div className="space-y-3">
          {items.map((it) => {
            const m = materialById(it.materialId);
            return (
              <div key={it.id} className="flex gap-4 rounded-[6px] border border-hairline bg-bg-elev p-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[4px] bg-bg blueprint-dots">
                  <MaterialSphere color={m.swatch} surface={m.surface} size={48} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-ink">{it.partName}</h4>
                      <Anno>{it.materialName} · {it.finish}</Anno>
                    </div>
                    <button onClick={() => remove(it.id)} className="text-ink-dim hover:text-danger"><Trash2 size={15} /></button>
                  </div>
                  <div className="mono mt-1 text-[0.72rem] text-ink-dim">
                    {it.bbox.map((d) => d.toFixed(0)).join("×")} mm · {it.infill}% infill · {it.layerHeight}mm
                    <span className={`ml-2 ${it.preflightScore > 85 ? "text-ok" : "text-warn"}`}>pre-flight {it.preflightScore}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(it.id, it.qty - 1)}><Minus size={13} /></Button>
                      <span className="mono w-8 text-center text-ink">{it.qty}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(it.id, it.qty + 1)}><Plus size={13} /></Button>
                    </div>
                    <span className="mono text-ink">{fmt(it.unitPrice * it.qty)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <Button variant="outline" className="w-full" onClick={() => nav("/configure")}>+ Add another part</Button>
        </div>

        {/* nesting + summary */}
        <div className="space-y-5">
          <div className="rounded-[6px] border border-hairline bg-bg-elev p-4">
            <div className="flex items-center gap-1.5"><Boxes size={14} className="text-signal" /><Anno>build-volume nesting · {BED}×{BED} mm</Anno></div>
            <div className="relative mx-auto mt-3 aspect-square w-full max-w-[260px] rounded-[4px] border border-hairline bg-bg blueprint-grid">
              {placed.map((p, i) => (
                <div key={i} className="absolute rounded-[2px] border border-signal/60 bg-signal/15" title={p.label}
                  style={{ left: `${(p.x / BED) * 100}%`, top: `${(p.y / BED) * 100}%`, width: `${(p.w / BED) * 100}%`, height: `${(p.h / BED) * 100}%` }} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MonoStat label="bed fill" value={fill} unit="%" />
              <MonoStat label="batches" value={batches} />
              <MonoStat label="lead" value={leadDays} unit="days" />
            </div>
          </div>

          <div className="rounded-[6px] border border-hairline bg-panel p-5">
            <Row label="Subtotal" value={fmt(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? "Free" : fmt(shipping)} />
            <Row label="Est. tax" value={fmt(subtotal * 0.05)} />
            <div className="my-3 h-px bg-hairline" />
            <div className="flex items-end justify-between">
              <Anno>total</Anno>
              <span className="font-display text-ink" style={{ fontSize: "1.8rem", fontWeight: 600 }}>{fmt(subtotal + shipping + subtotal * 0.05)}</span>
            </div>
            <Button className="mt-4 w-full bg-signal text-bg hover:bg-signal/90 gap-2" onClick={() => nav("/checkout")}>
              <Package size={16} /> Checkout <ArrowRight size={15} />
            </Button>
            {shipping > 0 && <p className="mt-2 text-center text-xs text-ink-dim">Free shipping over {fmt(2500)}.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between py-1"><span className="text-sm text-ink-dim">{label}</span><span className="mono text-sm text-ink">{value}</span></div>;
}

function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="mx-auto grid max-w-md place-items-center px-6 py-24 text-center">
      <div className="grid h-24 w-24 place-items-center rounded-[8px] border border-dashed border-hairline blueprint-grid"><Boxes size={32} className="text-ink-dim" /></div>
      <h3 className="mt-5 text-ink">An empty build plate</h3>
      <p className="mt-1 text-sm text-ink-dim">Configure a part or upload a model to start a build.</p>
      <Button className="mt-5 bg-signal text-bg hover:bg-signal/90" onClick={onBrowse}>Open the configurator</Button>
    </div>
  );
}
