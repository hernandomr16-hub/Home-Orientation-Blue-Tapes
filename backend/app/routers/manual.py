from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.user import User
from ..models.project import Project
from ..models.manual import ManualTemplate, ManualInstance, DEFAULT_MANUAL_SECTIONS
from ..schemas.manual import (
    ManualTemplateResponse, ManualInstanceCreate, ManualInstanceUpdate, ManualInstanceResponse
)
from ..services.pdf_service import get_pdf_service, PDFService
from ..services.storage_service import get_storage_service, StorageService
from ..utils.auth import get_current_user, require_pm_or_admin

router = APIRouter(prefix="/api", tags=["Home Owner Manual"])


# ==================== Templates ====================

@router.get("/manual-templates", response_model=List[ManualTemplateResponse])
async def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List available manual templates."""
    templates = db.query(ManualTemplate).filter(ManualTemplate.is_active == 1).all()
    return templates


@router.get("/manual-templates/default-sections")
async def get_default_sections(current_user: User = Depends(get_current_user)):
    """Get the default manual sections structure."""
    return DEFAULT_MANUAL_SECTIONS


# ==================== Project Manual Instance ====================

@router.get("/projects/{project_id}/manual", response_model=ManualInstanceResponse)
async def get_project_manual(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the manual instance for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    manual = db.query(ManualInstance).filter(ManualInstance.project_id == project_id).first()
    
    if not manual:
        # Create empty instance
        manual = ManualInstance(
            project_id=project_id,
            fields={},
            attachments=[]
        )
        db.add(manual)
        db.commit()
        db.refresh(manual)
    
    return manual


@router.put("/projects/{project_id}/manual", response_model=ManualInstanceResponse)
async def update_project_manual(
    project_id: int,
    manual_data: ManualInstanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin)
):
    """Update the manual instance for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    manual = db.query(ManualInstance).filter(ManualInstance.project_id == project_id).first()
    
    if not manual:
        manual = ManualInstance(
            project_id=project_id,
            fields=manual_data.fields or {},
            attachments=manual_data.attachments or []
        )
        db.add(manual)
    else:
        if manual_data.fields is not None:
            manual.fields = manual_data.fields
        if manual_data.attachments is not None:
            manual.attachments = manual_data.attachments
    
    db.commit()
    db.refresh(manual)
    return manual


@router.post("/projects/{project_id}/manual/attachments")
async def upload_manual_attachment(
    project_id: int,
    section: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin),
    storage: StorageService = Depends(get_storage_service)
):
    """Upload an attachment to the manual."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Save file
    result = await storage.save_document(file, project_id)
    
    # Get or create manual instance
    manual = db.query(ManualInstance).filter(ManualInstance.project_id == project_id).first()
    if not manual:
        manual = ManualInstance(project_id=project_id, fields={}, attachments=[])
        db.add(manual)
    
    # Add attachment
    attachment = {
        "section": section,
        "name": file.filename,
        "url": result["url"],
        "type": file.content_type
    }
    
    attachments = list(manual.attachments) if manual.attachments else []
    attachments.append(attachment)
    manual.attachments = attachments
    
    db.commit()
    
    return attachment


@router.get("/projects/{project_id}/manual/export")
async def export_manual_pdf(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Export the home owner manual as PDF."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    manual = db.query(ManualInstance).filter(ManualInstance.project_id == project_id).first()
    
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not configured for this project")
    
    # Generate PDF
    pdf_bytes = pdf_service.generate_home_owner_manual_pdf(
        project=project,
        manual_data=manual.fields or {},
        attachments=manual.attachments or []
    )
    
    filename = f"home_owner_manual_{project.name.replace(' ', '_')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
