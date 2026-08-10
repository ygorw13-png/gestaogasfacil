import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Reseller } from "../types";

interface ResellerRow {
  id: string;
  name: string;
  phone: string | null;
  contact_person: string | null;
  address: string | null;
  price_p13: number;
  notes: string | null;
  active: boolean;
  created_at: string;
}

const toReseller = (r: ResellerRow): Reseller => ({
  id: r.id,
  name: r.name,
  phone: r.phone ?? "",
  address: r.address ?? undefined,
  contactPerson: r.contact_person ?? undefined,
  priceP13: Number(r.price_p13 ?? 0),
  priceP20: 0,
  priceP45: 0,
  priceWater: 0,
  notes: r.notes ?? undefined,
  createdAt: new Date(r.created_at),
});

export interface ResellerInput {
  name: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  priceP13?: number;
  notes?: string;
}

export function useResellers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["resellers"],
    queryFn: async (): Promise<Reseller[]> => {
      const { data, error } = await supabase
        .from("resellers")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data as ResellerRow[]).map(toReseller);
    },
  });

  const createReseller = useMutation({
    mutationFn: async (input: ResellerInput) => {
      const { error } = await supabase.from("resellers").insert({
        name: input.name,
        phone: input.phone ?? null,
        contact_person: input.contactPerson ?? null,
        address: input.address ?? null,
        price_p13: input.priceP13,
        notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agregado cadastrado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["resellers"] });
    },
    onError: (e: Error) => toast.error(`Erro ao cadastrar: ${e.message}`),
  });

  const removeReseller = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resellers").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agregado removido");
      queryClient.invalidateQueries({ queryKey: ["resellers"] });
    },
    onError: (e: Error) => toast.error(`Erro ao remover: ${e.message}`),
  });

  return {
    resellers: query.data ?? [],
    isLoading: query.isLoading,
    createReseller,
    removeReseller,
  };
}

export interface ResellerSale {
  id: string;
  date: string;
  resellerName: string;
  product: string | null;
  quantity: number;
  price: number;
}

export function useResellerSales() {
  return useQuery({
    queryKey: ["reseller-sales"],
    queryFn: async (): Promise<ResellerSale[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, product, quantity, price, client_name, reseller_id, resellers(name)")
        .not("reseller_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as any[]).map((o) => ({
        id: o.id,
        date: o.created_at,
        resellerName: o.resellers?.name ?? o.client_name,
        product: o.product,
        quantity: Number(o.quantity ?? 0),
        price: Number(o.price ?? 0),
      }));
    },
  });
}
