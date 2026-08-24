import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UltimoPedido {
  produto: string | null;
  quantidade: number | null;
  preco: number | null;
  tipo_venda: string | null;
  pagamento: string | null;
  data: string;
}

export interface ClienteInsight {
  cliente_id: string;
  cliente_nome: string;
  cliente_phone: string | null;
  ultima_compra: string | null;
  total_compras: number;
  media_dias: number | null;
  proxima_prevista: string | null;
  dias_desde_ultima: number | null;
  status: "em_dia" | "hora_comprar" | "atrasado" | "novo";
  aniversario_hoje: boolean;
  data_nascimento: string | null;
  ultimo_pedido: UltimoPedido | null;
}

interface Cliente {
  id: string;
  name: string;
  phone: string | null;
  data_nascimento: string | null;
}

interface Order {
  id: string;
  client_name: string;
  client_phone: string | null;
  created_at: string;
  status: string;
  product: string | null;
  quantity: number | null;
  price: number | null;
  tipo_venda: string | null;
  payment_method: string | null;
}

function calcStatus(diasDesde: number | null, media: number | null): ClienteInsight["status"] {
  if (media == null || diasDesde == null) return "novo";
  const ratio = diasDesde / media;
  if (ratio < 0.9) return "em_dia";
  if (ratio < 1.3) return "hora_comprar";
  return "atrasado";
}

export function useRecompraInsights() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: c }, { data: o }] = await Promise.all([
        supabase.from("clients").select("id, name, phone, data_nascimento"),
        supabase.from("orders")
          .select("id, client_name, client_phone, created_at, status, product, quantity, price, tipo_venda, payment_method")
          .order("created_at", { ascending: false }).limit(2000),
      ]);
      setClientes((c as Cliente[]) || []);
      setOrders((o as Order[]) || []);
      setLoading(false);
    })();
  }, []);

  const insights = useMemo<ClienteInsight[]>(() => {
    const now = Date.now();
    const todayMD = new Date().toISOString().slice(5, 10);
    // Index orders by client (name + phone fallback)
    const byClient = new Map<string, Order[]>();
    for (const o of orders) {
      const key = (o.client_phone || o.client_name || "").toLowerCase().trim();
      if (!key) continue;
      if (!byClient.has(key)) byClient.set(key, []);
      byClient.get(key)!.push(o);
    }

    // Só contabiliza clientes com histórico relevante (3+ compras),
    // para a média de tempo entre compras não ficar distorcida.
    const MIN_COMPRAS = 3;

    return clientes.map(c => {
      const key = (c.phone || c.name || "").toLowerCase().trim();
      const list = (byClient.get(key) || []).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const ultima = list[0]?.created_at || null;

      // Compute avg gap (last up to 6 purchases)
      let media: number | null = null;
      if (list.length >= 2) {
        const recent = list.slice(0, 6);
        const gaps: number[] = [];
        for (let i = 0; i < recent.length - 1; i++) {
          const d1 = new Date(recent[i].created_at).getTime();
          const d2 = new Date(recent[i + 1].created_at).getTime();
          gaps.push(Math.max(1, (d1 - d2) / 86400000));
        }
        media = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
      }

      const diasDesde = ultima
        ? Math.floor((now - new Date(ultima).getTime()) / 86400000)
        : null;
      const proxima = ultima && media
        ? new Date(new Date(ultima).getTime() + media * 86400000).toISOString().slice(0, 10)
        : null;

      const aniversarioHoje = !!c.data_nascimento && c.data_nascimento.slice(5, 10) === todayMD;

      const last = list[0];
      const ultimoPedido: UltimoPedido | null = last
        ? {
            produto: last.product,
            quantidade: last.quantity,
            preco: last.price,
            tipo_venda: last.tipo_venda,
            pagamento: last.payment_method,
            data: last.created_at,
          }
        : null;

      return {
        cliente_id: c.id,
        cliente_nome: c.name,
        cliente_phone: c.phone,
        ultima_compra: ultima,
        total_compras: list.length,
        media_dias: media,
        proxima_prevista: proxima,
        dias_desde_ultima: diasDesde,
        status: calcStatus(diasDesde, media),
        aniversario_hoje: aniversarioHoje,
        data_nascimento: c.data_nascimento,
        ultimo_pedido: ultimoPedido,
      };
    }).sort((a, b) => {
      const order = { atrasado: 0, hora_comprar: 1, em_dia: 2, novo: 3 };
      return order[a.status] - order[b.status];
    });
  }, [clientes, orders]);

  return { insights, loading };
}
