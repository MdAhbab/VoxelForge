from .database import engine, SessionLocal
from . import models

def seed_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(models.Material).first():
        print("Database already seeded")
        return

    materials = [
        {
            "id": "pla", "name": "Matte PLA", "process": "FDM", "density_g_cm3": 1.24, "rate_per_cm3": 3.4, 
            "machine_rate_per_min": 1.1, "min_wall_mm": 1.0, "max_bbox_mm": 250, 
            "colors_json": ["#cfd6df", "#1c1f26", "#d6294c", "#1f9d57", "#2d5bd8"],
            "finishes_json": ["As printed", "Light sand"]
        },
        {
            "id": "petg", "name": "PETG", "process": "FDM", "density_g_cm3": 1.27, "rate_per_cm3": 4.1, 
            "machine_rate_per_min": 1.2, "min_wall_mm": 1.2, "max_bbox_mm": 250,
            "colors_json": ["#8fb9c9", "#101820", "#e2e9f6"],
            "finishes_json": ["As printed", "Light sand"]
        },
        {
            "id": "abs", "name": "ABS", "process": "FDM", "density_g_cm3": 1.04, "rate_per_cm3": 3.9, 
            "machine_rate_per_min": 1.3, "min_wall_mm": 1.2, "max_bbox_mm": 230,
            "colors_json": ["#2b2f36", "#cfd6df", "#d6294c"],
            "finishes_json": ["As printed", "Vapour smooth"]
        },
        {
            "id": "resin", "name": "Standard Resin", "process": "SLA", "density_g_cm3": 1.18, "rate_per_cm3": 9.2, 
            "machine_rate_per_min": 2.4, "min_wall_mm": 0.6, "max_bbox_mm": 145,
            "colors_json": ["#d8dde6", "#2b2f36", "#e9e3ff"],
            "finishes_json": ["Cured", "Primed", "Painted"]
        },
        {
            "id": "nylon", "name": "Sintered Nylon", "process": "SLS", "density_g_cm3": 1.01, "rate_per_cm3": 11.8, 
            "machine_rate_per_min": 2.0, "min_wall_mm": 0.8, "max_bbox_mm": 300,
            "colors_json": ["#e7e3da", "#1c1f26"],
            "finishes_json": ["Raw", "Dyed black", "Polished"]
        },
        {
            "id": "mjf", "name": "MJF Nylon", "process": "MJF", "density_g_cm3": 1.01, "rate_per_cm3": 12.6, 
            "machine_rate_per_min": 1.9, "min_wall_mm": 0.8, "max_bbox_mm": 360,
            "colors_json": ["#3a3f47", "#e7e3da"],
            "finishes_json": ["Raw grey", "Dyed black"]
        },
        {
            "id": "metal", "name": "Metallic PLA", "process": "FDM", "density_g_cm3": 2.2, "rate_per_cm3": 6.4, 
            "machine_rate_per_min": 1.2, "min_wall_mm": 1.4, "max_bbox_mm": 230,
            "colors_json": ["#9aa3ad", "#b08d57", "#6e7a86"],
            "finishes_json": ["As printed", "Burnished"]
        }
    ]

    for m in materials:
        db.add(models.Material(**m))

    # NOTE: ids, names and param KEYS must stay in lock-step with the front-end mesh
    # builders in frontend/src/app/lib/catalog.ts — each builder reads a fixed set of
    # keys, so a mismatch silently renders the wrong shape with dead sliders.
    parts = [
        {
            "id": "phone-stand",
            "name": "Adjustable Phone Stand",
            "category": "Desk",
            "blurb": "Angled cradle with a cable pass-through.",
            "params_schema_json": [
                { "key": "deviceW", "label": "Device width", "min": 60, "max": 100, "step": 1, "unit": "mm", "def": 78 },
                { "key": "angle", "label": "Viewing angle", "min": 35, "max": 75, "step": 1, "unit": "°", "def": 60 },
                { "key": "height", "label": "Back height", "min": 70, "max": 140, "step": 1, "unit": "mm", "def": 110 },
                { "key": "slot", "label": "Cable slot", "min": 0, "max": 22, "step": 1, "unit": "mm", "def": 12 },
                { "key": "wall", "label": "Wall thickness", "min": 1.2, "max": 6, "step": 0.2, "unit": "mm", "def": 3 }
            ],
            "presets_json": [
                { "label": "iPhone 15 Pro Max", "values": { "deviceW": 77, "angle": 62, "height": 116 } },
                { "label": "Compact 60°", "values": { "deviceW": 70, "angle": 60, "height": 88 } },
                { "label": "Tablet lean", "values": { "deviceW": 96, "angle": 55, "height": 130 } }
            ]
        },
        {
            "id": "knob",
            "name": "Replacement Knob",
            "category": "Hardware",
            "blurb": "Press-fit knob for drawers & appliances.",
            "params_schema_json": [
                { "key": "dia", "label": "Diameter", "min": 18, "max": 60, "step": 1, "unit": "mm", "def": 36 },
                { "key": "height", "label": "Height", "min": 10, "max": 40, "step": 1, "unit": "mm", "def": 22 },
                { "key": "shaft", "label": "Shaft bore", "min": 4, "max": 14, "step": 0.5, "unit": "mm", "def": 6 },
                { "key": "wall", "label": "Wall thickness", "min": 1.2, "max": 6, "step": 0.2, "unit": "mm", "def": 2.4 }
            ],
            "presets_json": [
                { "label": "Fits 6 mm dowel", "values": { "shaft": 6, "dia": 34 } },
                { "label": "Fits 18 mm dowel", "values": { "shaft": 14, "dia": 52, "height": 30 } }
            ]
        },
        {
            "id": "tray",
            "name": "Drawer Organiser",
            "category": "Storage",
            "blurb": "Divided tray, sized to your drawer.",
            "params_schema_json": [
                { "key": "width", "label": "Width", "min": 60, "max": 220, "step": 2, "unit": "mm", "def": 140 },
                { "key": "depth", "label": "Depth", "min": 60, "max": 180, "step": 2, "unit": "mm", "def": 100 },
                { "key": "height", "label": "Height", "min": 18, "max": 70, "step": 1, "unit": "mm", "def": 36 },
                { "key": "div", "label": "Dividers", "min": 0, "max": 4, "step": 1, "unit": "×", "def": 2 },
                { "key": "wall", "label": "Wall thickness", "min": 1.2, "max": 5, "step": 0.2, "unit": "mm", "def": 2 }
            ],
            "presets_json": [
                { "label": "Cutlery 3-bay", "values": { "width": 200, "depth": 120, "div": 3 } },
                { "label": "Desk tidy", "values": { "width": 120, "depth": 90, "div": 2, "height": 28 } }
            ]
        },
        {
            "id": "bracket",
            "name": "Wall Bracket",
            "category": "Hardware",
            "blurb": "Load-bearing L bracket with gusset.",
            "params_schema_json": [
                { "key": "legA", "label": "Leg A", "min": 30, "max": 120, "step": 2, "unit": "mm", "def": 70 },
                { "key": "legB", "label": "Leg B", "min": 30, "max": 120, "step": 2, "unit": "mm", "def": 70 },
                { "key": "width", "label": "Width", "min": 16, "max": 60, "step": 1, "unit": "mm", "def": 28 },
                { "key": "thick", "label": "Thickness", "min": 2, "max": 10, "step": 0.5, "unit": "mm", "def": 5 }
            ],
            "presets_json": [
                { "label": "Shelf 70×70", "values": { "legA": 70, "legB": 70 } },
                { "label": "Heavy 120×80", "values": { "legA": 120, "legB": 80, "thick": 8, "width": 40 } }
            ]
        },
        {
            "id": "planter",
            "name": "Tapered Planter",
            "category": "Home",
            "blurb": "Self-watering tapered pot.",
            "params_schema_json": [
                { "key": "dia", "label": "Diameter", "min": 50, "max": 160, "step": 2, "unit": "mm", "def": 96 },
                { "key": "height", "label": "Height", "min": 50, "max": 200, "step": 2, "unit": "mm", "def": 120 },
                { "key": "taper", "label": "Taper", "min": 0, "max": 40, "step": 1, "unit": "mm", "def": 18 },
                { "key": "wall", "label": "Wall thickness", "min": 1.6, "max": 6, "step": 0.2, "unit": "mm", "def": 2.8 }
            ],
            "presets_json": [
                { "label": "Succulent", "values": { "dia": 70, "height": 64 } },
                { "label": "Herb pot", "values": { "dia": 120, "height": 140 } }
            ]
        }
    ]

    for p in parts:
        db.add(models.CatalogPart(**p))

    db.commit()
    print("Database seeded")

if __name__ == "__main__":
    seed_db()
