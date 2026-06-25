import { materialById, type Material } from "./materials";

export interface QuoteInput {
  volumeCm3: number;
  bboxMax: number; // largest dimension mm
  materialId: string;
  infill: number; // 0..100
  layerHeight: number; // mm
  finish: string;
  qty: number;
}

export interface QuoteSegment {
  key: string;
  label: string;
  value: number; // ৳
  color: string;
}

export interface Quote {
  segments: QuoteSegment[];
  total: number; // ৳ per unit
  totalQty: number; // ৳ for full quantity
  estMinutes: number;
  supportCm3: number;
  effectiveVolume: number;
  currency: string;
}

export const CURRENCY = "৳";

// Deterministic, fully itemised — so the Quote-Explainer agent can reason over it.
export function computeQuote(input: QuoteInput): Quote {
  const m = materialById(input.materialId);
  // material that physically ends up in the part: shell + infill fraction of interior
  const shellFrac = 0.32; // approx fraction that's perimeter/solid regardless of infill
  const effFrac = shellFrac + (1 - shellFrac) * (input.infill / 100);
  const effectiveVolume = input.volumeCm3 * effFrac;

  // supports scale with overhang heuristic; SLS/MJF need none
  const needsSupport = m.process === "FDM" || m.process === "SLA";
  const supportCm3 = needsSupport ? input.volumeCm3 * 0.12 : 0;

  // machine time: volume + layer height + infill heuristic (minutes)
  const layerFactor = 0.2 / input.layerHeight; // finer layers => slower
  const estMinutes =
    (input.volumeCm3 * (0.55 + input.infill / 240) * layerFactor) + m.minWall * 2 + 6;

  const materialCost = effectiveVolume * m.rate;
  const machineCost = estMinutes * m.machineRate;
  const supportCost = supportCm3 * m.rate * 0.6;
  const finishCost = finishSurcharge(input.finish, input.volumeCm3);
  const setup = 45;
  const subtotal = materialCost + machineCost + supportCost + finishCost + setup;
  const margin = subtotal * 0.18;

  const segments: QuoteSegment[] = [
    { key: "material", label: "Material", value: materialCost, color: "var(--signal)" },
    { key: "machine", label: "Machine time", value: machineCost, color: "var(--blueprint)" },
    { key: "supports", label: "Supports", value: supportCost, color: "var(--warn)" },
    { key: "finishing", label: "Finishing", value: finishCost, color: "var(--ok)" },
    { key: "setup", label: "Setup", value: setup, color: "var(--ink-dim)" },
    { key: "margin", label: "Margin", value: margin, color: "color-mix(in srgb, var(--ink-dim) 50%, transparent)" },
  ].filter((s) => s.value > 0.01);

  const total = subtotal + margin;
  return {
    segments,
    total: round(total),
    totalQty: round(total * input.qty),
    estMinutes: Math.round(estMinutes),
    supportCm3: round(supportCm3),
    effectiveVolume: round(effectiveVolume),
    currency: CURRENCY,
  };
}

function finishSurcharge(finish: string, vol: number) {
  const f = finish.toLowerCase();
  if (f.includes("smooth") || f.includes("polish") || f.includes("burnish")) return 60 + vol * 0.4;
  if (f.includes("paint") || f.includes("dye") || f.includes("prime")) return 90 + vol * 0.5;
  if (f.includes("sand")) return 25 + vol * 0.2;
  return 0;
}

const round = (n: number) => Math.round(n * 100) / 100;
export const fmt = (n: number) => `${CURRENCY}${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

// Budget solver — enumerate cheaper combos (used by the Quote-Explainer agent surface).
export interface Combo { material: Material; infill: number; layerHeight: number; finish: string; total: number; }
export function searchBudget(base: QuoteInput, target: number, materials: Material[]): Combo[] {
  const out: Combo[] = [];
  for (const m of materials) {
    for (const infill of [10, 15, 20]) {
      for (const lh of [0.28, 0.2]) {
        const q = computeQuote({ ...base, materialId: m.id, infill, layerHeight: lh, finish: m.finishes[0] });
        out.push({ material: m, infill, layerHeight: lh, finish: m.finishes[0], total: q.total });
      }
    }
  }
  return out
    .filter((c) => c.total <= target)
    .sort((a, b) => a.total - b.total)
    .slice(0, 4);
}
