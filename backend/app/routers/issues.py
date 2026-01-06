from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models.user import User
from ..models.project import Project
from ..models.area import Area
from ..models.contractor import Contractor
from ..models.issue import Issue, IssuePhoto, IssueStatus, IssuePriority, PhotoType, DEFAULT_CATEGORIES
from ..schemas.issue import (
    IssueCreate, IssueUpdate, IssueResponse, IssueListResponse,
    IssuePhotoResponse, IssueStatusUpdate
)
from ..utils.auth import get_current_user, require_pm_or_admin
from ..services.storage_service import get_storage_service, StorageService

router = APIRouter(prefix="/api/projects/{project_id}/issues", tags=["Issues"])


def get_project_or_404(project_id: int, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def enrich_issue_response(issue: Issue) -> dict:
    """Add computed fields to issue response."""
    data = {
        "id": issue.id,
        "project_id": issue.project_id,
        "area_id": issue.area_id,
        "category": issue.category,
        "subcategory": issue.subcategory,
        "description": issue.description,
        "priority": issue.priority,
        "status": issue.status,
        "resolution_notes": issue.resolution_notes,
        "trade": issue.trade,
        "contractor_id": issue.contractor_id,
        "due_date": issue.due_date,
        "created_by": issue.created_by,
        "created_at": issue.created_at,
        "closed_by": issue.closed_by,
        "closed_at": issue.closed_at,
        "updated_at": issue.updated_at,
        "notification_sent_at": issue.notification_sent_at,
        "photos": [IssuePhotoResponse.model_validate(p) for p in issue.photos],
        "area_name": issue.area.name if issue.area else None,
        "contractor_name": issue.contractor.company if issue.contractor else None,
        "creator_name": issue.creator.name if issue.creator else None,
    }
    return data


@router.get("/categories", response_model=List[str])
async def list_categories(current_user: User = Depends(get_current_user)):
    """Get list of default issue categories."""
    return DEFAULT_CATEGORIES


@router.get("/", response_model=IssueListResponse)
async def list_issues(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[IssueStatus] = None,
    priority: Optional[IssuePriority] = None,
    area_id: Optional[int] = None,
    contractor_id: Optional[int] = None,
    trade: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List issues for a project with filters."""
    get_project_or_404(project_id, db)
    
    query = db.query(Issue).filter(Issue.project_id == project_id)
    
    if status:
        query = query.filter(Issue.status == status)
    if priority:
        query = query.filter(Issue.priority == priority)
    if area_id:
        query = query.filter(Issue.area_id == area_id)
    if contractor_id:
        query = query.filter(Issue.contractor_id == contractor_id)
    if trade:
        query = query.filter(Issue.trade == trade)
    
    total = query.count()
    
    issues = query.options(
        joinedload(Issue.area),
        joinedload(Issue.contractor),
        joinedload(Issue.creator),
        joinedload(Issue.photos)
    ).order_by(Issue.created_at.desc()).offset(skip).limit(limit).all()
    
    items = [IssueResponse(**enrich_issue_response(issue)) for issue in issues]
    
    return IssueListResponse(items=items, total=total)


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(
    project_id: int,
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific issue."""
    get_project_or_404(project_id, db)
    
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.project_id == project_id
    ).options(
        joinedload(Issue.area),
        joinedload(Issue.contractor),
        joinedload(Issue.creator),
        joinedload(Issue.photos)
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    return IssueResponse(**enrich_issue_response(issue))


@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    project_id: int,
    issue_data: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Create a new issue."""
    get_project_or_404(project_id, db)
    
    # Validate area exists
    area = db.query(Area).filter(Area.id == issue_data.area_id, Area.project_id == project_id).first()
    if not area:
        raise HTTPException(status_code=400, detail="Invalid area for this project")
    
    # Validate contractor if provided
    if issue_data.contractor_id:
        contractor = db.query(Contractor).filter(Contractor.id == issue_data.contractor_id).first()
        if not contractor:
            raise HTTPException(status_code=400, detail="Contractor not found")
    
    # Determine initial status
    initial_status = IssueStatus.ASSIGNED if issue_data.contractor_id else IssueStatus.OPEN
    
    issue = Issue(
        project_id=project_id,
        area_id=issue_data.area_id,
        category=issue_data.category,
        subcategory=issue_data.subcategory,
        description=issue_data.description,
        priority=issue_data.priority,
        trade=issue_data.trade,
        contractor_id=issue_data.contractor_id,
        due_date=issue_data.due_date,
        status=initial_status,
        created_by=current_user.id
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    
    # Reload with relationships
    issue = db.query(Issue).filter(Issue.id == issue.id).options(
        joinedload(Issue.area),
        joinedload(Issue.contractor),
        joinedload(Issue.creator),
        joinedload(Issue.photos)
    ).first()
    
    return IssueResponse(**enrich_issue_response(issue))


@router.patch("/{issue_id}", response_model=IssueResponse)
async def update_issue(
    project_id: int,
    issue_id: int,
    issue_data: IssueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Update an issue."""
    get_project_or_404(project_id, db)
    
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.project_id == project_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    update_data = issue_data.model_dump(exclude_unset=True)
    
    # Validate area if being updated
    if "area_id" in update_data:
        area = db.query(Area).filter(
            Area.id == update_data["area_id"],
            Area.project_id == project_id
        ).first()
        if not area:
            raise HTTPException(status_code=400, detail="Invalid area for this project")
    
    for field, value in update_data.items():
        setattr(issue, field, value)
    
    db.commit()
    
    # Reload with relationships
    issue = db.query(Issue).filter(Issue.id == issue.id).options(
        joinedload(Issue.area),
        joinedload(Issue.contractor),
        joinedload(Issue.creator),
        joinedload(Issue.photos)
    ).first()
    
    return IssueResponse(**enrich_issue_response(issue))


@router.patch("/{issue_id}/status", response_model=IssueResponse)
async def update_issue_status(
    project_id: int,
    issue_id: int,
    status_data: IssueStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Update issue status."""
    get_project_or_404(project_id, db)
    
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.project_id == project_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # If closing, require at least one "after" photo
    if status_data.status == IssueStatus.CLOSED:
        after_photos = [p for p in issue.photos if p.photo_type == PhotoType.AFTER]
        if not after_photos:
            raise HTTPException(
                status_code=400,
                detail="Cannot close issue without at least one 'after' photo"
            )
        issue.closed_by = current_user.id
        issue.closed_at = datetime.utcnow()
    
    if status_data.notes:
        issue.resolution_notes = status_data.notes
    
    issue.status = status_data.status
    db.commit()
    
    # Reload with relationships
    issue = db.query(Issue).filter(Issue.id == issue.id).options(
        joinedload(Issue.area),
        joinedload(Issue.contractor),
        joinedload(Issue.creator),
        joinedload(Issue.photos)
    ).first()
    
    return IssueResponse(**enrich_issue_response(issue))


@router.post("/{issue_id}/photos", response_model=IssuePhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_issue_photo(
    project_id: int,
    issue_id: int,
    photo_type: PhotoType = Query(PhotoType.BEFORE),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin),
    storage: StorageService = Depends(get_storage_service)
):
    """Upload a photo to an issue."""
    get_project_or_404(project_id, db)
    
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.project_id == project_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Check photo limit
    existing_photos = db.query(IssuePhoto).filter(IssuePhoto.issue_id == issue_id).count()
    if existing_photos >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 photos per issue")
    
    # Save photo
    result = await storage.save_photo(file, project_id, issue_id)
    
    # Create database record
    photo = IssuePhoto(
        issue_id=issue_id,
        url=result["url"],
        filename=result["filename"],
        photo_type=photo_type
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    
    return photo


@router.delete("/{issue_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue_photo(
    project_id: int,
    issue_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin),
    storage: StorageService = Depends(get_storage_service)
):
    """Delete a photo from an issue."""
    get_project_or_404(project_id, db)
    
    photo = db.query(IssuePhoto).filter(
        IssuePhoto.id == photo_id,
        IssuePhoto.issue_id == issue_id
    ).first()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Delete file
    storage.delete_file(photo.url)
    
    # Delete record
    db.delete(photo)
    db.commit()


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue(
    project_id: int,
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin),
    storage: StorageService = Depends(get_storage_service)
):
    """Delete an issue and its photos."""
    get_project_or_404(project_id, db)
    
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.project_id == project_id
    ).options(joinedload(Issue.photos)).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Delete all photos
    for photo in issue.photos:
        storage.delete_file(photo.url)
    
    db.delete(issue)
    db.commit()
