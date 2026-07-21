<?php

namespace App\Console\Commands;

use App\Services\FilaEsperaService;
use Illuminate\Console\Command;

class LiberarFilaCommand extends Command
{
    protected $signature = 'fila:liberar {--interval=5 : Intervalo em segundos}';

    protected $description = 'Libera lotes de usuários da fila de espera virtual';

    public function handle(FilaEsperaService $filaEsperaService): int
    {
        $interval = (int) $this->option('interval');
        $vagas = config('services.fila_liberacao_vagas', 500);

        $this->info("Worker de fila iniciado (intervalo: {$interval}s, vagas: {$vagas})");

        while (true) {
            for ($eventoId = 1; $eventoId <= 10; $eventoId++) {
                $liberados = $filaEsperaService->liberarLote($eventoId, $vagas);
                if ($liberados > 0) {
                    $this->line("Evento {$eventoId}: {$liberados} usuários liberados");
                }
            }

            sleep($interval);
        }
    }
}
