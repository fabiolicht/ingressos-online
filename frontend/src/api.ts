import type { Evento, FilaEntradaResponse, FilaStatusResponse } from './types';

const CATALOG_URL = import.meta.env.VITE_CATALOG_API_URL || 'http://localhost:8000';
const SALES_URL = import.meta.env.VITE_SALES_API_URL || 'http://localhost:8080';

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (data as { message?: string; error?: string; detail?: string }).message ||
      (data as { error?: string }).error ||
      (data as { detail?: string }).detail ||
      'Ocorreu um erro ao processar a requisição.';
    throw new Error(message);
  }
  return data as T;
}

export async function listarEventos(): Promise<Evento[]> {
  const response = await fetch(`${CATALOG_URL}/eventos`);
  return parseJson<Evento[]>(response);
}

export async function entrarNaFila(eventoId: number): Promise<FilaEntradaResponse> {
  const response = await fetch(`${SALES_URL}/api/fila/entrar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ evento_id: eventoId }),
  });
  return parseJson<FilaEntradaResponse>(response);
}

export async function statusFila(eventoId: number, uuid: string): Promise<FilaStatusResponse> {
  const params = new URLSearchParams({
    evento_id: String(eventoId),
    uuid,
  });
  const response = await fetch(`${SALES_URL}/api/fila/status?${params}`, {
    headers: { Accept: 'application/json' },
  });
  return parseJson<FilaStatusResponse>(response);
}

export async function comprarIngresso(
  eventoId: number,
  quantidade: number,
  filaToken: string
): Promise<{ message: string; venda_id: number }> {
  const response = await fetch(`${SALES_URL}/api/vendas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Fila-Token': filaToken,
    },
    body: JSON.stringify({
      evento_id: eventoId,
      quantidade,
    }),
  });
  return parseJson<{ message: string; venda_id: number }>(response);
}
