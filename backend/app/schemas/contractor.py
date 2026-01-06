from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class ContractorBase(BaseModel):
    company: str
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    trades: List[str] = []
    notes: Optional[str] = None


class ContractorCreate(ContractorBase):
    pass


class ContractorUpdate(BaseModel):
    company: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    trades: Optional[List[str]] = None
    notes: Optional[str] = None
    is_active: Optional[int] = None


class ContractorResponse(ContractorBase):
    id: int
    is_active: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ProjectContractorCreate(BaseModel):
    contractor_id: int
    trades: List[str] = []
    notes: Optional[str] = None


class ProjectContractorResponse(BaseModel):
    id: int
    project_id: int
    contractor_id: int
    contractor: ContractorResponse
    trades: List[str]
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
