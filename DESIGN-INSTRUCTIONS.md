# VoxelForge — Front-End Design Brief (for Claude, in Claude Design)

**You are designing the complete front end of VoxelForge from scratch.** Build **every page**
here, for **desktop and mobile**, in **light and dark themes**. The product is a real-time 3D
configurator + pricing engine, so the design must feel like a **precision instrument** — a
premium CAD/lab tool, not a generic store. Use **React + Vite + Tailwind + Three.js
(@react-three/fiber + drei) + GSAP/ScrollTrigger + Lenis**.

Read fully, then build in the **step order** at the end.

---

## 0. North Star — "an instrument, not an ad"

VoxelForge's identity is **additive manufacturing made tactile**: the world is built one
layer at a time. The signature idea: **as you scroll the landing page, an object literally
3D-prints itself** — the print head sweeps, layers stack from the build plate upward, layer
height tied to scroll progress, until a finished part rotates into the configurator. The
whole site reads like a **technical drawing that comes alive**: blueprint grids, dimension
lines, calipers, exploded views.

Premium / non-AI tells to hit:
- ✅ Engineering-drawing language: thin rules, dimension arrows, tick marks, monospaced
  annotations, a faint isometric grid.
- ✅ Restrained palette (graphite + one electric accent), heavy on **precision and whitespace**.
- ✅ Real 3D everywhere it matters; physically-based materials; crisp specular highlights.
- ❌ No rounded "friendly SaaS" blobs, no rainbow gradients, no stocky 3D-printer photos,
  no three-cards-fade-up.

---

## 1. Art direction

**Mood words:** precise · technical · tactile · confident · clean · "lab-grade."

**Dual theme:**
- **Dark = "Graphite shop"** (default for the configurator — makes 3D pop): near-black
  graphite with a blueprint undertone.
- **Light = "Drafting paper / lab"**: bright white-blue paper, blueprint lines inverted to ink.

The theme toggle is a small **layer-height / "filled vs wireframe" switch**.

### Color tokens (CSS variables, both themes)

**Dark ("Graphite")**
- `--bg`: `#0C0E12` · `--bg-elev`: `#14171D` · `--panel`: `#1A1E26`
- `--ink`: `#E8ECF2` · `--ink-dim`: `#8A93A3`
- `--accent`: `#2BE0C8` (electric mint-cyan — the "live/active" color)
- `--accent-2`: `#5B8CFF` (blueprint blue, dimension lines)
- `--warn`: `#FF8A5B` (overhangs) · `--danger`: `#FF5470` (thin walls)
- `--ok`: `#7CF0A0` (passes pre-flight)
- `--grid`: `rgba(91,140,255,0.10)` (isometric grid)

**Light ("Drafting")**
- `--bg`: `#F3F6FB` · `--bg-elev`: `#FFFFFF` · `--panel`: `#FFFFFF`
- `--ink`: `#10141B` · `--ink-dim`: `#5A6473`
- `--accent`: `#0FB6A0` · `--accent-2`: `#2D5BD8`
- `--warn`: `#D9622B` · `--danger`: `#D6294C` · `--ok`: `#1F9D57`
- `--grid`: `rgba(45,91,216,0.12)`

### Typography
- **Headlines:** a precise, slightly technical grotesk — **Space Grotesk** (or **Neue
  Haas-style** via **Archivo**). Tight tracking, mixed-case, confident but not loud.
- **UI/body:** **Inter** for clarity at small sizes.
- **Numerals / specs / dimensions / price:** **JetBrains Mono** (tabular) — used for every
  measurement, mm value, and price so the "instrument" feel holds.
- Annotations/labels in mono small-caps with letter-spacing, like a CAD drawing.

### Texture & lighting
- A faint **isometric / dot blueprint grid** background (very low opacity), subtle vignette.
- 3D parts lit with a **soft three-point studio rig** + a sharp key for specular edges;
  contact shadows on the build plate.
- Micro-details: dimension lines that draw on, caliper brackets around measured values,
  scanline shimmer on "computing quote."

---

## 2. Signature scroll & 3D system (the differentiator)

Wire **Lenis → GSAP ScrollTrigger**. The user does **not** want generic reveal-on-scroll.
Build these specific, scrubbed behaviors:

1. **Scroll-to-print hero.** A Three.js part **prints layer-by-layer as the user scrolls**: a
   print head traverses, each layer extrudes/clips in, `clippingPlane.y` mapped to scroll
   progress. Finish the print → the part lifts off the plate and **rotates into the live
   configurator**. (Reduced-motion: show the finished part + a "play" affordance.)

2. **Wireframe → solid materialization.** As a section enters, a model transitions from
   wireframe to shaded to final PBR material, scrubbed — showing "from idea to object."

3. **Exploded-view assembly (pinned).** Pin a section; scrolling drives an **exploded view**
   of a multi-part product separating along axes with dimension lines drawing between parts,
   then re-assembling. Premium and clearly "engineering."

4. **The quote bar that builds itself.** In the pricing section, the **itemized cost bar
   assembles segment by segment** (material → machine time → supports → finishing → margin) as
   you scroll, each segment labeled with a caliper bracket and mono value.

5. **Caliper parallax.** Dimension lines, tick rulers, and annotation labels move at slightly
   different parallax depths than the part, giving a tactile "drawing over object" layering.

6. **Live, not scrubbed, in the tool itself.** Inside the configurator, motion is
   *interaction-driven*: dragging a slider morphs geometry and re-prices in the same frame with
   a quick mono number roll; pre-flight issues pulse on the model.

> All hero/marketing motion is **scroll-scrubbed & deterministic**. The configurator is
> **input-driven & instant**. Respect `prefers-reduced-motion`. One shared WebGL context;
> pause when offscreen.

---

## 3. Pages to design (every one; desktop + mobile; light + dark)

### 3.1 Landing / Marketing home
- **Hero:** scroll-to-print scene (section 2.1) with a big Space Grotesk headline —
  *"Design it. Price it. Print it."* — and a mono sub-line showing a live ticking price.
- **Sections:** (a) wireframe→solid materialization; (b) the **live configurator teaser**
  (real, interactive, embedded); (c) exploded-view pinned section; (d) the self-building quote
  bar; (e) printability pre-flight showcase (heatmap on a rotating part); (f) materials gallery
  (PBR swatches: matte PLA, glossy resin, sintered nylon, metallic) on a turntable; (g)
  footer styled as a title block of a technical drawing (revision, scale, author).
- **Mobile:** print-on-scroll becomes a shorter vertical sequence; exploded view becomes a
  stepped tap-through; configurator teaser uses a simplified mesh.

### 3.2 Configurator (the core tool — design this most carefully)
- **Three-zone layout (desktop):** left = **part source** (catalog grid / upload dropzone);
  center = **3D viewport** (orbit, build plate, grid, view modes: solid/wireframe/x-ray,
  measure tool, AR button); right = **controls** (parameter sliders with mono values + units,
  material & finish picker with PBR chips, infill/layer-height, and the **glass-box quote**).
- **Quote panel:** big mono total + expandable itemized breakdown bar (animated). A "make it
  under ৳___" field → Quote-Explainer agent.
- **Parametric controls:** named dimensions with live mm readouts, presets ("fits iPhone 15
  Pro Max", "18 mm dowel"), an NL field → Parametric agent.
- **Mobile:** viewport on top (pinned, ~55vh), controls in a scrollable bottom panel with
  segmented tabs (Shape / Material / Quote / Pre-flight); sliders are large; quote stays
  visible as a sticky bar.

### 3.3 Upload & parse
- Dropzone with format chips (STL/OBJ/3MF), a parse progress with a scanline over the
  appearing mesh, then auto-report: volume, bbox, surface area, **manifold yes/no**, issue
  count. CTA → configure or run mesh-repair.

### 3.4 Printability pre-flight
- The part with the **heatmap overlay** (red thin walls, orange overhangs, markers for
  non-manifold/normals/small features), a legend, a list of issues with "auto-fix" actions, and
  a **best-orientation** suggestion you can apply (the part animates to the new orientation).

### 3.5 Materials & finishes
- A premium gallery: each material as a PBR sphere/sample on a turntable with specs (density,
  rate, min wall, process, lead time). Filter by process (FDM/SLA/SLS/MJF).

### 3.6 Cart & multi-part nesting
- Line items with thumbnails + per-part quotes; a **build-volume nesting preview** (parts
  arranged in the printer volume) affecting shipping/lead time; totals.

### 3.7 Checkout & order tracking
- Clean checkout (mock pay in dev). Order tracking as a **horizontal process timeline**
  (review → printing → post-processing → shipped) styled like a Gantt/route, with the live
  stage glowing.

### 3.8 Operator console
- Utilitarian admin: materials/machines/rates editor, catalog manager (define parametric
  parts + schema), job queue, pre-flight thresholds. Denser, table-driven, same token system.

### 3.9 System / states
- Empty (no model yet → an inviting build plate), loading (a layer-by-layer skeleton), errors
  (mesh too big / non-manifold), auth, 404 (a half-printed part).

---

## 4. Components library
- `ForgeViewport` (shared R3F canvas: orbit, plate, grid, view modes, clipping for layer
  reveal, heatmap shader).
- `LayerPrintScene` (scroll-driven hero print).
- `ParamSlider` (mono readout + unit + caliper bracket), `MaterialChip` (PBR), `FinishChip`.
- `QuoteBar` (animated itemized breakdown), `NumberRoll` (mono price roll).
- `PreflightHeatmap`, `IssueList`, `OrientationGizmo`.
- `DimensionLine`, `CaliperBracket`, `BlueprintGrid`, `TitleBlockFooter`.
- `ThemeToggle` (wireframe/solid).

Tailwind extension `forge`: colors via CSS vars, mono tabular utilities, grid/annotation
helpers, custom eases (`expo.out`, a "servo" ease for mechanical moves).

---

## 5. Responsive & mobile
- The **configurator must be genuinely usable on a phone**: pinned viewport + tabbed controls,
  big sliders, sticky quote, AR launch. Touch orbit/pinch-zoom.
- Heavy hero scenes degrade to lighter meshes / static render on low-power devices
  (perf probe + `prefers-reduced-motion`).

## 6. Accessibility & performance
- AA contrast both themes (accent on graphite, ink on paper). Visible focus (accent-2).
- Pre-flight issues never rely on color alone — pair with icons/labels and the issue list.
- Lazy-load WebGL & AR; decimate meshes for preview; cap DPR; one context; pause offscreen;
  LCP < 2.5s mid-mobile.

## 7. Build order
1. **Tokens & theming** (Tailwind, CSS vars both themes, mono type scale, blueprint grid,
   dimension/caliper utilities) + `ThemeToggle`.
2. **Motion + 3D foundation**: Lenis ↔ ScrollTrigger; `ForgeViewport` (R3F canvas, plate,
   grid, view modes, clipping).
3. **Landing** with all scroll scenes (scroll-to-print, wireframe→solid, exploded, quote-bar,
   pre-flight showcase, materials turntable, title-block footer).
4. **Configurator** (catalog/upload → viewport → controls → glass-box quote) — the core.
5. **Upload & parse** → **Pre-flight heatmap** + orientation.
6. **Materials gallery**, **Cart/nesting**, **Checkout/tracking**.
7. **Operator console.**
8. **States** + accessibility + reduced-motion + perf pass.

Deliver each page in **both themes** and **both breakpoints**, with scroll/3D behaviors wired
and annotated for engineers.
