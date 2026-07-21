import { useState } from 'react';
import { comprarIngresso } from '../api';

interface BotaoComprarProps {
  eventoId: number;
  filaToken: string;
  onSuccess?: () => void;
}

export default function BotaoComprar({ eventoId, filaToken, onSuccess }: BotaoComprarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [vendaId, setVendaId] = useState<number | null>(null);

  const handleComprar = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const data = await comprarIngresso(eventoId, 1, filaToken);
      setSuccess(true);
      setVendaId(data.venda_id);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na compra.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="alert-success" role="status">
        Compra confirmada{vendaId ? ` · pedido #${vendaId}` : ''}.
      </div>
    );
  }

  return (
    <div className="compra-widget">
      <button
        type="button"
        onClick={handleComprar}
        disabled={isLoading || !filaToken}
        className="btn-comprar"
      >
        {isLoading ? 'Processando reserva…' : 'Comprar ingresso'}
      </button>

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
