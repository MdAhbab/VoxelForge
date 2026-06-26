# VoxelForge — made-to-order 3D-printed parts

> *"Design it in the browser. Price it in real time. Print it tomorrow."* Upload a model or
> start from a **live parametric catalog** (phone stands, drawer organizers, replacement
> knobs), tweak dimensions in a real-time 3D viewport, and get an **instant price** computed
> from material and volume. A **printability pre-flight** checks the part before you pay.

**Type:** standalone product.
**Stack:** FastAPI · SQLite · React + Vite · Three.js (@react-three/fiber + drei) · GSAP · Lenis.

---

## 1. The problem & the wedge

Online 3D-printing services exist — **Craftcloud** gives instant real-time quotes across
180+ manufacturers and 100+ materials; **Shapeways** offers instant quoting at industrial
scale; **Hubs** routes to a manufacturing network. But they're essentially **upload → pick
material → get a number**. Two things are weak across the field:

- You can't **shape the part in the browser**. Catalog items aren't truly parametric; you
  can't drag a slider to make the phone stand fit *your* 6.7" phone and watch price update.
- Pricing is a **black box** and **printability problems are found late** (after upload, or
  worse, after a failed print).

**VoxelForge's wedges:**

1. **Live parametric configurator** — catalog parts are real parametric models; sliders change
   geometry *and* price in the same frame, in a premium 3D viewport.
2. **Glass-box instant quote** — price is broken down (material volume × density × rate +
   machine time + supports + finishing + margin) and **explained by an AI agent** that can
   hit a target budget.
3. **Printability pre-flight** — before checkout, the part is analyzed (wall thickness,
   overhangs, manifold/normals, min feature size) and shown as a **visual heatmap** with
   auto-fix suggestions and best print orientation.

### Benchmark

| Capability | Craftcloud | Shapeways | Hubs | **VoxelForge** |
|---|---|---|---|---|
| Instant real-time quote | ✅ | ✅ | ✅ | ✅ |
| Material/finish catalog | ✅ (100+) | ✅ | ✅ | ✅ (curated) |
| **Live in-browser parametric editing** | ❌ | ❌ | ❌ | ✅ **core** |
| **Printability pre-flight heatmap** | partial | partial | partial | ✅ **visual** |
| **AI quote-explainer / budget solver** | ❌ | ❌ | ❌ | ✅ Gemma |
| AR "view in your room" | ❌ | ❌ | ❌ | ✅ |

---

## 2. Users & core journeys

**Maker / buyer**
1. Either **pick a catalog part** (and drag sliders) or **upload** an STL/OBJ/3MF.
2. See it in the 3D viewport; choose **material + finish** (PBR preview).
3. Read the **instant, itemized quote**; ask the agent "make it under ৳800."
4. Run **pre-flight**; accept fixes/orientation.
5. Add to cart (multi-part), checkout, track print + shipping.

**Operator (print shop admin)**
- Manage materials, machines, rates, and the parametric catalog; review queued jobs; set
  printability thresholds.

---

## 3. Feature set

### 3.1 Core
- **Model upload** (STL / OBJ / 3MF), parsing, bounding box, volume, surface area.
- **3D viewport**: orbit/pan/zoom, wireframe/solid/x-ray, measure tool, build-plate context.
- **Material & finish picker** with PBR preview (matte PLA, PETG, ABS, resin, nylon, metallic).
- **Instant quote engine**: `volume × density × material_rate + est_machine_time × machine_rate
  + support_volume × support_rate + finishing + setup + margin`, recomputed live.
- **Cart, checkout, order tracking** (mock payment in dev).

### 3.2 ✨ New / signature features

1. **Live parametric configurator** — each catalog part is a parametric model with named
   dimensions (height, angle, slot width, wall thickness). Sliders/number inputs morph the
   mesh in real time; volume → price updates same-frame. Includes presets ("fits iPhone 15
   Pro Max", "fits 18 mm dowel").

2. **Glass-box quote breakdown** — the price expands into a labeled, animated breakdown bar
   (material / machine time / supports / finishing / margin). Change infill, material, or layer
   height and watch each segment move. Pairs with the **Quote-Explainer agent**.

3. **Printability pre-flight heatmap** — overlays on the 3D model: red = walls below min
   thickness, orange = unsupported overhangs > threshold, markers for non-manifold edges /
   flipped normals / tiny features. Suggests **fixes** and the **best orientation** (lowest
   supports / strongest part). Composes with the **Printability Advisor** + **Mesh-Repair**
   agents.

4. **AR "view in your room"** + **multi-part nesting estimate** — `model-viewer` AR to place
   the part at true scale on your desk; for multi-part carts, an estimate of how parts nest in
   the build volume (affects shipping/lead time).

### 3.3 Pricing engine details
- Material library: `{name, density_g_cm3, rate_per_cm3, process(FDM/SLA/SLS/MJF), colors,
  finishes, min_wall_mm, max_bbox_mm}`.
- Machine-time estimate: from volume + layer height + infill (heuristic in dev; pluggable
  slicer estimate in prod).
- Quote is deterministic and **fully itemized** so the agent can explain/optimize it.

---

## 4. Data model (SQLite dev)

```
Material(id, name, process, density_g_cm3, rate_per_cm3, machine_rate_per_min,
         min_wall_mm, max_bbox_mm, colors_json, finishes_json)
CatalogPart(id, name, category, base_mesh_ref, params_schema_json, presets_json, thumb)
ModelUpload(id, user_id, filename, format, volume_cm3, bbox_json, surface_cm2,
            manifold(bool), issues_json, created_at)
Quote(id, source(enum: catalog|upload), part_id?, upload_id?, material_id,
      params_json, infill_pct, layer_height_mm, finish,
      volume_cm3, support_cm3, est_minutes, breakdown_json, total, currency, created_at)
PreflightReport(id, quote_id, min_wall_violations_json, overhang_pct, manifold(bool),
                small_features_json, suggested_orientation_json, score)
Order(id, user_id, items_json, status(enum: review|printing|shipped|done), created_at)
```

---

## 5. API surface (selected)

```
POST   /api/uploads                  (multipart)  -> volume, bbox, manifold, issues
GET    /api/catalog                  -> parts + params schema
POST   /api/quote                    { source, part_id|upload_id, material_id, params,
                                       infill, layer_height, finish } -> itemized breakdown
POST   /api/preflight                { quote_id } -> heatmap data + fixes + orientation
GET    /api/materials
POST   /api/cart  ·  POST /api/orders
# Agentic
POST   /api/agents/printability      { upload_id } -> issues + fixes + best orientation
POST   /api/agents/quote-explainer   { quote_id, target_budget? } -> explanation / cheaper combo
POST   /api/agents/parametric        { part_id, nl_request } -> param values ("6.7\" phone, 60°")
POST   /api/agents/mesh-repair       { upload_id } -> repaired mesh + report
```

OpenAPI docs at `/docs`.

---

## 6. Agentic layer (Gemma) — summary

Full spec in [`AGENTS.md`](AGENTS.md). Four agents:

1. **Printability Advisor** — analyzes a mesh, flags thin walls/overhangs/non-manifold,
   recommends best orientation.
2. **Quote Explainer & Budget Solver** — explains the itemized price; finds a cheaper
   material/infill/finish combo to hit a target budget.
3. **Parametric Design Assistant** — turns natural language ("phone stand for a 6.7" phone at
   60°") into concrete catalog parameter values.
4. **Mesh-Repair Orchestrator** — runs repair tools (fill holes, fix normals, make manifold)
   and reports what changed.

---

## 7. Milestones
- **M0** Specs & design (this repo).
- **M1** Upload + parse (volume/bbox/manifold) + 3D viewport.
- **M2** Material picker + **instant quote engine** + glass-box breakdown.
- **M3** **Live parametric configurator** + catalog.
- **M4** **Printability pre-flight** heatmap + orientation.
- **M5** Gemma agents (printability, quote-explainer, parametric, mesh-repair).
- **M6** AR view, multi-part nesting, checkout + order tracking, operator console.

---

## 8. Run

**One command** (sets up a venv, installs both stacks, starts both servers):
```bash
python run.py
```

**Or run each stack manually:**
```bash
cd backend && uv sync && uvicorn app.main:app --reload     # http://localhost:8000/docs
#   (or: pip install -r requirements.txt)
cd frontend && npm install && npm run dev                  # http://localhost:5173
```

The backend seeds its reference data (materials + parametric catalog) on first
start, so the app works immediately. The frontend also ships a built-in fallback
catalog/material set and computes quotes locally, so the configurator stays fully
usable even with no backend running (e.g. the static Vercel preview).

> The Gemma agent endpoints (`/api/agents/*`) are stubbed; the configurator's
> parametric and budget-solver surfaces run on the deterministic heuristics in the
> frontend (`lib/pricing.ts`, `parseNL`) pending the Gemma wiring (milestone M5).

See [`DESIGN-INSTRUCTIONS.md`](DESIGN-INSTRUCTIONS.md) and [`AGENTS.md`](AGENTS.md).

---

### Sources (benchmark)
- Craftcloud — instant quotes, 180+ partners / 100+ materials: https://craftcloud3d.com/ and https://craftcloud3d.com/en/upload
- Shapeways — instant quoting: https://www.shapeways.com/blog/instant-quoting-is-here-a-faster-smarter-way-to-get-your-3d-printed-parts
