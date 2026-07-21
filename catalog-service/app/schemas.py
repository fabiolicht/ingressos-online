from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class EventoResponse(BaseModel):
    id: int
    nome: str
    data: datetime
    preco: Decimal
    quantidade_disponivel: int

    class Config:
        from_attributes = True


class ReservarRequest(BaseModel):
    evento_id: int = Field(..., gt=0)
    quantidade: int = Field(..., gt=0)


class ReservarResponse(BaseModel):
    message: str
    evento_id: int
    quantidade: int
