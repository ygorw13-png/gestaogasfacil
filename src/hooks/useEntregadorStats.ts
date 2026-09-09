import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export interface NivelInfo {
  nivel: number;
  titulo: string;
  xpNivel: number;
  xpProximo: number;
  progresso: number;
}

const TITULOS = [
  "Novato",
  "Aprendiz",
  "Entregador Bronze",
  "Entregador Prata",
  "Entregador Ouro",
  "Foguete",
  "Lenda do Gás",
];

/** Cada nível exige 100 XP a mais que o anterior (100, 200, 300...). */
export function calcularNivel(xp: number): NivelInfo {
  let nivel = 1;
  let restante = xp;
  let custo = 100;
  while (restante >= custo) {
    restante -= custo;
    nivel += 1;
    custo += 100;
  }
  return {
    nivel,
    titulo: TITULOS[Math.min(nivel - 1, TITULOS.length - 1)],
    xpNivel: restante,
    xpProximo: custo,
    progresso: Math.round((restante / custo) * 100),
  };
}

const diaLocal = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

/**
 * Métricas de desempenho do entregador logado (gamificação).
 * XP = 10 por entrega + 5 de bônus quando entrega em até 30 min.
 */
export function useEntregadorStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["entregador-stats", user?.id],
    enabled: !!user?.id,
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, price, created_at, accepted_at, delivered_at, status")
        .eq("delivery_person", user!.id)
        .eq("status", "completed")
        .order("delivered_at", { ascending: false });
      if (error) throw error;

      const entregas = (data ?? []).filter((o: any) => o.delivered_at);
      const hojeStr = new Date().toLocaleDateString("pt-BR");
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const hoje = entregas.filter((o: any) => diaLocal(o.delivered_at) === hojeStr);
      const mes = entregas.filter((o: any) => new Date(o.delivered_at) >= inicioMes);

      const duracoes = entregas
        .map((o: any) => {
          const inicio = new Date(o.accepted_at ?? o.created_at).getTime();
          const fim = new Date(o.delivered_at).getTime();
          return (fim - inicio) / 60000;
        })
        .filter((m) => m > 0 && m < 600);

      const tempoMedio = duracoes.length
        ? Math.round(duracoes.reduce((s, m) => s + m, 0) / duracoes.length)
        : 0;
      const noPrazo = duracoes.filter((m) => m <= 30).length;
      const pontualidade = duracoes.length ? Math.round((noPrazo / duracoes.length) * 100) : 0;

      // Sequência de dias seguidos com pelo menos uma entrega
      const dias = new Set(entregas.map((o: any) => diaLocal(o.delivered_at)));
      let sequencia = 0;
      const cursor = new Date();
      while (dias.has(cursor.toLocaleDateString("pt-BR"))) {
        sequencia += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      const xp = entregas.length * 10 + noPrazo * 5;
      const faturadoMes = mes.reduce((s: number, o: any) => s + Number(o.price ?? 0), 0);

      return {
        totalEntregas: entregas.length,
        entregasHoje: hoje.length,
        entregasMes: mes.length,
        faturadoMes,
        tempoMedio,
        pontualidade,
        sequencia,
        xp,
        ...calcularNivel(xp),
      };
    },
  });
}
