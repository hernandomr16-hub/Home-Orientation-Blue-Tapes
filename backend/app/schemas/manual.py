from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class ManualTemplateResponse(BaseModel):
    id: int
    name: str
    version: str
    sections: List[Dict[str, Any]]
    is_active: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ManualInstanceCreate(BaseModel):
    template_id: Optional[int] = None
    fields: Dict[str, Any] = {}
    attachments: List[Dict[str, Any]] = []


class ManualInstanceUpdate(BaseModel):
    fields: Optional[Dict[str, Any]] = None
    attachments: Optional[List[Dict[str, Any]]] = None


class ManualInstanceResponse(BaseModel):
    id: int
    project_id: int
    template_id: Optional[int] = None
    fields: Dict[str, Any]
    attachments: List[Dict[str, Any]]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
