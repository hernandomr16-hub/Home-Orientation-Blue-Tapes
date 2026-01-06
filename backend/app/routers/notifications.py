from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models.user import User
from ..models.project import Project
from ..models.issue import Issue
from ..models.contractor import Contractor
from ..services.notification_service import get_notification_service, NotificationService
from ..utils.auth import get_current_user, require_pm_or_admin

router = APIRouter(prefix="/api/projects/{project_id}/issues/{issue_id}/notify", tags=["Notifications"])


@router.post("/")
async def send_issue_notification(
    project_id: int,
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pm_or_admin),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Send or resend notification to contractor about an issue."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.project_id == project_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    if not issue.contractor_id:
        raise HTTPException(status_code=400, detail="Issue has no contractor assigned")
    
    contractor = db.query(Contractor).filter(Contractor.id == issue.contractor_id).first()
    if not contractor:
        raise HTTPException(status_code=400, detail="Contractor not found")
    
    if not contractor.email and not contractor.phone:
        raise HTTPException(status_code=400, detail="Contractor has no email or phone configured")
    
    # Get photo URLs
    photo_urls = [p.url for p in issue.photos]
    
    # Send notification
    result = await notification_service.send_issue_notification(
        contractor_email=contractor.email,
        contractor_phone=contractor.phone,
        project_name=project.name,
        project_address=project.address,
        area_name=issue.area.name if issue.area else "Unknown",
        issue_description=issue.description or "",
        priority=issue.priority.value if issue.priority else "medium",
        issue_id=issue.id,
        photo_urls=photo_urls
    )
    
    # Update issue notification timestamp
    issue.notification_sent_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": "Notification sent",
        "results": result
    }
