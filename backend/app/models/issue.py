from sqlalchemy import Column, Integer, String, Text, Date, Enum as SqlEnum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class IssuePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class IssueStatus(str, enum.Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    READY_FOR_REINSPECT = "ready_for_reinspect"
    CLOSED = "closed"


class PhotoType(str, enum.Enum):
    BEFORE = "before"
    AFTER = "after"


# Issue categories
DEFAULT_CATEGORIES = [
    "Finish/Cosmetic",
    "Functional",
    "Safety",
    "Incomplete",
    "Damage",
    "Cleaning",
    "Touch-up",
    "Adjustment",
    "Missing Item",
    "Other",
]


class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)
    
    # Issue details
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    priority = Column(SqlEnum(IssuePriority), default=IssuePriority.MEDIUM, nullable=False)
    status = Column(SqlEnum(IssueStatus), default=IssueStatus.OPEN, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    
    # Assignment
    trade = Column(String(100), nullable=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True)
    
    # Dates
    due_date = Column(Date, nullable=True)
    
    # Tracking
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Notification tracking
    notification_sent_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="issues")
    area = relationship("Area", back_populates="issues")
    contractor = relationship("Contractor", back_populates="issues")
    creator = relationship("User", back_populates="created_issues", foreign_keys=[created_by])
    closer = relationship("User", back_populates="closed_issues", foreign_keys=[closed_by])
    photos = relationship("IssuePhoto", back_populates="issue", cascade="all, delete-orphan")


class IssuePhoto(Base):
    __tablename__ = "issue_photos"
    
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(500), nullable=False)
    filename = Column(String(255), nullable=True)
    photo_type = Column(SqlEnum(PhotoType), default=PhotoType.BEFORE, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    issue = relationship("Issue", back_populates="photos")
