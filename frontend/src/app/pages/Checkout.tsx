import { useState } from "react";
import { useNavigate } from "react-router";
import confetti from "canvas-confetti";
import { CreditCard, Lock, ArrowRight, Truck } from "lucide-react";
import { useCart } from "../lib/store";
import { fmt } from "../lib/pricing";
import { Anno, SectionTag } from "../components/forge/primitives";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function Checkout() {
  const nav = useNavigate();
  const { items, subtotal, clear } = useCart();
  const [placing, setPlacing] = useState(false);
  const shipping = subtotal > 2500 ? 0 : 120;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  function place(e: React.FormEvent) {
    e.preventDefault();
    setPlacing(true);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ["#2be0c8", "#5b8cff", "#e8ecf2"] });
    setTimeout(() => { clear(); nav("/track"); }, 900);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-8">
      <SectionTag index="07" label="Checkout · mock payment (dev)" />
      <form onSubmit={place} className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Section title="Contact">
            <Field label="Email"><Input required type="email" placeholder="you@studio.com" /></Field>
            <Field label="Phone"><Input required placeholder="+880 ..." /></Field>
          </Section>
          <Section title="Shipping address">
            <Field label="Full name"><Input required placeholder="Ada Lovelace" /></Field>
            <Field label="Address"><Input required placeholder="House 12, Road 3, Dhanmondi" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City"><Input required placeholder="Dhaka" /></Field>
              <Field label="Postcode"><Input required placeholder="1209" /></Field>
            </div>
            <div className="flex items-center gap-2 rounded-[4px] border border-hairline bg-bg-elev p-3">
              <Truck size={15} className="text-signal" />
              <span className="text-sm text-ink-dim">Standard courier · {shipping === 0 ? "free" : fmt(shipping)} · arrives in 2–4 days after print.</span>
            </div>
          </Section>
          <Section title="Payment">
            <div className="rounded-[4px] border border-blueprint/30 bg-blueprint/5 p-2.5">
              <Anno className="text-blueprint">dev mode · no real charge</Anno>
            </div>
            <Field label="Card number"><Input required placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry"><Input required placeholder="12 / 28" defaultValue="12 / 28" /></Field>
              <Field label="CVC"><Input required placeholder="123" defaultValue="123" /></Field>
            </div>
          </Section>
        </div>

        {/* summary */}
        <div className="space-y-4">
          <div className="rounded-[6px] border border-hairline bg-panel p-5">
            <Anno>order summary</Anno>
            <ul className="mt-3 space-y-2">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-2 text-sm">
                  <span className="text-ink-dim">{it.qty}× {it.partName} <span className="text-ink-dim/70">· {it.materialName}</span></span>
                  <span className="mono text-ink">{fmt(it.unitPrice * it.qty)}</span>
                </li>
              ))}
              {items.length === 0 && <li className="text-sm text-ink-dim">No items — add parts from the configurator.</li>}
            </ul>
            <div className="my-3 h-px bg-hairline" />
            <Row label="Subtotal" value={fmt(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? "Free" : fmt(shipping)} />
            <Row label="Tax" value={fmt(tax)} />
            <div className="mt-3 flex items-end justify-between hairline-t pt-3">
              <Anno>total</Anno>
              <span className="font-display text-ink" style={{ fontSize: "1.6rem", fontWeight: 600 }}>{fmt(total)}</span>
            </div>
            <Button type="submit" disabled={placing || items.length === 0} className="mt-4 w-full bg-signal text-bg hover:bg-signal/90 gap-2">
              {placing ? "Placing order…" : <><Lock size={15} /> Place order <ArrowRight size={15} /></>}
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-ink-dim"><CreditCard size={12} /> Encrypted · mock gateway</p>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[6px] border border-hairline bg-bg-elev p-5">
      <h4 className="text-ink">{title}</h4>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between py-0.5"><span className="text-sm text-ink-dim">{label}</span><span className="mono text-sm text-ink">{value}</span></div>;
}
