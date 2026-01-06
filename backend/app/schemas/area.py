from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AreaBase(BaseModel):
    name: str
    order: Optional[int] = 0


class AreaCreate(AreaBase):
    project_id: Optional[int] = None  # Can be set from path


class AreaUpdate(BaseModel):
    name: Optional[str] = None
    order: Optional[int] = None


class AreaResponse(AreaBase):
    id: int
    project_id: int
    is_custom: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
