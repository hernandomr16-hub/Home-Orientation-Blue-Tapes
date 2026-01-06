from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from ..database import get_db
from ..models.user import User
from ..models.project import Project
from ..models.issue import Issue, IssueStatus
from ..services.pdf_service import get_pdf_service, PDFService
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/projects/{project_id}/reports", tags=["Reports"])


@router.get("/punch-list")
async def export_punch_list_pdf(
    project_id: int,
    group_by: str = Query("area", enum=["area", "trade", "priority"]),
    status: Optional[IssueStatus] = None,
    include_closed: bool = Query(False, description="Include closed issues"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Export punch list as PDF."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Build query
    query = db.query(Issue).filter(Issue.project_id == project_id)
    
    if status:
        query = query.filter(Issue.status == status)
    elif not include_closed:
        query = query.filter(Issue.status != IssueStatus.CLOSED)
    
    issues = query.options(
        joinedload(Issue.area),
        joinedload(Issue.contractor)
    ).all()
    
    # Generate PDF
    pdf_bytes = pdf_service.generate_punch_list_pdf(
        project=project,
        issues=issues,
        group_by=group_by
    )
    
    filename = f"punch_list_{project.name.replace(' ', '_')}_{group_by}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
