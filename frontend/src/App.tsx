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
        
        <div className="brand">
          <div className="brand-title">
            <span className="brand-healthb">HEALTHB</span>
            <span className="brand-it">iT</span>
          </div>
          <div className="brand-subtitle">
            INTELIGÊNCIA EM SAÚDE
          </div>
        </div>
        <h1>Ingressos Online</h1>
        <h3>Front React - Back Catálogo (Python) - Vendas (Laravel).</h3>
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
        <span>© 2026 Fabio Lopes Licht</span>
      </footer>
    </div>
  );
}