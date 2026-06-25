export type Process = "FDM" | "SLA" | "SLS" | "MJF";

export interface Material {
  id: string;
  name: string;
  process: Process;
  density: number; // g/cm³
  rate: number; // ৳ per cm³ of material
  machineRate: number; // ৳ per minute
  minWall: number; // mm
  maxBbox: number; // mm (largest dimension)
  leadDays: number;
  surface: "matte" | "satin" | "glossy" | "metallic";
  swatch: string; // base colour for the PBR chip
  colors: string[];
  finishes: string[];
  note: string;
}

export let MATERIALS: Material[] = [];

export function setMaterials(mats: any[]) {
  // Merge the backend's authoritative numbers over the richer static record so we
  // keep curated presentation fields (surface, lead time, copy) the API doesn't carry.
  MATERIALS = mats.map((m) => {
    const base = FALLBACK_MATERIALS.find((f) => f.id === m.id);
    const colors: string[] = m.colors_json ?? base?.colors ?? ["#cccccc"];
    const finishes: string[] = m.finishes_json ?? base?.finishes ?? ["As printed"];
    return {
      id: m.id,
      name: m.name ?? base?.name ?? m.id,
      process: (m.process as Process) ?? base?.process ?? "FDM",
      density: m.density_g_cm3 ?? base?.density ?? 1.24,
      rate: m.rate_per_cm3 ?? base?.rate ?? 3.4,
      machineRate: m.machine_rate_per_min ?? base?.machineRate ?? 1.1,
      minWall: m.min_wall_mm ?? base?.minWall ?? 1.0,
      maxBbox: m.max_bbox_mm ?? base?.maxBbox ?? 250,
      leadDays: base?.leadDays ?? 2,
      surface: base?.surface ?? (finishes[0]?.toLowerCase().includes("smooth") ? "glossy" : "matte"),
      swatch: base?.swatch ?? colors[0] ?? "#cccccc",
      colors,
      finishes,
      note: base?.note ?? "",
    };
  });
}

const FALLBACK_MATERIALS: Material[] = [
  {
    id: "pla", name: "Matte PLA", process: "FDM", density: 1.24, rate: 3.4, machineRate: 1.1,
    minWall: 1.0, maxBbox: 250, leadDays: 1, surface: "matte", swatch: "#cfd6df",
    colors: ["#cfd6df", "#1c1f26", "#d6294c", "#1f9d57", "#2d5bd8"],
    finishes: ["As printed", "Light sand"], note: "Stiff, fast, low cost. Great for prototypes & desk parts.",
  },
  {
    id: "petg", name: "PETG", process: "FDM", density: 1.27, rate: 4.1, machineRate: 1.2,
    minWall: 1.2, maxBbox: 250, leadDays: 1, surface: "satin", swatch: "#8fb9c9",
    colors: ["#8fb9c9", "#101820", "#e2e9f6"],
    finishes: ["As printed", "Light sand"], note: "Tougher & more chemical-resistant than PLA.",
  },
  {
    id: "abs", name: "ABS", process: "FDM", density: 1.04, rate: 3.9, machineRate: 1.3,
    minWall: 1.2, maxBbox: 230, leadDays: 2, surface: "matte", swatch: "#2b2f36",
    colors: ["#2b2f36", "#cfd6df", "#d6294c"],
    finishes: ["As printed", "Vapour smooth"], note: "Heat resistant, vapour-smoothable.",
  },
  {
    id: "resin", name: "Standard Resin", process: "SLA", density: 1.18, rate: 9.2, machineRate: 2.4,
    minWall: 0.6, maxBbox: 145, leadDays: 2, surface: "glossy", swatch: "#d8dde6",
    colors: ["#d8dde6", "#2b2f36", "#e9e3ff"],
    finishes: ["Cured", "Primed", "Painted"], note: "Crisp detail & smooth surface for fine features.",
  },
  {
    id: "nylon", name: "Sintered Nylon", process: "SLS", density: 1.01, rate: 11.8, machineRate: 2.0,
    minWall: 0.8, maxBbox: 300, leadDays: 3, surface: "satin", swatch: "#e7e3da",
    colors: ["#e7e3da", "#1c1f26"],
    finishes: ["Raw", "Dyed black", "Polished"], note: "Strong functional parts, no supports needed.",
  },
  {
    id: "mjf", name: "MJF Nylon", process: "MJF", density: 1.01, rate: 12.6, machineRate: 1.9,
    minWall: 0.8, maxBbox: 360, leadDays: 3, surface: "satin", swatch: "#3a3f47",
    colors: ["#3a3f47", "#e7e3da"],
    finishes: ["Raw grey", "Dyed black"], note: "Production-grade isotropic strength.",
  },
  {
    id: "metal", name: "Metallic PLA", process: "FDM", density: 2.2, rate: 6.4, machineRate: 1.2,
    minWall: 1.4, maxBbox: 230, leadDays: 2, surface: "metallic", swatch: "#9aa3ad",
    colors: ["#9aa3ad", "#b08d57", "#6e7a86"],
    finishes: ["As printed", "Burnished"], note: "Metal-filled filament, polishable sheen.",
  },
];

// Initialize MATERIALS with fallback so static imports don't crash before AppDataProvider mounts
MATERIALS = [...FALLBACK_MATERIALS];

export const materialById = (id: string) => MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];
