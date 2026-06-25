// VoxelForge — lightweight parametric geometry + 3D math for the Canvas-2D viewport.
// Parts are composed from primitives (boxes & cylinders). Each primitive carries a
// `tag` so the renderer/pre-flight can colour-code thin walls, overhangs, etc.

export type Vec3 = [number, number, number];

export interface Tri {
  a: Vec3;
  b: Vec3;
  c: Vec3;
  tag: string; // primitive tag for heatmap grouping
}

export interface Prim {
  kind: "box" | "cyl";
  // box: center + size ; cyl: center + radius (x) + height (y) + segments
  center: Vec3;
  size: Vec3; // for cyl: [radius, height, radius]
  tag: string;
  thinWall?: boolean; // flagged by part definition under certain params
}

export interface Mesh {
  prims: Prim[];
  // human dimensions for the dimension lines / bbox readout (mm)
  bbox: Vec3;
  // optional raw triangle soup (uploaded / parsed models) rendered instead of prims
  tris?: Tri[];
  // pre-computed solid volume for raw meshes (cm³)
  volumeCm3?: number;
}

/* ---------- vector helpers ---------- */
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export function rotateY(v: Vec3, t: number): Vec3 {
  const c = Math.cos(t), s = Math.sin(t);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}
export function rotateX(v: Vec3, t: number): Vec3 {
  const c = Math.cos(t), s = Math.sin(t);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

/* ---------- primitive -> triangles ---------- */
export function boxTris(p: Prim): Tri[] {
  const [cx, cy, cz] = p.center;
  const [sx, sy, sz] = p.size.map((s) => s / 2) as Vec3;
  const v: Vec3[] = [
    [cx - sx, cy - sy, cz - sz], [cx + sx, cy - sy, cz - sz],
    [cx + sx, cy + sy, cz - sz], [cx - sx, cy + sy, cz - sz],
    [cx - sx, cy - sy, cz + sz], [cx + sx, cy - sy, cz + sz],
    [cx + sx, cy + sy, cz + sz], [cx - sx, cy + sy, cz + sz],
  ];
  const quads = [
    [0, 1, 2, 3], [5, 4, 7, 6], [4, 5, 1, 0],
    [3, 2, 6, 7], [1, 5, 6, 2], [4, 0, 3, 7],
  ];
  const tris: Tri[] = [];
  for (const q of quads) {
    tris.push({ a: v[q[0]], b: v[q[1]], c: v[q[2]], tag: p.tag });
    tris.push({ a: v[q[0]], b: v[q[2]], c: v[q[3]], tag: p.tag });
  }
  return tris;
}

export function cylTris(p: Prim, seg = 20): Tri[] {
  const [cx, cy, cz] = p.center;
  const r = p.size[0], h = p.size[1] / 2;
  const tris: Tri[] = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * r, z0 = cz + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r, z1 = cz + Math.sin(a1) * r;
    const top0: Vec3 = [x0, cy + h, z0], top1: Vec3 = [x1, cy + h, z1];
    const bot0: Vec3 = [x0, cy - h, z0], bot1: Vec3 = [x1, cy - h, z1];
    // side
    tris.push({ a: bot0, b: bot1, c: top1, tag: p.tag });
    tris.push({ a: bot0, b: top1, c: top0, tag: p.tag });
    // caps
    tris.push({ a: [cx, cy + h, cz], b: top0, c: top1, tag: p.tag });
    tris.push({ a: [cx, cy - h, cz], b: bot1, c: bot0, tag: p.tag });
  }
  return tris;
}

export function meshTris(m: Mesh): Tri[] {
  if (m.tris) return m.tris;
  const out: Tri[] = [];
  for (const p of m.prims) out.push(...(p.kind === "box" ? boxTris(p) : cylTris(p)));
  return out;
}

/* ---------- approximate solid volume (cm³) ---------- */
// world units == mm; volume primitives summed then converted mm³ -> cm³.
export function meshVolumeCm3(m: Mesh): number {
  if (m.volumeCm3 != null) return m.volumeCm3;
  if (m.tris) return triSoupVolumeCm3(m.tris);
  let mm3 = 0;
  for (const p of m.prims) {
    if (p.kind === "box") mm3 += p.size[0] * p.size[1] * p.size[2];
    else mm3 += Math.PI * p.size[0] * p.size[0] * p.size[1];
  }
  return mm3 / 1000;
}

// Signed-tetrahedron volume of a closed triangle soup (mm³ -> cm³).
export function triSoupVolumeCm3(tris: Tri[]): number {
  let v6 = 0;
  for (const t of tris) {
    v6 += dot(t.a, cross(t.b, t.c));
  }
  return Math.abs(v6 / 6) / 1000;
}

// Uniformly scale a raw-triangle mesh and rescale its bbox/volume.
export function scaleMesh(m: Mesh, s: number): Mesh {
  if (!m.tris) return m;
  const tris = m.tris.map((t) => ({
    a: [t.a[0] * s, t.a[1] * s, t.a[2] * s] as Vec3,
    b: [t.b[0] * s, t.b[1] * s, t.b[2] * s] as Vec3,
    c: [t.c[0] * s, t.c[1] * s, t.c[2] * s] as Vec3,
    tag: t.tag,
  }));
  return {
    prims: [],
    tris,
    bbox: [m.bbox[0] * s, m.bbox[1] * s, m.bbox[2] * s],
    volumeCm3: (m.volumeCm3 ?? triSoupVolumeCm3(m.tris)) * s * s * s,
  };
}

// Decimate a huge triangle soup for smooth preview (keeps every Nth tri).
export function decimate(tris: Tri[], max = 3500): Tri[] {
  if (tris.length <= max) return tris;
  const step = Math.ceil(tris.length / max);
  const out: Tri[] = [];
  for (let i = 0; i < tris.length; i += step) out.push(tris[i]);
  return out;
}
