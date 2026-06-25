import datetime
from sqlalchemy import Boolean, Column, Float, Integer, String, JSON, DateTime, ForeignKey, Enum
import enum
from .database import Base

class Material(Base):
    __tablename__ = "materials"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    process = Column(String)
    density_g_cm3 = Column(Float)
    rate_per_cm3 = Column(Float)
    machine_rate_per_min = Column(Float)
    min_wall_mm = Column(Float)
    max_bbox_mm = Column(Float)
    colors_json = Column(JSON)
    finishes_json = Column(JSON)

class CatalogPart(Base):
    __tablename__ = "catalog_parts"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    base_mesh_ref = Column(String, nullable=True)
    blurb = Column(String, nullable=True)
    params_schema_json = Column(JSON)
    presets_json = Column(JSON)
    thumb = Column(String, nullable=True)

class ModelUpload(Base):
    __tablename__ = "model_uploads"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    filename = Column(String)
    format = Column(String)
    volume_cm3 = Column(Float)
    bbox_json = Column(JSON)
    surface_cm2 = Column(Float)
    manifold = Column(Boolean)
    issues_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class QuoteSource(str, enum.Enum):
    catalog = "catalog"
    upload = "upload"

class Quote(Base):
    __tablename__ = "quotes"
    id = Column(String, primary_key=True, index=True)
    source = Column(Enum(QuoteSource))
    part_id = Column(String, ForeignKey("catalog_parts.id"), nullable=True)
    upload_id = Column(String, ForeignKey("model_uploads.id"), nullable=True)
    material_id = Column(String, ForeignKey("materials.id"))
    params_json = Column(JSON, nullable=True)
    infill_pct = Column(Integer)
    layer_height_mm = Column(Float)
    finish = Column(String)
    volume_cm3 = Column(Float)
    support_cm3 = Column(Float)
    est_minutes = Column(Integer)
    breakdown_json = Column(JSON)
    total = Column(Float)
    currency = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PreflightReport(Base):
    __tablename__ = "preflight_reports"
    id = Column(String, primary_key=True, index=True)
    quote_id = Column(String, ForeignKey("quotes.id"))
    min_wall_violations_json = Column(JSON)
    overhang_pct = Column(Float)
    manifold = Column(Boolean)
    small_features_json = Column(JSON)
    suggested_orientation_json = Column(JSON)
    score = Column(Integer)

class OrderStatus(str, enum.Enum):
    review = "review"
    printing = "printing"
    shipped = "shipped"
    done = "done"

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    items_json = Column(JSON)
    status = Column(Enum(OrderStatus), default=OrderStatus.review)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id = Column(String, primary_key=True, index=True)
    agent = Column(String)
    input_json = Column(JSON)
    tool_calls_json = Column(JSON)
    output_json = Column(JSON)
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
