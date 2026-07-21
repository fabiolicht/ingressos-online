<?php

namespace App\Http\Middleware;

use App\Services\FilaEsperaService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FilaEsperaMiddleware
{
    public function __construct(private FilaEsperaService $filaEsperaService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $uuid = $request->header('X-Fila-Token');
        $eventoId = (int) $request->input('evento_id');

        if (! $uuid || ! $this->filaEsperaService->validarToken($eventoId, $uuid)) {
            return response()->json(['error' => 'Acesso negado. Retorne à fila.'], 403);
        }

        return $next($request);
    }
}
