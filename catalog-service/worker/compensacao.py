import json
import logging
import sys
import time

import pika
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.config import settings

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger(__name__)

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)

QUEUE_NAME = "reserva_cancelada"
DLQ_NAME = "reserva_cancelada_dlq"
MAX_RETRIES = 3


def processar_compensacao(mensagem: dict) -> bool:
    db = SessionLocal()
    try:
        db.execute(text("BEGIN"))

        result = db.execute(
            text(
                """
                INSERT INTO eventos_processados (mensagem_id, pedido_id)
                VALUES (:mensagem_id, :pedido_id)
                ON CONFLICT (mensagem_id) DO NOTHING
                RETURNING mensagem_id
                """
            ),
            mensagem,
        )

        if not result.fetchone():
            db.execute(text("ROLLBACK"))
            logger.info("Mensagem %s já processada (idempotente)", mensagem["mensagem_id"])
            return True

        db.execute(
            text(
                """
                UPDATE estoque
                SET quantidade = quantidade + :qtd
                WHERE evento_id = :evento_id
                """
            ),
            mensagem,
        )

        db.execute(text("COMMIT"))
        logger.info(
            "Compensação OK: pedido=%s evento=%s qtd=%s",
            mensagem["pedido_id"],
            mensagem["evento_id"],
            mensagem["qtd"],
        )
        return True
    except Exception:
        db.execute(text("ROLLBACK"))
        logger.exception("Erro ao processar compensação")
        return False
    finally:
        db.close()


def on_message(channel, method, properties, body):
    try:
        mensagem = json.loads(body)
        sucesso = processar_compensacao(mensagem)

        if sucesso:
            channel.basic_ack(delivery_tag=method.delivery_tag)
        else:
            headers = properties.headers or {}
            retries = headers.get("x-retries", 0) + 1

            if retries >= MAX_RETRIES:
                channel.basic_publish(
                    exchange="",
                    routing_key=DLQ_NAME,
                    body=body,
                    properties=pika.BasicProperties(headers={"x-retries": retries}),
                )
                channel.basic_ack(delivery_tag=method.delivery_tag)
                logger.error("Mensagem enviada para DLQ após %s tentativas", retries)
            else:
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    except json.JSONDecodeError:
        channel.basic_ack(delivery_tag=method.delivery_tag)
        logger.error("Mensagem inválida descartada")


def main():
    while True:
        try:
            connection = pika.BlockingConnection(pika.URLParameters(settings.rabbitmq_url))
            channel = connection.channel()
            channel.queue_declare(queue=QUEUE_NAME, durable=True)
            channel.queue_declare(queue=DLQ_NAME, durable=True)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message)
            logger.info("Worker aguardando mensagens na fila %s", QUEUE_NAME)
            channel.start_consuming()
        except Exception:
            logger.exception("Conexão RabbitMQ perdida, reconectando em 5s...")
            time.sleep(5)


if __name__ == "__main__":
    main()
