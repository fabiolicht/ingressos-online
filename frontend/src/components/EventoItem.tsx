import { useEffect, useState } from 'react';
import { entrarNaFila, statusFila } from '../api';
import type { Evento } from '../types';
import BotaoComprar from './BotaoComprar';

interface EventoItemProps {
  evento: Evento;
  onComprado: () => void;
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventoItem({ evento, onComprado }: EventoItemProps) {
  const [filaUuid, setFilaUuid] = useState<string | null>(null);
  const [posicao, setPosicao] = useState<number | null>(null);
  const [liberado, setLiberado] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filaUuid || liberado) return;

    const tick = async () => {
      try {
        const status = await statusFila(evento.id, filaUuid);
        if (status.status === 'liberado' && status.token_compra) {
          setLiberado(true);
          setToken(status.token_compra);
          setPosicao(null);
          return;
        }
        if (status.status === 'aguardando') {
          setPosicao(status.posicao ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao consultar a fila.');
      }
    };

    tick();
    const id = window.setInterval(tick, 3000);
    return () => window.clearInterval(id);
  }, [filaUuid, liberado, evento.id]);

  const handleEntrarFila = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await entrarNaFila(evento.id);
      setFilaUuid(result.uuid);
      setPosicao(result.posicao);
      if (result.status === 'liberado') {
        setLiberado(true);
        setToken(result.uuid);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar na fila.');
    } finally {
      setBusy(false);
    }
  };

  const esgotado = evento.quantidade_disponivel <= 0;

  return (
    <article className="evento">
      <div className="evento-meta">
        <h3>{evento.nome}</h3>
        <p className="evento-data">{formatDate(evento.data)}</p>
        <p className="evento-stock">
          {esgotado ? 'Esgotado' : `${evento.quantidade_disponivel} disponíveis`}
        </p>
      </div>

      <div className="evento-actions">
        <p className="evento-preco">{formatPrice(Number(evento.preco))}</p>

        {esgotado ? (
          <span className="badge-muted">Indisponível</span>
        ) : !filaUuid ? (
          <button type="button" className="btn-secondary" onClick={handleEntrarFila} disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar na fila'}
          </button>
        ) : !liberado ? (
          <div className="fila-status" aria-live="polite">
            <span className="fila-pulse" />
            Aguardando · posição {posicao ?? '—'}
          </div>
        ) : token ? (
          <BotaoComprar eventoId={evento.id} filaToken={token} onSuccess={onComprado} />
        ) : null}

        {error && (
          <p className="alert-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
