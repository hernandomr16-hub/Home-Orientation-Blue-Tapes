from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from ..models.project import ProjectStatus


class ProjectBase(BaseModel):
    name: str
    address: str
    unit: Optional[str] = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    close_date: Optional[date] = None
    notes: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    unit: Optional[str] = None
    status: Optional[ProjectStatus] = None
    close_date: Optional[date] = None
    notes: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    owner_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    items: List[ProjectResponse]
    total: int


class ProjectDashboard(BaseModel):
    project: ProjectResponse
    total_issues: int
    open_issues: int
    assigned_issues: int
    in_progress_issues: int
    ready_for_reinspect: int
    closed_issues: int
    high_priority_open: int
