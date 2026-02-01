from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Contractor(Base):
    """Master contractor record - belongs to a trade category."""
    __tablename__ = "contractors"
    
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="SET NULL"), nullable=True)
    trades = Column(JSON, default=list)  # DEPRECATED: kept for backward compatibility
    notes = Column(Text, nullable=True)  # Access hours, rules, etc.
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    trade = relationship("Trade", back_populates="contractors")
    project_assignments = relationship("ProjectContractor", back_populates="contractor")
    issues = relationship("Issue", back_populates="contractor")


class ProjectContractor(Base):
    """Association table linking contractors to projects with project-specific trades."""
    __tablename__ = "project_contractors"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False)
    trades = Column(JSON, default=list)  # Trades assigned for THIS project
    notes = Column(Text, nullable=True)  # Project-specific notes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="contractors")
    contractor = relationship("Contractor", back_populates="project_assignments")
