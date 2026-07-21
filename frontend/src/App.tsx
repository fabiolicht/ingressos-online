import { useCallback, useEffect, useState } from 'react';
import { listarEventos } from './api';
import EventoItem from './components/EventoItem';
import type { Evento } from './types';

export default function App() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarEventos();
      setEventos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="page">
      <div className="atmosphere" aria-hidden="true" />

      <header className="hero">
        <p className="brand">Ingressos Online</p>
        <h1>Seu próximo show, sem overselling.</h1>
        <p className="hero-lead">
          Catálogo em tempo real, reserva atômica e fila virtual nos picos.
        </p>
        <a className="btn-hero" href="#eventos">
          Ver eventos
        </a>
      </header>

      <main id="eventos" className="section-eventos">
        <div className="section-head">
          <h2>Eventos disponíveis</h2>
          <button type="button" className="btn-ghost" onClick={carregar} disabled={loading}>
            Atualizar
          </button>
        </div>

        {loading && <p className="muted">Carregando catálogo…</p>}
        {error && (
          <p className="alert-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="eventos-list">
            {eventos.map((evento) => (
              <EventoItem key={evento.id} evento={evento} onComprado={carregar} />
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <span>React → Catálogo (Python) · Vendas (Laravel)</span>
      </footer>
    </div>
  );
}
