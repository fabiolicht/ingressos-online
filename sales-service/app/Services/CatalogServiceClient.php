<?php

namespace App\Services;

use DomainException;
use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CatalogServiceClient
{
    private string $circuitKey = 'circuit_breaker:catalog';

    private string $failuresKey = 'circuit_breaker:catalog_failures';

    private int $maxFailures = 5;

    private int $timeoutSeconds = 30;

    public function reservarIngresso(int $eventoId, int $quantidade): array
    {
        if (Cache::has($this->circuitKey)) {
            throw new Exception('Serviço de catálogo temporariamente indisponível (Circuit Open).');
        }

        try {
            $response = Http::timeout(3)
                ->withHeaders([
                    'X-Internal-Key' => config('services.internal_api_key'),
                ])
                ->post(config('services.catalog_api_url').'/reservar', [
                    'evento_id' => $eventoId,
                    'quantidade' => $quantidade,
                ]);

            if ($response->successful()) {
                Cache::forget($this->failuresKey);

                return $response->json();
            }

            if ($response->status() === 409) {
                throw new DomainException('Ingressos esgotados.');
            }

            if ($response->clientError()) {
                throw new DomainException($response->json('detail') ?? 'Erro de validação no catálogo.');
            }

            $this->recordFailure();
        } catch (ConnectionException) {
            $this->recordFailure();
        }

        throw new Exception('Falha de comunicação com o Catálogo.');
    }

    private function recordFailure(): void
    {
        $failures = Cache::increment($this->failuresKey) ?: 1;

        if ($failures >= $this->maxFailures) {
            Cache::put($this->circuitKey, true, $this->timeoutSeconds);
            Cache::forget($this->failuresKey);
        }

        throw new Exception('Falha de comunicação com o Catálogo.');
    }
}
