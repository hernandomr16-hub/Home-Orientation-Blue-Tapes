from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.area import Area
from ..models.project import Project
from ..schemas.area import AreaCreate, AreaUpdate, AreaResponse
from ..utils.auth import get_current_user, require_pm_or_admin

router = APIRouter(prefix="/api/projects/{project_id}/areas", tags=["Areas"])


def get_project_or_404(project_id: int, db: Session) -> Project:
    """Helper to get project or raise 404."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=List[AreaResponse])
async def list_areas(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all areas for a project."""
    get_project_or_404(project_id, db)
    areas = db.query(Area).filter(Area.project_id == project_id).order_by(Area.order).all()
    return areas


@router.get("/{area_id}", response_model=AreaResponse)
async def get_area(
    project_id: int,
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific area."""
    get_project_or_404(project_id, db)
    area = db.query(Area).filter(Area.id == area_id, Area.project_id == project_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    return area


@router.post("/", response_model=AreaResponse, status_code=status.HTTP_201_CREATED)
async def create_area(
    project_id: int,
    area_data: AreaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Create a new custom area."""
    get_project_or_404(project_id, db)
    
    # Get max order
    max_order = db.query(Area).filter(Area.project_id == project_id).count()
    
    area = Area(
        project_id=project_id,
        name=area_data.name,
        order=area_data.order if area_data.order else max_order,
        is_custom=1
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    return area


@router.patch("/{area_id}", response_model=AreaResponse)
async def update_area(
    project_id: int,
    area_id: int,
    area_data: AreaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Update an area."""
    get_project_or_404(project_id, db)
    area = db.query(Area).filter(Area.id == area_id, Area.project_id == project_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    update_data = area_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(area, field, value)
    
    db.commit()
    db.refresh(area)
    return area


@router.delete("/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_area(
    project_id: int,
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Delete an area."""
    get_project_or_404(project_id, db)
    area = db.query(Area).filter(Area.id == area_id, Area.project_id == project_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    db.delete(area)
    db.commit()


@router.post("/reorder", response_model=List[AreaResponse])
async def reorder_areas(
    project_id: int,
    area_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Reorder areas by providing list of area IDs in desired order."""
    get_project_or_404(project_id, db)
    
    for i, area_id in enumerate(area_ids):
        area = db.query(Area).filter(Area.id == area_id, Area.project_id == project_id).first()
        if area:
            area.order = i
    
    db.commit()
    
    areas = db.query(Area).filter(Area.project_id == project_id).order_by(Area.order).all()
    return areas
