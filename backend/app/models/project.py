from sqlalchemy import Column, Integer, String, Text, Date, Enum as SqlEnum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    DELIVERED = "delivered"
    ARCHIVED = "archived"


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    unit = Column(String(100), nullable=True)  # Unit/Lot if applicable
    status = Column(SqlEnum(ProjectStatus), default=ProjectStatus.ACTIVE, nullable=False)
    close_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    areas = relationship("Area", back_populates="project", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="project", cascade="all, delete-orphan")
    contractors = relationship("ProjectContractor", back_populates="project", cascade="all, delete-orphan")
    manual_instance = relationship("ManualInstance", back_populates="project", uselist=False, cascade="all, delete-orphan")
