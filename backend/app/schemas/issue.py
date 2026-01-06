from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from ..models.issue import IssuePriority, IssueStatus, PhotoType


class IssuePhotoCreate(BaseModel):
    url: str
    filename: Optional[str] = None
    photo_type: PhotoType = PhotoType.BEFORE


class IssuePhotoResponse(BaseModel):
    id: int
    issue_id: int
    url: str
    filename: Optional[str] = None
    photo_type: PhotoType
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class IssueBase(BaseModel):
    area_id: int
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    priority: IssuePriority = IssuePriority.MEDIUM
    trade: Optional[str] = None
    contractor_id: Optional[int] = None
    due_date: Optional[date] = None


class IssueCreate(IssueBase):
    project_id: Optional[int] = None  # Can be set from path


class IssueUpdate(BaseModel):
    area_id: Optional[int] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[IssuePriority] = None
    trade: Optional[str] = None
    contractor_id: Optional[int] = None
    due_date: Optional[date] = None


class IssueStatusUpdate(BaseModel):
    status: IssueStatus
    notes: Optional[str] = None


class IssueResponse(IssueBase):
    id: int
    project_id: int
    status: IssueStatus
    resolution_notes: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    closed_by: Optional[int] = None
    closed_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    notification_sent_at: Optional[datetime] = None
    photos: List[IssuePhotoResponse] = []
    
    # Nested info
    area_name: Optional[str] = None
    contractor_name: Optional[str] = None
    creator_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class IssueListResponse(BaseModel):
    items: List[IssueResponse]
    total: int
