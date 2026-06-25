import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, pricing
from .database import engine, get_db
from .seed import seed_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed reference data (materials + catalogue) on boot so the
    # API serves real rows on a fresh database instead of empty lists.
    models.Base.metadata.create_all(bind=engine)
    seed_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # Wildcard origin + credentials is rejected by browsers; this API is token-less,
    # so allow any origin without credentials (the dev front-end sends none).
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/materials", response_model=List[schemas.MaterialOut])
def get_materials(db: Session = Depends(get_db)):
    return db.query(models.Material).all()

@app.get("/api/catalog", response_model=List[schemas.CatalogPartOut])
def get_catalog(db: Session = Depends(get_db)):
    return db.query(models.CatalogPart).all()

@app.post("/api/uploads", response_model=schemas.ModelUploadOut)
def upload_model(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Mocking upload logic for MVP
    # In a real app we'd parse the STL/OBJ and calculate volume, bbox, manifoldness
    upload = models.ModelUpload(
        id=str(uuid.uuid4()),
        filename=file.filename,
        format=file.filename.split('.')[-1] if '.' in file.filename else "unknown",
        volume_cm3=45.2,
        bbox_json=[80.0, 45.0, 20.0],
        surface_cm2=120.5,
        manifold=True,
        issues_json=[]
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload

@app.post("/api/quote", response_model=schemas.QuoteOut)
def create_quote(quote_in: schemas.QuoteInput, db: Session = Depends(get_db)):
    material = db.query(models.Material).filter(models.Material.id == quote_in.materialId).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    quote_data = pricing.compute_quote(
        volume_cm3=quote_in.volumeCm3,
        infill=quote_in.infill,
        layer_height=quote_in.layerHeight,
        finish=quote_in.finish,
        qty=quote_in.qty,
        material=material
    )
    
    quote = models.Quote(
        id=str(uuid.uuid4()),
        source=quote_in.source,
        part_id=quote_in.part_id,
        upload_id=quote_in.upload_id,
        material_id=quote_in.materialId,
        params_json=None, # if we had them
        infill_pct=quote_in.infill,
        layer_height_mm=quote_in.layerHeight,
        finish=quote_in.finish,
        volume_cm3=quote_data["effectiveVolume"],
        support_cm3=quote_data["supportCm3"],
        est_minutes=quote_data["estMinutes"],
        breakdown_json=quote_data["segments"],
        total=quote_data["total"],
        currency=quote_data["currency"]
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    
    return schemas.QuoteOut(
        id=quote.id,
        segments=[schemas.QuoteSegment(**s) for s in quote.breakdown_json],
        total=quote.total,
        totalQty=quote.total * quote_in.qty,
        estMinutes=quote.est_minutes,
        supportCm3=quote.support_cm3,
        effectiveVolume=quote.volume_cm3,
        currency=quote.currency
    )

@app.post("/api/preflight", response_model=schemas.PreflightReportOut)
def run_preflight(req: schemas.PreflightRequest, db: Session = Depends(get_db)):
    report = models.PreflightReport(
        id=str(uuid.uuid4()),
        quote_id=req.quote_id,
        min_wall_violations_json=[],
        overhang_pct=0.0,
        manifold=True,
        small_features_json=[],
        suggested_orientation_json={"rotation": [0, 0, 0]},
        score=100
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

# Mock Agents
@app.post("/api/agents/printability")
def agent_printability(req: schemas.PrintabilityAgentRequest):
    return {"issues": [], "recommended_orientation": "Flat on build plate", "overall_score": 100, "confidence": 0.95}

@app.post("/api/agents/quote-explainer")
def agent_quote_explainer(req: schemas.QuoteExplainerRequest, db: Session = Depends(get_db)):
    return {"explanation": "This is a detailed explanation of your quote.", "alternative_combos": []}

@app.post("/api/agents/parametric")
def agent_parametric(req: schemas.ParametricAgentRequest):
    return {"param_values": {}, "applied_presets": [], "clamped_warnings": [], "rationale": "I applied these parameters based on your request."}

@app.post("/api/agents/mesh-repair")
def agent_mesh_repair(req: schemas.MeshRepairRequest):
    return {"ops_run": [], "changelog": "No repairs needed", "new_upload_id": req.upload_id, "residual_issues": []}
