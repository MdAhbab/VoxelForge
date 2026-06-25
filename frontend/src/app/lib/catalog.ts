import type { Mesh, Prim } from "./geometry";

export interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  def: number;
}

export interface Preset {
  label: string;
  values: Record<string, number>;
}

export interface CatalogPart {
  id: string;
  name: string;
  category: string;
  blurb: string;
  params: ParamDef[];
  presets: Preset[];
  build: (p: Record<string, number>) => Mesh;
}

const vals = (defs: ParamDef[], p: Record<string, number>) => {
  const o: Record<string, number> = {};
  for (const d of defs) o[d.key] = p[d.key] ?? d.def;
  return o;
};

/* ---------------- Phone stand ---------------- */
const phoneStandParams: ParamDef[] = [
  { key: "deviceW", label: "Device width", min: 60, max: 100, step: 1, unit: "mm", def: 78 },
  { key: "angle", label: "Viewing angle", min: 35, max: 75, step: 1, unit: "°", def: 60 },
  { key: "height", label: "Back height", min: 70, max: 140, step: 1, unit: "mm", def: 110 },
  { key: "slot", label: "Cable slot", min: 0, max: 22, step: 1, unit: "mm", def: 12 },
  { key: "wall", label: "Wall thickness", min: 1.2, max: 6, step: 0.2, unit: "mm", def: 3 },
];

function buildPhoneStand(raw: Record<string, number>): Mesh {
  const p = vals(phoneStandParams, raw);
  const w = p.deviceW + 14;
  const baseDepth = 70;
  const t = p.wall * 2.2;
  const prims: Prim[] = [];
  // base plate
  prims.push({ kind: "box", center: [0, 0, 0], size: [w, t, baseDepth], tag: "base" });
  // angled back — approximate angle by tilting via stacked steps
  const back = p.height;
  const rad = (p.angle * Math.PI) / 180;
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    const y = t / 2 + (i + 0.5) * (back / steps) * Math.sin(rad);
    const z = -(i + 0.5) * (back / steps) * Math.cos(rad);
    prims.push({
      kind: "box",
      center: [0, y, z],
      size: [w, (back / steps) * 1.25, p.wall * 2.4],
      tag: "wall",
    });
  }
  // front lip
  prims.push({ kind: "box", center: [0, t / 2 + 9, baseDepth / 2 - 6], size: [w, 18, p.wall * 2.4], tag: "wall" });
  // cable slot is a visual subtraction we fake by a gap marker (skip geometry)
  return { prims, bbox: [w, back * Math.sin(rad) + 20, baseDepth] };
}

/* ---------------- Parametric knob ---------------- */
const knobParams: ParamDef[] = [
  { key: "dia", label: "Diameter", min: 18, max: 60, step: 1, unit: "mm", def: 36 },
  { key: "height", label: "Height", min: 10, max: 40, step: 1, unit: "mm", def: 22 },
  { key: "shaft", label: "Shaft bore", min: 4, max: 14, step: 0.5, unit: "mm", def: 6 },
  { key: "wall", label: "Wall thickness", min: 1.2, max: 6, step: 0.2, unit: "mm", def: 2.4 },
];
function buildKnob(raw: Record<string, number>): Mesh {
  const p = vals(knobParams, raw);
  const prims: Prim[] = [
    { kind: "cyl", center: [0, 0, 0], size: [p.dia / 2, p.height, p.dia / 2], tag: "body" },
    { kind: "cyl", center: [0, p.height / 2 - 1, 0], size: [p.dia / 2.8, 4, p.dia / 2.8], tag: "wall" },
  ];
  return { prims, bbox: [p.dia, p.height, p.dia] };
}

/* ---------------- Drawer organiser ---------------- */
const trayParams: ParamDef[] = [
  { key: "width", label: "Width", min: 60, max: 220, step: 2, unit: "mm", def: 140 },
  { key: "depth", label: "Depth", min: 60, max: 180, step: 2, unit: "mm", def: 100 },
  { key: "height", label: "Height", min: 18, max: 70, step: 1, unit: "mm", def: 36 },
  { key: "div", label: "Dividers", min: 0, max: 4, step: 1, unit: "×", def: 2 },
  { key: "wall", label: "Wall thickness", min: 1.2, max: 5, step: 0.2, unit: "mm", def: 2 },
];
function buildTray(raw: Record<string, number>): Mesh {
  const p = vals(trayParams, raw);
  const w = p.width, d = p.depth, h = p.height, t = p.wall * 1.8;
  const prims: Prim[] = [];
  prims.push({ kind: "box", center: [0, -h / 2 + t / 2, 0], size: [w, t, d], tag: "base" });
  prims.push({ kind: "box", center: [0, 0, -d / 2 + t / 2], size: [w, h, t], tag: "wall" });
  prims.push({ kind: "box", center: [0, 0, d / 2 - t / 2], size: [w, h, t], tag: "wall" });
  prims.push({ kind: "box", center: [-w / 2 + t / 2, 0, 0], size: [t, h, d], tag: "wall" });
  prims.push({ kind: "box", center: [w / 2 - t / 2, 0, 0], size: [t, h, d], tag: "wall" });
  for (let i = 1; i <= p.div; i++) {
    const x = -w / 2 + (w * i) / (p.div + 1);
    prims.push({ kind: "box", center: [x, 0, 0], size: [t, h, d], tag: "wall" });
  }
  return { prims, bbox: [w, h, d] };
}

/* ---------------- Wall bracket (L) ---------------- */
const bracketParams: ParamDef[] = [
  { key: "legA", label: "Leg A", min: 30, max: 120, step: 2, unit: "mm", def: 70 },
  { key: "legB", label: "Leg B", min: 30, max: 120, step: 2, unit: "mm", def: 70 },
  { key: "width", label: "Width", min: 16, max: 60, step: 1, unit: "mm", def: 28 },
  { key: "thick", label: "Thickness", min: 2, max: 10, step: 0.5, unit: "mm", def: 5 },
];
function buildBracket(raw: Record<string, number>): Mesh {
  const p = vals(bracketParams, raw);
  const prims: Prim[] = [
    { kind: "box", center: [0, -p.legB / 2 + p.thick / 2, 0], size: [p.width, p.thick, p.legA], tag: "base" },
    { kind: "box", center: [0, 0, -p.legA / 2 + p.thick / 2], size: [p.width, p.legB, p.thick], tag: "wall" },
    // gusset rib
    { kind: "box", center: [0, -p.legB / 5, -p.legA / 5], size: [p.width / 3, p.legB / 2, p.legA / 2], tag: "body" },
  ];
  return { prims, bbox: [p.width, p.legB, p.legA] };
}

/* ---------------- Planter / vase ---------------- */
const planterParams: ParamDef[] = [
  { key: "dia", label: "Diameter", min: 50, max: 160, step: 2, unit: "mm", def: 96 },
  { key: "height", label: "Height", min: 50, max: 200, step: 2, unit: "mm", def: 120 },
  { key: "taper", label: "Taper", min: 0, max: 40, step: 1, unit: "mm", def: 18 },
  { key: "wall", label: "Wall thickness", min: 1.6, max: 6, step: 0.2, unit: "mm", def: 2.8 },
];
function buildPlanter(raw: Record<string, number>): Mesh {
  const p = vals(planterParams, raw);
  const prims: Prim[] = [];
  const segs = 6;
  for (let i = 0; i < segs; i++) {
    const f = i / (segs - 1);
    const r = (p.dia / 2) - p.taper * (1 - f);
    prims.push({
      kind: "cyl",
      center: [0, -p.height / 2 + (i + 0.5) * (p.height / segs), 0],
      size: [r, p.height / segs + 0.5, r],
      tag: i === 0 ? "base" : "wall",
    });
  }
  return { prims, bbox: [p.dia, p.height, p.dia] };
}

export let CATALOG: CatalogPart[] = [];

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function setCatalog(parts: any[]) {
  // Each mesh builder reads a specific set of param keys, so a backend part is only
  // renderable if it maps to a known builder. We pair it with that builder AND its
  // matching params/presets (the builder can't read an arbitrary schema), while
  // letting the backend override display metadata. Unmappable parts are skipped
  // rather than rendered as the wrong shape with dead sliders.
  const mapped = parts
    .map((p) => {
      const fallback =
        FALLBACK_CATALOG.find((f) => f.id === p.id) ??
        FALLBACK_CATALOG.find((f) => normalize(f.name) === normalize(p.name ?? ""));
      if (!fallback) return null;
      return {
        id: p.id || fallback.id,
        name: p.name || fallback.name,
        category: p.category || fallback.category,
        blurb: p.blurb || fallback.blurb,
        params: fallback.params,
        presets: Array.isArray(p.presets_json) && p.presets_json.length ? p.presets_json : fallback.presets,
        build: fallback.build,
      } as CatalogPart;
    })
    .filter((p): p is CatalogPart => p !== null);

  // Never degrade below the built-in catalogue if nothing maps cleanly.
  if (mapped.length) CATALOG = mapped;
}

const FALLBACK_CATALOG: CatalogPart[] = [
  {
    id: "phone-stand", name: "Adjustable Phone Stand", category: "Desk", blurb: "Angled cradle with a cable pass-through.",
    params: phoneStandParams, build: buildPhoneStand,
    presets: [
      { label: "iPhone 15 Pro Max", values: { deviceW: 77, angle: 62, height: 116 } },
      { label: "Compact 60°", values: { deviceW: 70, angle: 60, height: 88 } },
      { label: "Tablet lean", values: { deviceW: 96, angle: 55, height: 130 } },
    ],
  },
  {
    id: "knob", name: "Replacement Knob", category: "Hardware", blurb: "Press-fit knob for drawers & appliances.",
    params: knobParams, build: buildKnob,
    presets: [
      { label: "Fits 6 mm dowel", values: { shaft: 6, dia: 34 } },
      { label: "Fits 18 mm dowel", values: { shaft: 14, dia: 52, height: 30 } },
    ],
  },
  {
    id: "tray", name: "Drawer Organiser", category: "Storage", blurb: "Divided tray, sized to your drawer.",
    params: trayParams, build: buildTray,
    presets: [
      { label: "Cutlery 3-bay", values: { width: 200, depth: 120, div: 3 } },
      { label: "Desk tidy", values: { width: 120, depth: 90, div: 2, height: 28 } },
    ],
  },
  {
    id: "bracket", name: "Wall Bracket", category: "Hardware", blurb: "Load-bearing L bracket with gusset.",
    params: bracketParams, build: buildBracket,
    presets: [
      { label: "Shelf 70×70", values: { legA: 70, legB: 70 } },
      { label: "Heavy 120×80", values: { legA: 120, legB: 80, thick: 8, width: 40 } },
    ],
  },
  {
    id: "planter", name: "Tapered Planter", category: "Home", blurb: "Self-watering tapered pot.",
    params: planterParams, build: buildPlanter,
    presets: [
      { label: "Succulent", values: { dia: 70, height: 64 } },
      { label: "Herb pot", values: { dia: 120, height: 140 } },
    ],
  },
];

CATALOG = [...FALLBACK_CATALOG];

export const partById = (id: string) => CATALOG.find((p) => p.id === id) ?? CATALOG[0];
