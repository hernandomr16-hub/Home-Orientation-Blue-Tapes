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
        "description": "List of installed appliances",
        "item_schema": [
            {"name": "item", "label": "Item Name", "type": "text", "placeholder": "e.g. Refrigerator"},
            {"name": "brand", "label": "Brand", "type": "text"},
            {"name": "model", "label": "Model #", "type": "text"},
            {"name": "serial", "label": "Serial #", "type": "text"},
        ],
        "default_items": [
            {"item": "Refrigerator"},
            {"item": "Range/Stove"},
            {"item": "Dishwasher"},
            {"item": "Microwave"},
            {"item": "Washer"},
            {"item": "Dryer"},
            {"item": "Water Heater"},
        ]
    },
    {
        "id": "finishes",
        "title": "Finishes (Paint & Materials)",
        "type": "list",
        "description": "Paint codes and material specifications",
        "item_schema": [
            {"name": "area", "label": "Area/Surface", "type": "text", "placeholder": "e.g. Main Walls"},
            {"name": "brand", "label": "Brand", "type": "text"},
            {"name": "color", "label": "Color Name/Code", "type": "text"},
            {"name": "finish", "label": "Finish/Sheen", "type": "text", "placeholder": "e.g. Eggshell, Satin"},
        ],
        "default_items": [
            {"area": "Interior Walls (Main)", "brand": "Sherwin Williams", "finish": "Eggshell"},
            {"area": "Interior Trim", "brand": "Sherwin Williams", "finish": "Semi-Gloss"},
            {"area": "Ceilings", "brand": "Sherwin Williams", "finish": "Flat"},
            {"area": "Flooring (Main)", "brand": "", "finish": ""},
            {"area": "Kitchen Cabinets", "brand": "", "finish": ""},
            {"area": "Kitchen Countertops", "brand": "", "finish": ""},
        ]
    },
    {
        "id": "systems",
        "title": "Mechanical Systems",
        "type": "key_value",
        "description": "Technical details of home systems",
        "fields": [
            {"name": "hvac_system", "label": "HVAC System Type", "type": "text"},
            {"name": "filter_size", "label": "Air Filter Size", "type": "text"},
            {"name": "water_heater_type", "label": "Water Heater Type", "type": "text"},
            {"name": "water_shutoff_loc", "label": "Main Water Shutoff Location", "type": "text"},
            {"name": "breaker_panel_loc", "label": "Breaker Panel Location", "type": "text"},
            {"name": "garbage_pickup", "label": "Garbage Pickup Day", "type": "text"},
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
        "accepts": ["pdf", "jpg", "png"]
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
