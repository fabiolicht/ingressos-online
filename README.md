# Ingressos Online

Sistema de venda de ingressos com arquitetura de microsserviços.

## Componentes

| Serviço | Stack | Porta | Responsabilidade |
|---------|-------|-------|------------------|
| Frontend | React + Vite | 5173 | Interface do usuário |
| Catálogo | Python FastAPI | 8000 | Eventos e controle de estoque |
| Vendas | PHP Laravel 11 | 8080 | Orquestração de compras |
| DB Catálogo | PostgreSQL 16 | 5434 | Dados de eventos/estoque |
| DB Vendas | PostgreSQL 16 | 5433 | Dados de pedidos |
| Redis | Redis 7 | 6379 | Cache, Circuit Breaker, Fila de Espera |
| RabbitMQ | RabbitMQ 3 | 5672 / 15672 | Compensação e pós-venda (Saga) |

## Arquitetura

- **Database-per-service**: cada microsserviço possui banco isolado
- **Leitura direta**: Frontend consulta Catálogo via `GET /eventos`
- **Escrita orquestrada**: compras passam pelo Vendas (`POST /api/vendas`)
- **Reserva atômica**: `UPDATE estoque WHERE quantidade >= qtd` evita overselling
- **Circuit Breaker**: Redis protege Vendas quando Catálogo está indisponível
- **Saga assíncrona**: rollback de estoque via RabbitMQ quando pagamento falha
- **Fila de Espera Virtual**: Redis ZSET limita concorrência em picos

## Comunicação Síncrona vs Assíncrona

| Etapa | Modelo | Vantagens | Desvantagens |
|-------|--------|-----------|--------------|
| Reserva de estoque | Síncrono | Resposta imediata, evita cobrança sem estoque | Acoplamento temporal |
| Pagamento | Síncrono | UX clara para o usuário | Latência somada |
| Pós-venda (email/PDF) | Assíncrono | Escalável, tolerante a falhas | Consistência eventual |
| Compensação (rollback) | Assíncrono | Resiliência se Catálogo cair após falha | Requer idempotência |

## Início Rápido

```bash
docker compose up --build
```

Acesse:
- Frontend: http://localhost:5173
- Swagger Catálogo: http://localhost:8000/docs
- API Vendas: http://localhost:8080/api/vendas
- RabbitMQ Management: http://localhost:15672 (guest/guest)

## Fluxo de Compra

1. Usuário entra na fila virtual (`POST /api/fila/entrar`)
2. Worker libera lotes de usuários (`php artisan fila:liberar`)
3. Frontend lista eventos (`GET /eventos` no Catálogo)
4. Usuário clica Comprar → `POST /api/vendas` no Vendas
5. Vendas reserva estoque no Catálogo (`POST /reservar`)
6. Vendas processa pagamento e salva pedido
7. Evento `pedido_confirmado` publicado no RabbitMQ (pós-venda: PDF/e-mail mock)
8. Se o pagamento falhar → `reserva_cancelada` na fila (compensação idempotente)

## Tratamento de Erros

| Código | Cenário | Resposta ao usuário |
|--------|---------|---------------------|
| 400 | Estoque esgotado | "Ingressos esgotados" |
| 402 | Pagamento recusado | "Erro no pagamento" |
| 403 | Token de fila inválido | "Retorne à fila" |
| 503 | Catálogo indisponível / Circuit Breaker | "Problema temporário..." |

## Diagramas

Arquivos Excalidraw em `docs/architecture/`:
- `01-visao-geral.excalidraw`
- `02-fluxo-compra.excalidraw`
- `03-tratamento-erros.excalidraw`

## Testes Manuais

```bash
# Listar eventos
curl http://localhost:8000/eventos

# Entrar na fila
curl -X POST http://localhost:8080/api/fila/entrar -H "Content-Type: application/json" -d '{"evento_id":1}'

# Comprar (com token da fila)
curl -X POST http://localhost:8080/api/vendas \
  -H "Content-Type: application/json" \
  -H "X-Fila-Token: <uuid>" \
  -d '{"evento_id":1,"quantidade":1}'
```
