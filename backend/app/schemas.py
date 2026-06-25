from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from .models import QuoteSource

# Materials
class MaterialBase(BaseModel):
    name: str
    process: str
    density_g_cm3: float
    rate_per_cm3: float
    machine_rate_per_min: float
    min_wall_mm: float
    max_bbox_mm: float
    colors_json: List[str]
    finishes_json: List[str]

class MaterialOut(MaterialBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

# Catalog
class ParamDef(BaseModel):
    key: str
    label: str
    min: float
    max: float
    step: float
    unit: str
    def_: float = Field(alias="def")

class Preset(BaseModel):
    label: str
    values: Dict[str, float]

class CatalogPartOut(BaseModel):
    id: str
    name: str
    category: str
    base_mesh_ref: Optional[str]
    blurb: Optional[str]
    params_schema_json: List[ParamDef]
    presets_json: List[Preset]
    thumb: Optional[str]

    model_config = ConfigDict(from_attributes=True)

# Uploads
class ModelUploadOut(BaseModel):
    id: str
    filename: str
    volume_cm3: float
    bbox_json: List[float]
    surface_cm2: float
    manifold: bool
    issues_json: List[Dict[str, Any]]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Pricing
class QuoteInput(BaseModel):
    source: QuoteSource = QuoteSource.upload
    part_id: Optional[str] = None
    upload_id: Optional[str] = None
    volumeCm3: float = Field(gt=0)
    bboxMax: float = Field(gt=0)
    materialId: str
    infill: int = Field(ge=0, le=100)
    layerHeight: float = Field(gt=0)
    finish: str
    qty: int = Field(default=1, ge=1)

class QuoteSegment(BaseModel):
    key: str
    label: str
    value: float
    color: str

class QuoteOut(BaseModel):
    id: str
    segments: List[QuoteSegment]
    total: float
    totalQty: float
    estMinutes: int
    supportCm3: float
    effectiveVolume: float
    currency: str

    model_config = ConfigDict(from_attributes=True)

# Preflight
class PreflightRequest(BaseModel):
    quote_id: str

class PreflightReportOut(BaseModel):
    id: str
    min_wall_violations_json: List[Dict[str, Any]]
    overhang_pct: float
    manifold: bool
    small_features_json: List[Dict[str, Any]]
    suggested_orientation_json: Dict[str, Any]
    score: int

    model_config = ConfigDict(from_attributes=True)

# Agents
class PrintabilityAgentRequest(BaseModel):
    upload_id: str

class QuoteExplainerRequest(BaseModel):
    quote_id: str
    target_budget: Optional[float] = None

class ParametricAgentRequest(BaseModel):
    part_id: str
    nl_request: str

class MeshRepairRequest(BaseModel):
    upload_id: str
