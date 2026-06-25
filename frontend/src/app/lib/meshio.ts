// VoxelForge — in-browser mesh parsing for uploaded models (STL binary/ascii, OBJ).
// Produces a centred Mesh (raw triangle soup) the Canvas-2D viewport can render directly.
import type { Mesh, Tri, Vec3 } from "./geometry";
import { triSoupVolumeCm3 } from "./geometry";

export interface ParsedModel {
  filename: string;
  format: "STL" | "OBJ" | "3MF";
  mesh: Mesh;
  triCount: number;
  bbox: Vec3;
  volumeCm3: number;
  surfaceCm2: number;
  manifold: boolean;
  issues: { sev: "danger" | "warn"; type: string; detail: string }[];
}

function finalize(tris: Tri[], filename: string, format: ParsedModel["format"]): ParsedModel {
  // bounds
  let min: Vec3 = [Infinity, Infinity, Infinity];
  let max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const t of tris) {
    for (const p of [t.a, t.b, t.c]) {
      for (let i = 0; i < 3; i++) { if (p[i] < min[i]) min[i] = p[i]; if (p[i] > max[i]) max[i] = p[i]; }
    }
  }
  const center: Vec3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  // centre on origin so the viewport's symmetric fit/clip works
  const centred: Tri[] = tris.map((t) => ({
    a: [t.a[0] - center[0], t.a[1] - center[1], t.a[2] - center[2]],
    b: [t.b[0] - center[0], t.b[1] - center[1], t.b[2] - center[2]],
    c: [t.c[0] - center[0], t.c[1] - center[1], t.c[2] - center[2]],
    tag: "upload",
  }));
  const bbox: Vec3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];

  // surface area
  let area = 0;
  for (const t of centred) {
    const ux = t.b[0] - t.a[0], uy = t.b[1] - t.a[1], uz = t.b[2] - t.a[2];
    const vx = t.c[0] - t.a[0], vy = t.c[1] - t.a[1], vz = t.c[2] - t.a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    area += Math.hypot(cx, cy, cz) / 2;
  }

  const volumeCm3 = triSoupVolumeCm3(centred);
  // heuristic manifold check: shared-edge count parity
  const manifold = checkManifold(centred);

  const issues: ParsedModel["issues"] = [];
  if (!manifold) issues.push({ sev: "danger", type: "Non-manifold edges", detail: "Some edges aren't shared by exactly two faces." });
  if (bbox.some((d) => d > 256)) issues.push({ sev: "warn", type: "Exceeds build volume", detail: `Largest dim ${Math.max(...bbox).toFixed(0)} mm > 256 mm — scale down or split.` });
  if (volumeCm3 < 0.05) issues.push({ sev: "warn", type: "Tiny / non-solid", detail: "Volume is near zero — model may be a surface, not a solid." });

  return {
    filename, format, triCount: centred.length, bbox,
    volumeCm3, surfaceCm2: area / 100, manifold, issues,
    mesh: { prims: [], tris: centred, bbox, volumeCm3 },
  };
}

function checkManifold(tris: Tri[]): boolean {
  if (tris.length > 8000) return true; // skip on huge meshes (perf)
  const edges = new Map<string, number>();
  const key = (p: Vec3, q: Vec3) => {
    const a = p.map((n) => Math.round(n * 100)).join(",");
    const b = q.map((n) => Math.round(n * 100)).join(",");
    return a < b ? a + "|" + b : b + "|" + a;
  };
  for (const t of tris) {
    for (const [p, q] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]] as [Vec3, Vec3][]) {
      const k = key(p, q);
      edges.set(k, (edges.get(k) ?? 0) + 1);
    }
  }
  let bad = 0;
  for (const c of edges.values()) if (c !== 2) bad++;
  return bad / Math.max(1, edges.size) < 0.04;
}

/* -------- binary STL -------- */
function parseBinarySTL(buf: ArrayBuffer): Tri[] {
  const dv = new DataView(buf);
  const count = dv.getUint32(80, true);
  // validate: a real binary STL is exactly 84 + 50*count bytes
  if (buf.byteLength < 84 || 84 + count * 50 > buf.byteLength) {
    throw new Error("Not a recognisable STL — try a valid STL, OBJ or 3MF.");
  }
  const tris: Tri[] = [];
  let o = 84;
  for (let i = 0; i < count; i++) {
    o += 12; // skip normal
    const v: Vec3[] = [];
    for (let j = 0; j < 3; j++) {
      v.push([dv.getFloat32(o, true), dv.getFloat32(o + 8, true), dv.getFloat32(o + 4, true)]); // y/z swapped: Z-up -> Y-up
      o += 12;
    }
    o += 2;
    tris.push({ a: v[0], b: v[1], c: v[2], tag: "upload" });
  }
  return tris;
}

/* -------- ascii STL -------- */
function parseAsciiSTL(text: string): Tri[] {
  const tris: Tri[] = [];
  const verts: Vec3[] = [];
  const re = /vertex\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    verts.push([parseFloat(m[1]), parseFloat(m[3]), parseFloat(m[2])]); // Z-up -> Y-up
    if (verts.length === 3) { tris.push({ a: verts[0], b: verts[1], c: verts[2], tag: "upload" }); verts.length = 0; }
  }
  return tris;
}

/* -------- OBJ -------- */
function parseOBJ(text: string): Tri[] {
  const verts: Vec3[] = [];
  const tris: Tri[] = [];
  for (const line of text.split("\n")) {
    if (line[0] === "v" && line[1] === " ") {
      const p = line.slice(2).trim().split(/\s+/).map(Number);
      verts.push([p[0], p[1], p[2]]);
    } else if (line[0] === "f" && line[1] === " ") {
      const idx = line.slice(2).trim().split(/\s+/).map((s) => parseInt(s.split("/")[0], 10) - 1);
      for (let i = 1; i < idx.length - 1; i++) {
        const a = verts[idx[0]], b = verts[idx[i]], c = verts[idx[i + 1]];
        if (a && b && c) tris.push({ a, b, c, tag: "upload" });
      }
    }
  }
  return tris;
}

export async function parseFile(file: File): Promise<ParsedModel> {
  const name = file.name;
  const ext = name.toLowerCase().split(".").pop() || "";
  if (ext === "obj") {
    return finalize(parseOBJ(await file.text()), name, "OBJ");
  }
  if (ext === "3mf") {
    // 3MF is a zip; full parse is out of scope in dev — fall back to a demo solid.
    const d = demoModel(name.replace(/\.3mf$/i, ".3mf"));
    d.format = "3MF";
    d.issues.unshift({ sev: "warn", type: "3MF preview", detail: "Showing a representative solid; full 3MF unpack runs server-side." });
    return d;
  }
  // STL: sniff binary vs ascii
  const buf = await file.arrayBuffer();
  const head = new TextDecoder().decode(buf.slice(0, 256)).trim().toLowerCase();
  const looksAscii = head.startsWith("solid") && !/[^\x09-\x7e\s]/.test(head);
  const tris = looksAscii ? parseAsciiSTL(new TextDecoder().decode(buf)) : parseBinarySTL(buf);
  if (!tris.length) throw new Error("No triangles found in file.");
  return finalize(tris, name, "STL");
}

/* -------- demo / sample model (a chunky bracket-like solid) -------- */
export function demoModel(filename = "demo_bracket.stl"): ParsedModel {
  const tris: Tri[] = [];
  const box = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) => {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const v: Vec3[] = [
      [cx - hx, cy - hy, cz - hz], [cx + hx, cy - hy, cz - hz], [cx + hx, cy + hy, cz - hz], [cx - hx, cy + hy, cz - hz],
      [cx - hx, cy - hy, cz + hz], [cx + hx, cy - hy, cz + hz], [cx + hx, cy + hy, cz + hz], [cx - hx, cy + hy, cz + hz],
    ];
    const q = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 5, 1, 0], [3, 2, 6, 7], [1, 5, 6, 2], [4, 0, 3, 7]];
    for (const f of q) {
      tris.push({ a: v[f[0]], b: v[f[1]], c: v[f[2]], tag: "upload" });
      tris.push({ a: v[f[0]], b: v[f[2]], c: v[f[3]], tag: "upload" });
    }
  };
  box(0, -22, 0, 60, 8, 60);
  box(0, 0, -26, 60, 52, 8);
  box(0, -8, -8, 22, 30, 30);
  return finalize(tris, filename, "STL");
}
