<?php

namespace App\Http\Controllers;

use App\Services\FilaEsperaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FilaController extends Controller
{
    public function __construct(private FilaEsperaService $filaEsperaService) {}

    public function entrar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'evento_id' => 'required|integer|min:1',
        ]);

        $result = $this->filaEsperaService->entrar((int) $validated['evento_id']);

        return response()->json($result);
    }

    public function status(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'evento_id' => 'required|integer|min:1',
            'uuid' => 'required|string',
        ]);

        $result = $this->filaEsperaService->status(
            (int) $validated['evento_id'],
            $validated['uuid']
        );

        return response()->json($result);
    }
}
