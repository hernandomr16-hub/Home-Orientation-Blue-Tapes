from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..database import get_db
from ..models.user import User
from ..models.contractor import Contractor, ProjectContractor, DEFAULT_TRADES
from ..models.project import Project
from ..schemas.contractor import (
    ContractorCreate, ContractorUpdate, ContractorResponse,
    ProjectContractorCreate, ProjectContractorResponse
)
from ..utils.auth import get_current_user, require_pm_or_admin

router = APIRouter(prefix="/api", tags=["Contractors"])


# ==================== Master Contractors ====================

@router.get("/contractors", response_model=List[ContractorResponse])
async def list_contractors(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    trade: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all contractors (master list)."""
    query = db.query(Contractor).filter(Contractor.is_active == 1)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Contractor.company.ilike(search_term)) | 
            (Contractor.contact_name.ilike(search_term))
        )
    
    # Note: JSON contains query varies by database
    # For SQLite, we'd need different approach
    
    contractors = query.offset(skip).limit(limit).all()
    return contractors


@router.get("/contractors/trades", response_model=List[str])
async def list_trades(current_user: User = Depends(get_current_user)):
    """Get list of default trades."""
    return DEFAULT_TRADES


@router.get("/contractors/{contractor_id}", response_model=ContractorResponse)
async def get_contractor(
    contractor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific contractor."""
    contractor = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return contractor


@router.post("/contractors", response_model=ContractorResponse, status_code=status.HTTP_201_CREATED)
async def create_contractor(
    contractor_data: ContractorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Create a new contractor."""
    contractor = Contractor(**contractor_data.model_dump())
    db.add(contractor)
    db.commit()
    db.refresh(contractor)
    return contractor


@router.patch("/contractors/{contractor_id}", response_model=ContractorResponse)
async def update_contractor(
    contractor_id: int,
    contractor_data: ContractorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Update a contractor."""
    contractor = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    update_data = contractor_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contractor, field, value)
    
    db.commit()
    db.refresh(contractor)
    return contractor


@router.delete("/contractors/{contractor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contractor(
    contractor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Soft delete a contractor."""
    contractor = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    contractor.is_active = 0
    db.commit()


# ==================== Project Contractors ====================

@router.get("/projects/{project_id}/contractors", response_model=List[ProjectContractorResponse])
async def list_project_contractors(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List contractors assigned to a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    assignments = db.query(ProjectContractor).filter(
        ProjectContractor.project_id == project_id
    ).options(joinedload(ProjectContractor.contractor)).all()
    
    return assignments


@router.post("/projects/{project_id}/contractors", response_model=ProjectContractorResponse, status_code=status.HTTP_201_CREATED)
async def assign_contractor_to_project(
    project_id: int,
    assignment_data: ProjectContractorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Assign a contractor to a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    contractor = db.query(Contractor).filter(Contractor.id == assignment_data.contractor_id).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    # Check if already assigned
    existing = db.query(ProjectContractor).filter(
        ProjectContractor.project_id == project_id,
        ProjectContractor.contractor_id == assignment_data.contractor_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Contractor already assigned to project")
    
    assignment = ProjectContractor(
        project_id=project_id,
        contractor_id=assignment_data.contractor_id,
        trades=assignment_data.trades,
        notes=assignment_data.notes
    )
    db.add(assignment)
    db.commit()
    
    # Reload with contractor
    assignment = db.query(ProjectContractor).filter(
        ProjectContractor.id == assignment.id
    ).options(joinedload(ProjectContractor.contractor)).first()
    
    return assignment


@router.patch("/projects/{project_id}/contractors/{assignment_id}", response_model=ProjectContractorResponse)
async def update_project_contractor(
    project_id: int,
    assignment_id: int,
    update_data: ProjectContractorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Update a project contractor assignment."""
    assignment = db.query(ProjectContractor).filter(
        ProjectContractor.id == assignment_id,
        ProjectContractor.project_id == project_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    assignment.trades = update_data.trades
    assignment.notes = update_data.notes
    db.commit()
    
    assignment = db.query(ProjectContractor).filter(
        ProjectContractor.id == assignment_id
    ).options(joinedload(ProjectContractor.contractor)).first()
    
    return assignment


@router.delete("/projects/{project_id}/contractors/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_contractor_from_project(
    project_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Remove a contractor from a project."""
    assignment = db.query(ProjectContractor).filter(
        ProjectContractor.id == assignment_id,
        ProjectContractor.project_id == project_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
