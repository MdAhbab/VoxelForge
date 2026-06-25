import json
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

    parts = [
        {
            "id": "c_phonestand",
            "name": "Adjustable phone stand",
            "category": "Desk accessories",
            "blurb": "A clean, weighted stand with a cable channel.",
            "params_schema_json": [
                { "key": "deviceW", "label": "Device width", "min": 60, "max": 100, "step": 1, "unit": "mm", "def": 78 },
                { "key": "angle", "label": "Viewing angle", "min": 35, "max": 75, "step": 1, "unit": "°", "def": 60 },
                { "key": "height", "label": "Back height", "min": 70, "max": 140, "step": 1, "unit": "mm", "def": 110 },
                { "key": "slot", "label": "Cable slot", "min": 0, "max": 22, "step": 1, "unit": "mm", "def": 12 },
                { "key": "wall", "label": "Wall thickness", "min": 1.2, "max": 6, "step": 0.2, "unit": "mm", "def": 3 }
            ],
            "presets_json": [
                { "label": "iPhone 15 Pro Max", "values": { "deviceW": 78, "angle": 60, "height": 130, "slot": 15, "wall": 3.2 } },
                { "label": "iPad Mini (portrait)", "values": { "deviceW": 135, "angle": 55, "height": 180, "slot": 12, "wall": 4 } }
            ]
        },
        {
            "id": "c_drawerbox",
            "name": "Gridfinity-style bin",
            "category": "Organization",
            "blurb": "Stackable drawer organizer bins.",
            "params_schema_json": [
                { "key": "unitsX", "label": "Width (units)", "min": 1, "max": 6, "step": 1, "unit": "U", "def": 2 },
                { "key": "unitsY", "label": "Depth (units)", "min": 1, "max": 6, "step": 1, "unit": "U", "def": 1 },
                { "key": "height", "label": "Height (units)", "min": 1, "max": 8, "step": 1, "unit": "U", "def": 3 },
                { "key": "wall", "label": "Wall thickness", "min": 0.8, "max": 3, "step": 0.2, "unit": "mm", "def": 1.2 }
            ],
            "presets_json": [
                { "label": "1x1 bit holder", "values": { "unitsX": 1, "unitsY": 1, "height": 2, "wall": 1.2 } },
                { "label": "2x3 tool tray", "values": { "unitsX": 2, "unitsY": 3, "height": 3, "wall": 1.6 } }
            ]
        },
        {
            "id": "c_knob",
            "name": "Knurled replacement knob",
            "category": "Hardware",
            "blurb": "Press-fit or threaded knob for appliances.",
            "params_schema_json": [
                { "key": "outerD", "label": "Outer diameter", "min": 15, "max": 60, "step": 1, "unit": "mm", "def": 30 },
                { "key": "height", "label": "Height", "min": 10, "max": 40, "step": 1, "unit": "mm", "def": 18 },
                { "key": "shaftD", "label": "Shaft hole", "min": 4, "max": 12, "step": 0.1, "unit": "mm", "def": 6.1 },
                { "key": "knurl", "label": "Knurl density", "min": 10, "max": 50, "step": 1, "unit": "n", "def": 24 }
            ],
            "presets_json": [
                { "label": "Potentiometer (6mm)", "values": { "outerD": 22, "height": 16, "shaftD": 6.1, "knurl": 18 } },
                { "label": "Oven dial (D-shaft)", "values": { "outerD": 45, "height": 22, "shaftD": 8.2, "knurl": 36 } }
            ]
        }
    ]

    for p in parts:
        db.add(models.CatalogPart(**p))

    db.commit()
    print("Database seeded")

if __name__ == "__main__":
    seed_db()
