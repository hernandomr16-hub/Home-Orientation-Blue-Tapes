from typing import Optional
from datetime import datetime
from ..config import get_settings

settings = get_settings()


class NotificationService:
    """Service for sending notifications to contractors via email/SMS."""
    
    def __init__(self):
        self.sendgrid_enabled = bool(settings.sendgrid_api_key)
        self.twilio_enabled = bool(settings.twilio_account_sid and settings.twilio_auth_token)
    
    async def send_issue_notification(
        self,
        contractor_email: Optional[str],
        contractor_phone: Optional[str],
        project_name: str,
        project_address: str,
        area_name: str,
        issue_description: str,
        priority: str,
        issue_id: int,
        photo_urls: list[str] = []
    ) -> dict:
        """Send notification to contractor about new/updated issue."""
        results = {"email": None, "sms": None}
        
        # Build message content
        subject = f"[{priority.upper()}] New Issue - {project_name}"
        
        message = f"""
New issue assigned to you:

Project: {project_name}
Address: {project_address}
Area: {area_name}
Priority: {priority.upper()}

Description:
{issue_description or 'No description provided'}

Issue ID: #{issue_id}

Please address this issue at your earliest convenience.
        """.strip()
        
        # Send email if available
        if contractor_email and self.sendgrid_enabled:
            try:
                results["email"] = await self._send_email(
                    to=contractor_email,
                    subject=subject,
                    body=message,
                    photo_urls=photo_urls
                )
            except Exception as e:
                results["email"] = {"error": str(e)}
        
        # Send SMS if available
        if contractor_phone and self.twilio_enabled:
            try:
                # Shorter SMS version
                sms_message = f"[Blue Tape] New {priority} issue at {project_name} - {area_name}. Issue #{issue_id}"
                results["sms"] = await self._send_sms(
                    to=contractor_phone,
                    message=sms_message
                )
            except Exception as e:
                results["sms"] = {"error": str(e)}
        
        return results
    
    async def _send_email(
        self,
        to: str,
        subject: str,
        body: str,
        photo_urls: list[str] = []
    ) -> dict:
        """Send email via SendGrid or simulate if not configured."""
        if not self.sendgrid_enabled:
            # Simulation mode - log instead of sending
            print(f"[SIMULATION] Email notification:")
            print(f"  To: {to}")
            print(f"  Subject: {subject}")
            print(f"  Body preview: {body[:200]}...")
            return {
                "status": "simulated",
                "message": "Email would be sent (SendGrid not configured)",
                "to": to,
                "subject": subject
            }
        
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
            import base64
            
            message = Mail(
                from_email=settings.sendgrid_from_email,
                to_emails=to,
                subject=subject,
                plain_text_content=body
            )
            
            # Note: For attachments, you'd need to read the files and encode them
            # This is a simplified version
            
            sg = SendGridAPIClient(settings.sendgrid_api_key)
            response = sg.send(message)
            
            return {
                "status": "sent",
                "status_code": response.status_code
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def _send_sms(self, to: str, message: str) -> dict:
        """Send SMS via Twilio or simulate if not configured."""
        if not self.twilio_enabled:
            # Simulation mode - log instead of sending
            print(f"[SIMULATION] SMS notification:")
            print(f"  To: {to}")
            print(f"  Message: {message}")
            return {
                "status": "simulated",
                "message": "SMS would be sent (Twilio not configured)",
                "to": to
            }
        
        try:
            from twilio.rest import Client
            
            client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
            
            msg = client.messages.create(
                body=message,
                from_=settings.twilio_from_number,
                to=to
            )
            
            return {
                "status": "sent",
                "sid": msg.sid
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def send_reminder(
        self,
        contractor_email: Optional[str],
        contractor_phone: Optional[str],
        project_name: str,
        issue_count: int
    ) -> dict:
        """Send reminder about pending issues."""
        subject = f"Reminder: {issue_count} pending issues - {project_name}"
        message = f"You have {issue_count} pending issue(s) at {project_name}. Please review and complete them."
        
        results = {"email": None, "sms": None}
        
        if contractor_email and self.sendgrid_enabled:
            results["email"] = await self._send_email(to=contractor_email, subject=subject, body=message)
        
        if contractor_phone and self.twilio_enabled:
            results["sms"] = await self._send_sms(to=contractor_phone, message=message)
        
        return results


# Singleton
notification_service = NotificationService()


def get_notification_service() -> NotificationService:
    return notification_service
