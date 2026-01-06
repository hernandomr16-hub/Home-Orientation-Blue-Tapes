from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


# Default areas that can be used as templates
DEFAULT_AREAS = [
    "Exterior",
    "Garage",
    "Living Room",
    "Kitchen",
    "Dining Room",
    "Hallway",
    "Master Bedroom",
    "Bedroom 2",
    "Bedroom 3",
    "Master Bathroom",
    "Bathroom 2",
    "Powder Room",
    "Laundry",
    "Attic/Crawlspace",
    "Mechanical/HVAC",
    "Electrical Panel",
    "Plumbing",
    "Roof",
]


class Area(Base):
    __tablename__ = "areas"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    order = Column(Integer, default=0)  # For sorting
    is_custom = Column(Integer, default=0)  # 1 if user-created
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="areas")
    issues = relationship("Issue", back_populates="area")
