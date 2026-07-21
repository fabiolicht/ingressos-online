<?php

use App\Http\Controllers\FilaController;
use App\Http\Controllers\VendaController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:60,1')->group(function () {
    Route::post('/fila/entrar', [FilaController::class, 'entrar']);
    Route::get('/fila/status', [FilaController::class, 'status']);

    Route::post('/vendas', [VendaController::class, 'store'])
        ->middleware('fila.espera');
});

Route::get('/health', fn () => response()->json(['status' => 'ok']));
