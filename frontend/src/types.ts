export interface Evento {
  id: number;
  nome: string;
  data: string;
  preco: number;
  quantidade_disponivel: number;
}

export type FilaStatus = 'aguardando' | 'liberado' | 'nao_encontrado';

export interface FilaEntradaResponse {
  uuid: string;
  status: FilaStatus;
  posicao: number | null;
}

export interface FilaStatusResponse {
  status: FilaStatus;
  posicao?: number | null;
  token_compra?: string;
}
