from sqlalchemy import Column, DateTime, Integer, Numeric, String, create_engine, func
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Evento(Base):
    __tablename__ = "eventos"

    id = Column(Integer, primary_key=True)
    nome = Column(String(255), nullable=False)
    data = Column(DateTime, nullable=False)
    preco = Column(Numeric(10, 2), nullable=False)


class Estoque(Base):
    __tablename__ = "estoque"

    evento_id = Column(Integer, primary_key=True)
    quantidade = Column(Integer, nullable=False)


class EventoProcessado(Base):
    __tablename__ = "eventos_processados"

    mensagem_id = Column(String(255), primary_key=True)
    pedido_id = Column(Integer, nullable=False)
    processado_em = Column(DateTime, server_default=func.now())


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
