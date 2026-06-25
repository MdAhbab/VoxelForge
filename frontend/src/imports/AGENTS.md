# VoxelForge — Agentic Layer (Gemma)

VoxelForge ships **four Gemma-powered agents** that sit on top of the deterministic geometry
and pricing engine. The engine (volume, walls, slicing estimate, quote math) is **not** the
LLM's job — those are exact tools. Gemma's job is **interpretation, explanation, and
orchestration**: turning meshes and numbers into advice a maker can act on. Agents never
silently change a customer's order or price; they propose, the user confirms.

**Runtime:** system prompt + tool registry + I/O schema per agent; FastAPI background workers
in dev. Every run logged to `AgentRun(id, agent, input, tool_calls, output, confidence)`.

---

## Shared tool registry

| Tool | Signature | Notes |
|------|-----------|-------|
| `mesh.analyze` | `(upload_id) -> {volume, bbox, surface, manifold, min_wall_map, overhang_pct, small_features, normals_ok}` | Exact geometry analysis (not LLM). |
| `mesh.repair` | `(upload_id, ops[]) -> {new_upload_id, changelog}` | fill holes / fix normals / make manifold. |
| `mesh.orient` | `(upload_id, goal) -> {rotation, supports_cm3, strength_axis}` | Best orientation for goal. |
| `pricing.quote` | `(spec) -> itemized breakdown` | Deterministic quote math. |
| `pricing.search` | `(constraints, target_budget) -> combos[]` | Enumerates material/infill/finish combos. |
| `catalog.params_schema` | `(part_id) -> schema` | Named dims, ranges, units, presets. |
| `catalog.validate` | `(part_id, params) -> {ok, clamped, warnings}` | Range/printability checks. |

LLM outputs that map to geometry/price are always **derived from these tools' results** — no
guessed millimeters or prices.

---

## Agent 1 — Printability Advisor
**Job:** read a mesh analysis and tell the maker, in plain language, what will and won't print
well — and how to fix it.

- **Trigger:** after upload/parse, or on "check printability."
- **Tools:** `mesh.analyze`, `mesh.orient`, `catalog.validate`.
- **Output:** `{ issues[]{type, where, severity, explanation, suggested_fix},
  recommended_orientation, overall_score, confidence }`.
- **Guardrails:** severity thresholds come from operator settings, not the model; the model
  explains and prioritizes, it does not invent measurements. Suggests; user applies.
- **UI surface:** the pre-flight heatmap legend + issue list; "apply orientation" / "auto-fix"
  buttons that call the exact tools.

## Agent 2 — Quote Explainer & Budget Solver
**Job:** make the price a glass box, and hit a target budget on request.

- **Trigger:** "explain this price" or "make it under ৳___."
- **Tools:** `pricing.quote`, `pricing.search`, `mesh.analyze`.
- **Output:** a plain-language breakdown of the itemized quote **+** (if a budget is given) the
  cheapest valid combo of material/infill/finish/layer-height that meets it, with the
  trade-offs named ("PETG instead of resin, 15% infill: −৳420, slightly rougher finish").
- **Guardrails:** only proposes combos that **pass printability** (`catalog.validate` /
  `mesh.analyze`); never quotes below the engine's computed cost; the user must confirm any
  change to their configured part. No fabricated discounts.
- **UI surface:** expandable quote breakdown + a "cheaper options" tray the user opts into.

## Agent 3 — Parametric Design Assistant
**Job:** turn natural language into concrete catalog parameters.

- **Trigger:** the NL field in the configurator (e.g. *"phone stand for a 6.7" phone at a 60°
  viewing angle, cable slot in the middle"*).
- **Tools:** `catalog.params_schema`, `catalog.validate`, `pricing.quote`.
- **Output:** `{ param_values, applied_presets, clamped_warnings, resulting_quote, rationale }`
  — values clamped to valid ranges, with a note when a request can't be satisfied.
- **Guardrails:** stays within the part's schema/ranges; flags impossible requests instead of
  forcing them; the morph is previewed before it's accepted. Doesn't fabricate parameters the
  part doesn't have.
- **UI surface:** sliders animate to the proposed values (preview), user accepts/tweaks.

## Agent 4 — Mesh-Repair Orchestrator
**Job:** plan and run a repair sequence on a problematic mesh, then report what changed.

- **Trigger:** non-manifold/normals/holes detected, or user clicks "repair."
- **Tools:** `mesh.analyze` (before/after), `mesh.repair`.
- **Output:** `{ ops_run[], changelog, before_after_metrics, new_upload_id, residual_issues }`.
- **Guardrails:** repairs produce a **new** upload (original is never destroyed); the user
  compares before/after and chooses which to keep; residual issues are reported honestly rather
  than hidden.
- **UI surface:** a before/after toggle on the model + a changelog; "use repaired version" CTA.

---

## Cross-cutting guardrails
- **Exact math stays exact:** geometry and price come from deterministic tools; Gemma never
  guesses dimensions, volumes, or totals.
- **Propose, don't commit:** every change to a part, orientation, or price is previewed and
  user-confirmed; originals are preserved.
- **Printability-gated suggestions:** any cheaper/alternative config the agents propose must
  pass pre-flight first.
- **Explainability:** each output carries confidence + rationale, surfaced in UI.
- **Auditability:** all runs + tool calls logged in `AgentRun`.
