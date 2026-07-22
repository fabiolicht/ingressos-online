<?php

namespace App\Http\Controllers;

use App\Models\Venda;
use App\Services\CatalogServiceClient;
use App\Services\FilaEsperaService;
use App\Services\PagamentoService;
use App\Services\RabbitMQPublisher;
use DomainException;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VendaController extends Controller
{
    public function __construct(
        private CatalogServiceClient $catalogClient,
        private PagamentoService $pagamentoService,
        private RabbitMQPublisher $rabbitMQ,
        private FilaEsperaService $filaEsperaService,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'evento_id' => 'required|integer|min:1',
            'quantidade' => 'required|integer|min:1',
        ]);

        $eventoId = (int) $validated['evento_id'];
        $quantidade = (int) $validated['quantidade'];

        try {
            // 1. Reserva síncrona no Catálogo (Python) — timeout + circuit breaker no client
            $this->catalogClient->reservarIngresso($eventoId, $quantidade);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Tivemos um problema temporário ao verificar a disponibilidade dos ingressos. Por favor, tente novamente em alguns instantes.',
            ], 503);
        }

        // 2. Pedido pendente no DB Vendas (antes do pagamento)
        $venda = Venda::create([
            'evento_id' => $eventoId,
            'quantidade' => $quantidade,
            'status' => 'pendente',
        ]);

        // 3. Processa pagamento (mock)
        $pagamentoOk = $this->pagamentoService->processar(100.0 * $quantidade);

        if (! $pagamentoOk) {
            $venda->update(['status' => 'pagamento_falhou']);

            // Compensação assíncrona via RabbitMQ (não HTTP direto)
            $this->rabbitMQ->publish('reserva_cancelada', [
                'mensagem_id' => Str::uuid()->toString(),
                'pedido_id' => $venda->id,
                'evento_id' => $eventoId,
                'qtd' => $quantidade,
            ]);

            return response()->json([
                'message' => 'Erro na compra: pagamento recusado.',
            ], 402);
        }

        // 4. Confirma pedido e publica pós-venda assíncrono
        $venda->update(['status' => 'confirmada']);

        $this->rabbitMQ->publish('pedido_confirmado', [
            'pedido_id' => $venda->id,
            'evento_id' => $eventoId,
            'quantidade' => $quantidade,
        ]);

        $token = $request->header('X-Fila-Token');
        if ($token) {
            $this->filaEsperaService->removerSessao($eventoId, $token);
        }

        return response()->json([
            'message' => 'Compra realizada com sucesso!',
            'venda_id' => $venda->id,
        ], 200);
    }
}