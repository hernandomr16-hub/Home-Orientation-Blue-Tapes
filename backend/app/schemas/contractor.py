from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ==================== Trade Schemas ====================

class TradeBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    order: int = 0


class TradeCreate(TradeBase):
    pass


class TradeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[int] = None


class TradeResponse(TradeBase):
    id: int
    is_active: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    contractor_count: int = 0
    
    class Config:
        from_attributes = True


class TradeWithContractors(TradeResponse):
    contractors: List["ContractorResponse"] = []


# ==================== Contractor Schemas ====================

class ContractorBase(BaseModel):
    company: str
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    trade_id: Optional[int] = None
    trade_ids: Optional[List[int]] = None  # For multi-select
    trades: Optional[List[str]] = None  # Trade names
    notes: Optional[str] = None


class ContractorCreate(ContractorBase):
    pass


class ContractorUpdate(BaseModel):
    company: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    trade_id: Optional[int] = None
    trade_ids: Optional[List[int]] = None
    trades: Optional[List[str]] = None
    notes: Optional[str] = None
    is_active: Optional[int] = None


class ContractorResponse(BaseModel):
    id: int
    company: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    trade_id: Optional[int] = None
    trade_ids: List[int] = []
    trades: List[str] = []
    notes: Optional[str] = None
    is_active: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    trade: Optional[TradeResponse] = None
    
    class Config:
        from_attributes = True


# ==================== Project Contractor Schemas ====================

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


# Update forward references
TradeWithContractors.model_rebuild()

