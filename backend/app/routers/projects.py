from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db
from ..models.user import User
from ..models.project import Project, ProjectStatus
from ..models.area import Area, DEFAULT_AREAS
from ..models.issue import Issue, IssueStatus, IssuePriority
from ..schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse, ProjectDashboard
)
from ..utils.auth import get_current_user, require_pm_or_admin

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    status: Optional[ProjectStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all projects with optional filters."""
    query = db.query(Project)
    
    if status:
        query = query.filter(Project.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Project.name.ilike(search_term)) | (Project.address.ilike(search_term))
        )
    
    total = query.count()
    projects = query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()
    
    return ProjectListResponse(items=projects, total=total)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/dashboard", response_model=ProjectDashboard)
async def get_project_dashboard(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project dashboard with issue counts."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get issue counts by status
    base_query = db.query(Issue).filter(Issue.project_id == project_id)
    
    total = base_query.count()
    open_count = base_query.filter(Issue.status == IssueStatus.OPEN).count()
    assigned_count = base_query.filter(Issue.status == IssueStatus.ASSIGNED).count()
    in_progress = base_query.filter(Issue.status == IssueStatus.IN_PROGRESS).count()
    ready_reinspect = base_query.filter(Issue.status == IssueStatus.READY_FOR_REINSPECT).count()
    closed_count = base_query.filter(Issue.status == IssueStatus.CLOSED).count()
    high_priority = base_query.filter(
        Issue.priority == IssuePriority.HIGH,
        Issue.status != IssueStatus.CLOSED
    ).count()
    
    return ProjectDashboard(
        project=ProjectResponse.model_validate(project),
        total_issues=total,
        open_issues=open_count,
        assigned_issues=assigned_count,
        in_progress_issues=in_progress,
        ready_for_reinspect=ready_reinspect,
        closed_issues=closed_count,
        high_priority_open=high_priority
    )


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    create_default_areas: bool = Query(True, description="Create default areas"),
    assign_all_contractors: bool = Query(True, description="Assign all existing contractors"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Create a new project with optional default areas and auto-assign contractors."""
    from ..models.contractor import Contractor, ProjectContractor
    
    db_project = Project(
        **project_data.model_dump(),
        owner_id=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Create default areas if requested
    if create_default_areas:
        for i, area_name in enumerate(DEFAULT_AREAS):
            area = Area(
                project_id=db_project.id,
                name=area_name,
                order=i,
                is_custom=0
            )
            db.add(area)
        db.commit()
    
    # Auto-assign all existing contractors if requested
    if assign_all_contractors:
        contractors = db.query(Contractor).filter(Contractor.is_active == 1).all()
        for contractor in contractors:
            project_contractor = ProjectContractor(
                project_id=db_project.id,
                contractor_id=contractor.id,
                trades=contractor.trades or []
            )
            db.add(project_contractor)
        db.commit()
    
    return db_project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Update a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Delete a project and all related data."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
