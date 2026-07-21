from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import EventoResponse, ReservarRequest, ReservarResponse
from app.services import listar_eventos, reservar_ingresso, verify_internal_key

app = FastAPI(
    title="Catálogo API",
    description="Microsserviço de eventos e controle de estoque",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/eventos", response_model=list[EventoResponse])
def get_eventos(db: Session = Depends(get_db)):
    return listar_eventos(db)


@app.post(
    "/reservar",
    response_model=ReservarResponse,
    dependencies=[Depends(verify_internal_key)],
)
def post_reservar(payload: ReservarRequest, db: Session = Depends(get_db)):
    return reservar_ingresso(db, payload)


@app.get("/health")
def health():
    return {"status": "ok"}
