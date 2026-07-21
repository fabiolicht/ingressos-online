<?php

return [
    'catalog_api_url' => env('CATALOG_API_URL', 'http://catalog-api:8000'),
    'internal_api_key' => env('INTERNAL_API_KEY', 'dev-internal-key'),
    'rabbitmq' => [
        'host' => env('RABBITMQ_HOST', 'rabbitmq'),
        'port' => env('RABBITMQ_PORT', 5672),
        'user' => env('RABBITMQ_USER', 'guest'),
        'password' => env('RABBITMQ_PASSWORD', 'guest'),
    ],
    'fila_liberacao_vagas' => (int) env('FILA_LIBERACAO_VAGAS', 500),
    'pagamento_mock_falha' => filter_var(env('PAGAMENTO_MOCK_FALHA', false), FILTER_VALIDATE_BOOL),
];
