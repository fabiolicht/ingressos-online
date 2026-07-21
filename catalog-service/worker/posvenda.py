"""Worker de pós-venda: consome Pedido_Confirmado (email/PDF mock)."""

import json
import logging
import sys
import time

import pika

from app.config import settings

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger(__name__)

QUEUE_NAME = "pedido_confirmado"


def on_message(channel, method, _properties, body):
    try:
        mensagem = json.loads(body)
        pedido_id = mensagem.get("pedido_id")
        evento_id = mensagem.get("evento_id")
        quantidade = mensagem.get("quantidade")

        # Mock: geração de PDF + envio de e-mail
        logger.info(
            "[pós-venda] PDF + e-mail para pedido=%s evento=%s qtd=%s",
            pedido_id,
            evento_id,
            quantidade,
        )
        channel.basic_ack(delivery_tag=method.delivery_tag)
    except Exception:
        logger.exception("Falha no pós-venda")
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def main():
    while True:
        try:
            connection = pika.BlockingConnection(pika.URLParameters(settings.rabbitmq_url))
            channel = connection.channel()
            channel.queue_declare(queue=QUEUE_NAME, durable=True)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message)
            logger.info("Worker pós-venda aguardando na fila %s", QUEUE_NAME)
            channel.start_consuming()
        except Exception:
            logger.exception("Conexão RabbitMQ perdida, reconectando em 5s...")
            time.sleep(5)


if __name__ == "__main__":
    main()
