CREATE TABLE IF NOT EXISTS vendas (
    id SERIAL PRIMARY KEY,
    evento_id INT NOT NULL,
    quantidade INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
