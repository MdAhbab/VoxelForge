from typing import List, Dict, Any

def compute_quote(
    volume_cm3: float,
    infill: int,
    layer_height: float,
    finish: str,
    qty: int,
    material: Any
) -> Dict[str, Any]:
    # Clamp inputs so the function is total — never divides by zero or returns NaN,
    # even if a caller bypasses the request-schema validation.
    volume_cm3 = max(volume_cm3, 0.0)
    infill = min(max(infill, 0), 100)
    layer_height = max(layer_height, 0.05)
    qty = max(qty, 1)

    shell_frac = 0.32
    eff_frac = shell_frac + (1 - shell_frac) * (infill / 100.0)
    effective_volume = volume_cm3 * eff_frac

    needs_support = material.process in ("FDM", "SLA")
    support_cm3 = volume_cm3 * 0.12 if needs_support else 0.0

    layer_factor = 0.2 / layer_height
    est_minutes = (volume_cm3 * (0.55 + infill / 240.0) * layer_factor) + material.min_wall_mm * 2.0 + 6.0

    material_cost = effective_volume * material.rate_per_cm3
    machine_cost = est_minutes * material.machine_rate_per_min
    support_cost = support_cm3 * material.rate_per_cm3 * 0.6
    
    finish_lower = finish.lower()
    finish_cost = 0.0
    if any(x in finish_lower for x in ["smooth", "polish", "burnish"]):
        finish_cost = 60.0 + volume_cm3 * 0.4
    elif any(x in finish_lower for x in ["paint", "dye", "prime"]):
        finish_cost = 90.0 + volume_cm3 * 0.5
    elif "sand" in finish_lower:
        finish_cost = 25.0 + volume_cm3 * 0.2

    setup = 45.0
    subtotal = material_cost + machine_cost + support_cost + finish_cost + setup
    margin = subtotal * 0.18

    def make_seg(key, label, value, color):
        return {"key": key, "label": label, "value": value, "color": color}

    segments = [
        make_seg("material", "Material", material_cost, "var(--signal)"),
        make_seg("machine", "Machine time", machine_cost, "var(--blueprint)"),
        make_seg("supports", "Supports", support_cost, "var(--warn)"),
        make_seg("finishing", "Finishing", finish_cost, "var(--ok)"),
        make_seg("setup", "Setup", setup, "var(--ink-dim)"),
        make_seg("margin", "Margin", margin, "color-mix(in srgb, var(--ink-dim) 50%, transparent)"),
    ]
    segments = [s for s in segments if s["value"] > 0.01]

    total = subtotal + margin
    return {
        "segments": segments,
        "total": round(total, 2),
        "totalQty": round(total * qty, 2),
        "estMinutes": round(est_minutes),
        "supportCm3": round(support_cm3, 2),
        "effectiveVolume": round(effective_volume, 2),
        "currency": "৳"
    }

def search_budget(base_input: dict, target: float, materials: List[Any]) -> List[Dict[str, Any]]:
    out = []
    for m in materials:
        for infill in [10, 15, 20]:
            for lh in [0.28, 0.2]:
                finishes = m.finishes_json if m.finishes_json else ["As printed"]
                q = compute_quote(base_input['volumeCm3'], infill, lh, finishes[0], base_input.get('qty', 1), m)
                out.append({
                    "material": {"id": m.id, "name": m.name},
                    "infill": infill,
                    "layerHeight": lh,
                    "finish": finishes[0],
                    "total": q["total"]
                })
    
    valid = [c for c in out if c["total"] <= target]
    valid.sort(key=lambda x: x["total"])
    return valid[:4]
