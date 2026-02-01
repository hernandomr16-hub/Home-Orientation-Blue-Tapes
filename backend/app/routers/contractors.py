from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sql_func
from typing import List, Optional
from ..database import get_db
from ..models.user import User
from ..models.trade import Trade, DEFAULT_TRADES
from ..models.contractor import Contractor, ProjectContractor
from ..models.project import Project
from ..schemas.contractor import (
    TradeCreate, TradeUpdate, TradeResponse, TradeWithContractors,
    ContractorCreate, ContractorUpdate, ContractorResponse,
    ProjectContractorCreate, ProjectContractorResponse
)
from ..utils.auth import get_current_user, require_pm_or_admin

router = APIRouter(prefix="/api", tags=["Contractors"])


def build_contractor_response(contractor: Contractor, db: Session) -> dict:
    """Build a contractor response dict with trade_ids derived from trades names."""
    # Get all trades for lookup
    all_trades = {t.name: t for t in db.query(Trade).all()}
    
    # If contractor has trades (list of names), compute trade_ids
    trade_names = contractor.trades or []
    trade_ids = [all_trades[name].id for name in trade_names if name in all_trades]
    
    return {
        "id": contractor.id,
        "company": contractor.company,
        "contact_name": contractor.contact_name,
        "email": contractor.email,
        "phone": contractor.phone,
        "trade_id": contractor.trade_id,
        "trade_ids": trade_ids,
        "trades": trade_names,
        "notes": contractor.notes,
        "is_active": contractor.is_active,
        "created_at": contractor.created_at,
        "updated_at": contractor.updated_at,
        "trade": contractor.trade,
    }


# ==================== Trades ====================

@router.get("/trades", response_model=List[TradeResponse])
async def list_trades(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all trades/categories."""
    query = db.query(Trade)
    
    if not include_inactive:
        query = query.filter(Trade.is_active == 1)
    
    trades = query.order_by(Trade.order, Trade.name).all()
    
    # Build result - count contractors that have this trade in their trades array
    result = []
    for trade in trades:
        # Count contractors with this trade (via trade_id or via trades JSON array)
        contractor_count = 0
        try:
            # Count by trade_id relationship
            contractor_count = len([c for c in trade.contractors if c.is_active == 1]) if trade.contractors else 0
        except Exception:
            contractor_count = 0
        
        trade_dict = {
            "id": trade.id,
            "name": trade.name,
            "description": trade.description,
            "icon": trade.icon,
            "order": trade.order,
            "is_active": trade.is_active,
            "created_at": trade.created_at,
            "updated_at": trade.updated_at,
            "contractor_count": contractor_count
        }
        result.append(trade_dict)
    
    return result


@router.get("/trades/{trade_id}", response_model=TradeWithContractors)
async def get_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a trade with its contractors."""
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    # Build response with contractors
    contractors = [c for c in trade.contractors if c.is_active == 1]
    
    return {
        "id": trade.id,
        "name": trade.name,
        "description": trade.description,
        "icon": trade.icon,
        "order": trade.order,
        "is_active": trade.is_active,
        "created_at": trade.created_at,
        "updated_at": trade.updated_at,
        "contractor_count": len(contractors),
        "contractors": contractors
    }


@router.post("/trades", response_model=TradeResponse, status_code=status.HTTP_201_CREATED)
async def create_trade(
    trade_data: TradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Create a new trade/category."""
    # Check for duplicate name
    existing = db.query(Trade).filter(Trade.name.ilike(trade_data.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Trade with this name already exists")
    
    trade = Trade(**trade_data.model_dump())
    db.add(trade)
    db.commit()
    db.refresh(trade)
    
    return {
        **trade_data.model_dump(),
        "id": trade.id,
        "is_active": trade.is_active,
        "created_at": trade.created_at,
        "updated_at": trade.updated_at,
        "contractor_count": 0
    }


@router.patch("/trades/{trade_id}", response_model=TradeResponse)
async def update_trade(
    trade_id: int,
    trade_data: TradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Update a trade/category."""
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    update_data = trade_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trade, field, value)
    
    db.commit()
    db.refresh(trade)
    
    return {
        "id": trade.id,
        "name": trade.name,
        "description": trade.description,
        "icon": trade.icon,
        "order": trade.order,
        "is_active": trade.is_active,
        "created_at": trade.created_at,
        "updated_at": trade.updated_at,
        "contractor_count": len([c for c in trade.contractors if c.is_active == 1])
    }


@router.delete("/trades/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Soft delete a trade (deactivate)."""
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    trade.is_active = 0
    db.commit()


# ==================== Master Contractors ====================

@router.get("/contractors", response_model=List[ContractorResponse])
async def list_contractors(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    trade_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all contractors (master list)."""
    query = db.query(Contractor).options(joinedload(Contractor.trade)).filter(Contractor.is_active == 1)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Contractor.company.ilike(search_term)) | 
            (Contractor.contact_name.ilike(search_term))
        )
    
    if trade_id:
        # Filter by trade_id or by checking if trade name is in trades JSON
        trade = db.query(Trade).filter(Trade.id == trade_id).first()
        if trade:
            query = query.filter(
                (Contractor.trade_id == trade_id) | 
                (Contractor.trades.contains(trade.name))
            )
    
    contractors = query.offset(skip).limit(limit).all()
    return [build_contractor_response(c, db) for c in contractors]


@router.get("/contractors/trades", response_model=List[str])
async def list_trade_names(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get list of trade names (for backward compatibility)."""
    trades = db.query(Trade).filter(Trade.is_active == 1).order_by(Trade.order, Trade.name).all()
    return [t.name for t in trades]


@router.get("/contractors/{contractor_id}", response_model=ContractorResponse)
async def get_contractor(
    contractor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific contractor."""
    contractor = db.query(Contractor).options(joinedload(Contractor.trade)).filter(Contractor.id == contractor_id).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return build_contractor_response(contractor, db)


@router.post("/contractors", response_model=ContractorResponse, status_code=status.HTTP_201_CREATED)
async def create_contractor(
    contractor_data: ContractorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Create a new contractor."""
    data = contractor_data.model_dump(exclude={'trade_ids'})
    
    # If trade_ids provided, convert to trade names
    if contractor_data.trade_ids:
        trades = db.query(Trade).filter(Trade.id.in_(contractor_data.trade_ids)).all()
        data['trades'] = [t.name for t in trades]
        # Set primary trade_id to first one
        if trades:
            data['trade_id'] = trades[0].id
    
    contractor = Contractor(**data)
    db.add(contractor)
    db.commit()
    db.refresh(contractor)
    
    # Reload with trade
    contractor = db.query(Contractor).options(joinedload(Contractor.trade)).filter(Contractor.id == contractor.id).first()
    return build_contractor_response(contractor, db)


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
    
    update_data = contractor_data.model_dump(exclude_unset=True, exclude={'trade_ids'})
    
    # If trade_ids provided, convert to trade names
    if contractor_data.trade_ids is not None:
        trades = db.query(Trade).filter(Trade.id.in_(contractor_data.trade_ids)).all()
        update_data['trades'] = [t.name for t in trades]
        # Set primary trade_id to first one
        if trades:
            update_data['trade_id'] = trades[0].id
    
    for field, value in update_data.items():
        setattr(contractor, field, value)
    
    db.commit()
    db.refresh(contractor)
    
    # Reload with trade
    contractor = db.query(Contractor).options(joinedload(Contractor.trade)).filter(Contractor.id == contractor.id).first()
    return build_contractor_response(contractor, db)


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
    ).options(
        joinedload(ProjectContractor.contractor).joinedload(Contractor.trade)
    ).all()
    
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
    
    # Reload with contractor and trade
    assignment = db.query(ProjectContractor).filter(
        ProjectContractor.id == assignment.id
    ).options(
        joinedload(ProjectContractor.contractor).joinedload(Contractor.trade)
    ).first()
    
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
    ).options(
        joinedload(ProjectContractor.contractor).joinedload(Contractor.trade)
    ).first()
    
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
