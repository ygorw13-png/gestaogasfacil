export interface ChequeItem {
  id: string;
  valor: number;
  nome: string;
  dataInicio: string; // yyyy-mm-dd
  dataFim: string; // yyyy-mm-dd
}

export interface ChequeCalculado extends ChequeItem {
  dias: number;
  juros: number;
  liquido: number;
}

export const diasEntre = (inicio: string, fim: string): number => {
  if (!inicio || !fim) return 0;
  const a = new Date(`${inicio}T00:00:00`);
  const b = new Date(`${fim}T00:00:00`);
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
};

export const calcularCheque = (item: ChequeItem, taxaMensal: number): ChequeCalculado => {
  const dias = diasEntre(item.dataInicio, item.dataFim);
  const juros = (item.valor || 0) * ((taxaMensal || 0) / 100) * (dias / 30);
  return {
    ...item,
    dias,
    juros,
    liquido: (item.valor || 0) - juros,
  };
};

export const calcularLista = (itens: ChequeItem[], taxaMensal: number) => {
  const linhas = itens.map((i) => calcularCheque(i, taxaMensal));
  return {
    linhas,
    totalValor: linhas.reduce((s, l) => s + (l.valor || 0), 0),
    totalJuros: linhas.reduce((s, l) => s + l.juros, 0),
    totalLiquido: linhas.reduce((s, l) => s + l.liquido, 0),
  };
};

export const brl = (v: number) =>
  (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const dataBR = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR") : "";
