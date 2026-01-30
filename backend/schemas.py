from pydantic import BaseModel
from datetime import date
from typing import Optional

class ExpenseCreate(BaseModel):
    date: date
    person: str
    description: str
    amount: float
    business_unit: str
    project: Optional[str] = None

class ExpenseResponse(ExpenseCreate):
    id: int

    class Config:
        from_attributes = True
