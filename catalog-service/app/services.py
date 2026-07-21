import json

import redis
from fastapi import Depends, Header, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Estoque, Evento, get_db
from app.schemas import EventoResponse, ReservarRequest, ReservarResponse

redis_client = redis.from_url(settings.redis_url, decode_responses=True)


def verify_internal_key(x_internal_key: str = Header(...)):
    if x_internal_key != settings.internal_api_key:
        raise HTTPException(status_code=403, detail="Acesso negado")


def listar_eventos(db: Session) -> list[EventoResponse]:
    cache_key = "eventos:lista"
    cached = redis_client.get(cache_key)
    if cached:
        return [EventoResponse(**item) for item in json.loads(cached)]

    query = (
        db.query(Evento, Estoque.quantidade)
        .join(Estoque, Evento.id == Estoque.evento_id)
        .order_by(Evento.data)
        .all()
    )

    eventos = [
        EventoResponse(
            id=evento.id,
            nome=evento.nome,
            data=evento.data,
            preco=evento.preco,
            quantidade_disponivel=quantidade,
        )
        for evento, quantidade in query
    ]

    redis_client.setex(
        cache_key,
        settings.cache_ttl_seconds,
        json.dumps([e.model_dump(mode="json") for e in eventos]),
    )
    return eventos


def reservar_ingresso(db: Session, payload: ReservarRequest) -> ReservarResponse:
    result = db.execute(
        text(
            """
            UPDATE estoque
            SET quantidade = quantidade - :qtd
            WHERE evento_id = :evento_id AND quantidade >= :qtd
            """
        ),
        {"evento_id": payload.evento_id, "qtd": payload.quantidade},
    )

    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(status_code=409, detail="Sem estoque disponível")

    db.commit()
    redis_client.delete("eventos:lista")

    return ReservarResponse(
        message="Reserva confirmada",
        evento_id=payload.evento_id,
        quantidade=payload.quantidade,
    )
