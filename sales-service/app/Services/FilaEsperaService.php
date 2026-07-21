<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class FilaEsperaService
{
    private int $sessaoTtlSeconds = 600;

    public function entrar(int $eventoId): array
    {
        $uuid = Str::uuid()->toString();
        $timestamp = microtime(true);

        Redis::zadd("fila_espera:{$eventoId}", $timestamp, $uuid);

        $posicao = Redis::zrank("fila_espera:{$eventoId}", $uuid);

        return [
            'uuid' => $uuid,
            'status' => 'aguardando',
            'posicao' => $posicao !== false ? $posicao + 1 : null,
        ];
    }

    public function status(int $eventoId, string $uuid): array
    {
        if (Redis::sismember("sessoes_liberadas:{$eventoId}", $uuid)) {
            return [
                'status' => 'liberado',
                'token_compra' => $uuid,
            ];
        }

        $posicao = Redis::zrank("fila_espera:{$eventoId}", $uuid);

        if ($posicao === false) {
            return [
                'status' => 'nao_encontrado',
                'posicao' => null,
            ];
        }

        return [
            'status' => 'aguardando',
            'posicao' => $posicao + 1,
        ];
    }

    public function liberarLote(int $eventoId, int $vagas): int
    {
        $liberados = 0;

        for ($i = 0; $i < $vagas; $i++) {
            $result = Redis::zpopmin("fila_espera:{$eventoId}", 1);

            if (empty($result)) {
                break;
            }

            $uuid = array_key_first($result);
            Redis::sadd("sessoes_liberadas:{$eventoId}", $uuid);
            Redis::expire("sessoes_liberadas:{$eventoId}", $this->sessaoTtlSeconds);
            $liberados++;
        }

        return $liberados;
    }

    public function removerSessao(int $eventoId, string $uuid): void
    {
        Redis::srem("sessoes_liberadas:{$eventoId}", $uuid);
    }

    public function validarToken(int $eventoId, string $uuid): bool
    {
        return Redis::sismember("sessoes_liberadas:{$eventoId}", $uuid);
    }
}
