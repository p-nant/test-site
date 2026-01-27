from pydantic import BaseModel
from datetime import date

class ExpenseCreate(BaseModel):
    date: date
    person: str
    description: str
    amount: float
    business_unit: str
    project: str | None = None

class ExpenseResponse(ExpenseCreate):
    id: int

    class Config:
        from_attributes = True
