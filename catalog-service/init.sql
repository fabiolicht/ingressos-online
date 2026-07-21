CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data TIMESTAMP NOT NULL,
    preco DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS estoque (
    evento_id INT PRIMARY KEY REFERENCES eventos(id),
    quantidade INT NOT NULL CHECK (quantidade >= 0)
);

CREATE TABLE IF NOT EXISTS eventos_processados (
    mensagem_id VARCHAR(255) PRIMARY KEY,
    pedido_id INT NOT NULL,
    processado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO eventos (nome, data, preco) VALUES
    ('Show Rock Nacional', '2026-08-15 20:00:00', 150.00),
    ('Festival Eletrônico', '2026-09-20 22:00:00', 280.00),
    ('Teatro Clássico', '2026-10-05 19:30:00', 90.00);

INSERT INTO estoque (evento_id, quantidade) VALUES
    (1, 100),
    (2, 50),
    (3, 200);
