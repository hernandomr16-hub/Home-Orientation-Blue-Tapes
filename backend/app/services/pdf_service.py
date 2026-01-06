import os
from io import BytesIO
from datetime import datetime
from typing import Optional, List, Dict, Any
from jinja2 import Template

# WeasyPrint is optional - PDF generation will return HTML if not available
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False
    HTML = None
    CSS = None

from ..config import get_settings
from ..models.issue import Issue, IssueStatus, IssuePriority
from ..models.project import Project
from ..models.manual import DEFAULT_MANUAL_SECTIONS

settings = get_settings()


class PDFService:
    """Service for generating PDF reports."""
    
    def __init__(self):
        self.output_dir = os.path.join(settings.upload_dir, "reports")
        os.makedirs(self.output_dir, exist_ok=True)
    
    def generate_punch_list_pdf(
        self,
        project: Project,
        issues: List[Issue],
        group_by: str = "area",  # area, trade, priority
        title: Optional[str] = None
    ) -> bytes:
        """Generate punch list PDF."""
        
        # Group issues
        grouped = self._group_issues(issues, group_by)
        
        # Build HTML
        html_content = self._render_punch_list_html(
            project=project,
            grouped_issues=grouped,
            group_by=group_by,
            title=title or f"Punch List - {project.name}"
        )
        
        # Convert to PDF or return HTML if WeasyPrint not available
        if WEASYPRINT_AVAILABLE:
            pdf_bytes = HTML(string=html_content).write_pdf(
                stylesheets=[CSS(string=self._get_punch_list_css())]
            )
            return pdf_bytes
        else:
            # Return HTML with inline CSS
            full_html = f"<style>{self._get_punch_list_css()}</style>{html_content}"
            return full_html.encode('utf-8')
    
    def generate_home_owner_manual_pdf(
        self,
        project: Project,
        manual_data: Dict[str, Any],
        attachments: List[Dict[str, Any]] = []
    ) -> bytes:
        """Generate Home Owner Manual PDF."""
        
        html_content = self._render_manual_html(
            project=project,
            manual_data=manual_data,
            attachments=attachments
        )
        
        if WEASYPRINT_AVAILABLE:
            pdf_bytes = HTML(string=html_content).write_pdf(
                stylesheets=[CSS(string=self._get_manual_css())]
            )
            return pdf_bytes
        else:
            full_html = f"<style>{self._get_manual_css()}</style>{html_content}"
            return full_html.encode('utf-8')
    
    def _group_issues(self, issues: List[Issue], group_by: str) -> Dict[str, List[Issue]]:
        """Group issues by the specified field."""
        grouped = {}
        
        for issue in issues:
            if group_by == "area":
                key = issue.area.name if issue.area else "Unassigned"
            elif group_by == "trade":
                key = issue.trade or "Unassigned"
            elif group_by == "priority":
                key = issue.priority.value.upper() if issue.priority else "MEDIUM"
            else:
                key = "All Issues"
            
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(issue)
        
        return grouped
    
    def _render_punch_list_html(
        self,
        project: Project,
        grouped_issues: Dict[str, List[Issue]],
        group_by: str,
        title: str
    ) -> str:
        """Render punch list HTML template."""
        
        template = Template("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ title }}</title>
</head>
<body>
    <div class="header">
        <h1>{{ title }}</h1>
        <div class="project-info">
            <p><strong>Project:</strong> {{ project.name }}</p>
            <p><strong>Address:</strong> {{ project.address }}{% if project.unit %}, {{ project.unit }}{% endif %}</p>
            <p><strong>Generated:</strong> {{ generated_date }}</p>
            <p><strong>Total Issues:</strong> {{ total_issues }}</p>
        </div>
    </div>
    
    <div class="summary">
        <div class="stat open">Open: {{ counts.open }}</div>
        <div class="stat assigned">Assigned: {{ counts.assigned }}</div>
        <div class="stat progress">In Progress: {{ counts.in_progress }}</div>
        <div class="stat reinspect">Ready for Reinspect: {{ counts.reinspect }}</div>
        <div class="stat closed">Closed: {{ counts.closed }}</div>
    </div>
    
    {% for group_name, issues in grouped_issues.items() %}
    <div class="group">
        <h2>{{ group_name }} ({{ issues|length }})</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Contractor</th>
                </tr>
            </thead>
            <tbody>
                {% for issue in issues %}
                <tr class="priority-{{ issue.priority.value }}">
                    <td>#{{ issue.id }}</td>
                    <td>{{ issue.category }}</td>
                    <td>{{ issue.description or '-' }}</td>
                    <td class="priority">{{ issue.priority.value|upper }}</td>
                    <td class="status">{{ issue.status.value|replace('_', ' ')|title }}</td>
                    <td>{{ issue.contractor.company if issue.contractor else '-' }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    {% endfor %}
    
    <div class="footer">
        <p>Generated by Home Orientation Blue Tapes | {{ generated_date }}</p>
    </div>
</body>
</html>
        """)
        
        # Calculate counts
        all_issues = [i for issues in grouped_issues.values() for i in issues]
        counts = {
            "open": sum(1 for i in all_issues if i.status == IssueStatus.OPEN),
            "assigned": sum(1 for i in all_issues if i.status == IssueStatus.ASSIGNED),
            "in_progress": sum(1 for i in all_issues if i.status == IssueStatus.IN_PROGRESS),
            "reinspect": sum(1 for i in all_issues if i.status == IssueStatus.READY_FOR_REINSPECT),
            "closed": sum(1 for i in all_issues if i.status == IssueStatus.CLOSED),
        }
        
        return template.render(
            title=title,
            project=project,
            grouped_issues=grouped_issues,
            group_by=group_by,
            generated_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
            total_issues=len(all_issues),
            counts=counts
        )
    
    def _render_manual_html(
        self,
        project: Project,
        manual_data: Dict[str, Any],
        attachments: List[Dict[str, Any]]
    ) -> str:
        """Render Home Owner Manual HTML template."""
        
        template = Template("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Home Owner Manual - {{ project.name }}</title>
</head>
<body>
    <div class="cover">
        <h1>Home Owner Manual</h1>
        <div class="address">
            <h2>{{ project.address }}</h2>
            {% if project.unit %}<h3>{{ project.unit }}</h3>{% endif %}
        </div>
        <div class="date">{{ generated_date }}</div>
    </div>
    
    <div class="page-break"></div>
    
    <!-- Contacts Section -->
    {% if manual_data.get('contacts') %}
    <section class="section">
        <h2>Important Contacts</h2>
        <table class="contacts-table">
            {% for key, contact in manual_data.contacts.items() %}
            {% if contact %}
            <tr>
                <td class="label">{{ key|replace('_', ' ')|title }}</td>
                <td>
                    {% if contact.name %}{{ contact.name }}{% endif %}
                    {% if contact.phone %}<br>📞 {{ contact.phone }}{% endif %}
                    {% if contact.email %}<br>✉️ {{ contact.email }}{% endif %}
                </td>
            </tr>
            {% endif %}
            {% endfor %}
        </table>
    </section>
    {% endif %}

    <!-- Appliances Section -->
    {% if manual_data.get('appliances') %}
    <section class="section">
        <h2>Appliances</h2>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Brand</th>
                    <th>Model #</th>
                    <th>Serial #</th>
                </tr>
            </thead>
            <tbody>
                {% for item in manual_data.appliances %}
                {% if item.item or item.brand %}
                <tr>
                    <td><strong>{{ item.item }}</strong></td>
                    <td>{{ item.brand }}</td>
                    <td>{{ item.model }}</td>
                    <td>{{ item.serial }}</td>
                </tr>
                {% endif %}
                {% endfor %}
            </tbody>
        </table>
    </section>
    {% endif %}

    <!-- Finishes Section -->
    {% if manual_data.get('finishes') %}
    <section class="section">
        <h2>Finishes & Paint</h2>
        <table>
            <thead>
                <tr>
                    <th>Area/Surface</th>
                    <th>Brand</th>
                    <th>Color</th>
                    <th>Finish</th>
                </tr>
            </thead>
            <tbody>
                {% for item in manual_data.finishes %}
                {% if item.area or item.color %}
                <tr>
                    <td><strong>{{ item.area }}</strong></td>
                    <td>{{ item.brand }}</td>
                    <td>{{ item.color }}</td>
                    <td>{{ item.finish }}</td>
                </tr>
                {% endif %}
                {% endfor %}
            </tbody>
        </table>
    </section>
    {% endif %}

    <!-- Mechanical Systems Section -->
    {% if manual_data.get('systems') %}
    <section class="section">
        <h2>Mechanical Systems</h2>
        <table class="locations-table">
            {% for key, val in manual_data.systems.items() %}
            {% if val %}
            <tr>
                <td class="label">{{ key|replace('_', ' ')|title }}</td>
                <td>{{ val }}</td>
            </tr>
            {% endif %}
            {% endfor %}
        </table>
    </section>
    {% endif %}
    
    <!-- Locations Section -->
    {% if manual_data.get('locations') %}
    <section class="section">
        <h2>Key Locations & Controls</h2>
        <table class="locations-table">
            {% for key, location in manual_data.locations.items() %}
            {% if location and location.description %}
            <tr>
                <td class="label">{{ key|replace('_', ' ')|title }}</td>
                <td>{{ location.description }}</td>
            </tr>
            {% endif %}
            {% endfor %}
        </table>
    </section>
    {% endif %}
    
    <!-- Maintenance Checklist -->
    <section class="section">
        <h2>Maintenance Checklist</h2>
        <table class="maintenance-table">
            <thead>
                <tr>
                    <th>Task</th>
                    <th>Frequency</th>
                </tr>
            </thead>
            <tbody>
                {% for item in maintenance_items %}
                <tr>
                    <td>{{ item.task }}</td>
                    <td>{{ item.frequency }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </section>
    
    <!-- Notes -->
    {% if manual_data.get('notes') %}
    <section class="section">
        <h2>Additional Notes</h2>
        <div class="notes-content">{{ manual_data.notes }}</div>
    </section>
    {% endif %}
    
    <!-- Attachments List -->
    {% if attachments %}
    <section class="section">
        <h2>Warranties & Documents</h2>
        <ul class="attachments-list">
            {% for attachment in attachments %}
            <li>{{ attachment.name }} ({{ attachment.type|upper }})</li>
            {% endfor %}
        </ul>
    </section>
    {% endif %}
    
    <div class="footer">
        <p>Generated by Home Orientation Blue Tapes | {{ generated_date }}</p>
    </div>
</body>
</html>
        """)
        
        # Get default maintenance items
        maintenance_section = next(
            (s for s in DEFAULT_MANUAL_SECTIONS if s["id"] == "maintenance"),
            {"items": []}
        )
        
        return template.render(
            project=project,
            manual_data=manual_data,
            attachments=attachments,
            maintenance_items=maintenance_section.get("items", []),
            generated_date=datetime.now().strftime("%Y-%m-%d")
        )
    
    def _get_punch_list_css(self) -> str:
        """CSS styles for punch list PDF."""
        return """
            @page { size: letter; margin: 0.75in; }
            body { font-family: Arial, sans-serif; font-size: 11pt; color: #333; }
            .header { margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
            .header h1 { color: #1e40af; margin: 0 0 10px 0; }
            .project-info p { margin: 3px 0; }
            .summary { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
            .stat { padding: 8px 12px; border-radius: 4px; font-weight: bold; font-size: 10pt; }
            .stat.open { background: #fef3c7; color: #92400e; }
            .stat.assigned { background: #dbeafe; color: #1e40af; }
            .stat.progress { background: #e0e7ff; color: #3730a3; }
            .stat.reinspect { background: #fce7f3; color: #9d174d; }
            .stat.closed { background: #d1fae5; color: #065f46; }
            .group { margin-bottom: 25px; }
            .group h2 { color: #1e40af; font-size: 14pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; font-size: 10pt; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f3f4f6; font-weight: bold; }
            .priority-high { background: #fef2f2; }
            .priority { font-weight: bold; }
            .priority-high .priority { color: #dc2626; }
            .priority-medium .priority { color: #d97706; }
            .priority-low .priority { color: #16a34a; }
            .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #6b7280; }
        """
    
    def _get_manual_css(self) -> str:
        """CSS styles for Home Owner Manual PDF."""
        return """
            @page { size: letter; margin: 0.75in; }
            body { font-family: Georgia, serif; font-size: 11pt; color: #333; }
            .cover { text-align: center; padding-top: 200px; }
            .cover h1 { font-size: 32pt; color: #1e40af; margin-bottom: 50px; }
            .cover .address h2 { font-size: 18pt; margin: 5px 0; }
            .cover .date { margin-top: 100px; font-size: 12pt; color: #6b7280; }
            .page-break { page-break-after: always; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #1e40af; font-size: 16pt; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; }
            .contacts-table td, .locations-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; width: 200px; background: #f3f4f6; }
            .maintenance-table th, .maintenance-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            .maintenance-table th { background: #f3f4f6; }
            .notes-content { background: #f9fafb; padding: 15px; border-radius: 4px; }
            .attachments-list { list-style: none; padding: 0; }
            .attachments-list li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .footer { margin-top: 50px; text-align: center; font-size: 9pt; color: #6b7280; }
        """


# Singleton
pdf_service = PDFService()


def get_pdf_service() -> PDFService:
    return pdf_service
