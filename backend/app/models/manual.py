from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class ManualTemplate(Base):
    """Template for Home Owner Manual - can be versioned."""
    __tablename__ = "manual_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    version = Column(String(50), default="1.0")
    sections = Column(JSON, default=list)
    """
    sections structure:
    [
        {
            "id": "contacts",
            "title": "Important Contacts",
            "type": "contacts",  # contacts, locations, checklist, documents, text
            "fields": [...]
        },
        ...
    ]
    """
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# Default template sections
DEFAULT_MANUAL_SECTIONS = [
    {
        "id": "contacts",
        "title": "Important Contacts",
        "type": "contacts",
        "description": "Key contacts for your home",
        "fields": [
            {"name": "builder", "label": "Builder/GC", "type": "contact"},
            {"name": "electrician", "label": "Electrician", "type": "contact"},
            {"name": "plumber", "label": "Plumber", "type": "contact"},
            {"name": "hvac", "label": "HVAC", "type": "contact"},
            {"name": "hoa", "label": "HOA", "type": "contact"},
            {"name": "utility_electric", "label": "Electric Utility", "type": "contact"},
            {"name": "utility_water", "label": "Water Utility", "type": "contact"},
            {"name": "utility_gas", "label": "Gas Utility", "type": "contact"},
            {"name": "internet", "label": "Internet/Cable", "type": "contact"},
        ]
    },
    {
        "id": "appliances",
        "title": "Appliances",
        "type": "list",
        "description": "List of installed appliances - take photos of serial labels",
        "item_schema": [
            {"name": "item", "label": "Item Name", "type": "text", "placeholder": "e.g. Refrigerator"},
            {"name": "brand", "label": "Brand", "type": "text"},
            {"name": "model", "label": "Model #", "type": "text"},
            {"name": "serial", "label": "Serial #", "type": "text"},
            {"name": "install_date", "label": "Install Date", "type": "date"},
            {"name": "photo_url", "label": "Photo (Serial Label)", "type": "photo"},
        ],
        "default_items": [
            {"item": "Refrigerator", "example": "Ej: Manual nevera, etiqueta serial"},
            {"item": "Range/Stove", "example": "Ej: Manual estufa, etiqueta serial"},
            {"item": "Dishwasher", "example": "Ej: Manual lavaplatos"},
            {"item": "Microwave", "example": "Ej: Manual microondas"},
            {"item": "Washer", "example": "Ej: Manual lavadora"},
            {"item": "Dryer", "example": "Ej: Manual secadora"},
            {"item": "Water Heater", "example": "Ej: Etiqueta calentador de agua"},
        ]
    },
    {
        "id": "finishes",
        "title": "Color Palette",
        "type": "color_palette",
        "description": "Paint colors used in your home - upload a photo of the color palette",
        "photo_field": "palette_photo",
        "colors": [
            {"area": "Walls (Main)", "color_name": "", "color_code": ""},
            {"area": "Walls (Accent)", "color_name": "", "color_code": ""},
            {"area": "Trim/Molding", "color_name": "", "color_code": ""},
            {"area": "Ceilings", "color_name": "", "color_code": ""},
            {"area": "Cabinets", "color_name": "", "color_code": ""},
            {"area": "Exterior", "color_name": "", "color_code": ""},
        ]
    },
    {
        "id": "systems",
        "title": "Mechanical Systems",
        "type": "list",
        "description": "Technical details of home systems - take photos of serial labels",
        "item_schema": [
            {"name": "name", "label": "System Name", "type": "text"},
            {"name": "details", "label": "Details/Notes", "type": "text"},
            {"name": "photo_url", "label": "Photo", "type": "photo"},
        ],
        "default_items": [
            {"name": "HVAC System", "details": "", "photo_url": "", "example": "Ej: Etiqueta unidad A/C"},
            {"name": "Water Heater", "details": "", "photo_url": "", "example": "Ej: Etiqueta serial calentador"},
            {"name": "Breaker Panel", "details": "", "photo_url": "", "example": "Ej: Foto panel el\u00e9ctrico"},
            {"name": "Main Water Shutoff", "details": "", "photo_url": "", "example": "Ej: Ubicaci\u00f3n llave principal"},
            {"name": "Air Filter", "details": "", "photo_url": "", "example": "Ej: Foto tama\u00f1o filtro"},
            {"name": "Thermostat", "details": "", "photo_url": "", "example": "Ej: Manual termostato"},
        ]
    },
    {
        "id": "maintenance",
        "title": "Maintenance Checklist",
        "type": "checklist",
        "description": "Regular maintenance tasks",
        "items": [
            {"task": "Replace HVAC filter", "frequency": "Every 1-3 months"},
            {"task": "Test smoke/CO detectors", "frequency": "Monthly"},
            {"task": "Clean gutters", "frequency": "Twice yearly"},
            {"task": "Service HVAC", "frequency": "Annually"},
            {"task": "Flush water heater", "frequency": "Annually"},
            {"task": "Check roof for damage", "frequency": "Annually"},
            {"task": "Inspect caulking (bathrooms/windows)", "frequency": "Annually"},
            {"task": "Test GFCIs", "frequency": "Monthly"},
            {"task": "Winterize hose bibs", "frequency": "Annually (Fall)"},
        ]
    },
    {
        "id": "warranties",
        "title": "Warranties & Documents",
        "type": "documents",
        "description": "Important warranties and documentation",
        "accepts": ["pdf", "jpg", "png"],
        "location_field": {
            "name": "physical_location",
            "label": "Physical Document Location",
            "placeholder": "e.g. Kitchen drawer, Filing cabinet"
        }
    },
    {
        "id": "notes",
        "title": "Additional Notes",
        "type": "text",
        "description": "Any additional information for the homeowner"
    }
]


class ManualInstance(Base):
    """Filled-out manual for a specific project."""
    __tablename__ = "manual_instances"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    template_id = Column(Integer, ForeignKey("manual_templates.id"), nullable=True)
    
    # Field values filled by user
    fields = Column(JSON, default=dict)
    """
    fields structure:
    {
        "contacts": {
            "builder": {"name": "ABC Builders", "phone": "555-1234", "email": "..."},
            ...
        },
        "locations": {
            "main_water_shutoff": {"description": "In garage, left wall", "photo": "url"},
            ...
        },
        ...
    }
    """
    
    # Attachments (warranty docs, etc.)
    attachments = Column(JSON, default=list)
    """
    attachments structure:
    [
        {"section": "warranties", "name": "HVAC Warranty", "url": "...", "type": "pdf"},
        ...
    ]
    """
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="manual_instance")
    template = relationship("ManualTemplate")
