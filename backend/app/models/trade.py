from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Trade(Base):
    """Trade/category of work (e.g., Framing, Plumbing, Electrical)."""
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # Emoji or icon name
    order = Column(Integer, default=0)  # For custom ordering in UI
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    contractors = relationship("Contractor", back_populates="trade")


# Default trades to seed the database
DEFAULT_TRADES = [
    {"name": "General", "icon": "🏗️", "order": 1},
    {"name": "Framing", "icon": "🪵", "order": 2},
    {"name": "Concrete", "icon": "🧱", "order": 3},
    {"name": "Electrical", "icon": "⚡", "order": 4},
    {"name": "Plumbing", "icon": "🔧", "order": 5},
    {"name": "HVAC", "icon": "❄️", "order": 6},
    {"name": "Flooring", "icon": "🪨", "order": 7},
    {"name": "Painting", "icon": "🎨", "order": 8},
    {"name": "Drywall", "icon": "📐", "order": 9},
    {"name": "Roofing", "icon": "🏠", "order": 10},
    {"name": "Windows/Doors", "icon": "🚪", "order": 11},
    {"name": "Cabinets", "icon": "🗄️", "order": 12},
    {"name": "Countertops", "icon": "🪨", "order": 13},
    {"name": "Appliances", "icon": "🔌", "order": 14},
    {"name": "Landscaping", "icon": "🌳", "order": 15},
    {"name": "Insulation", "icon": "🧊", "order": 16},
    {"name": "Siding", "icon": "🏢", "order": 17},
    {"name": "Gutters", "icon": "💧", "order": 18},
    {"name": "Cleaning", "icon": "🧹", "order": 19},
]
