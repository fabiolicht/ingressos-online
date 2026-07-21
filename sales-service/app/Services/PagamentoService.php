<?php

namespace App\Services;

class PagamentoService
{
    public function processar(float $valor, array $dadosCartao = []): bool
    {
        if (config('services.pagamento_mock_falha')) {
            return false;
        }

        return $valor > 0;
    }
}
