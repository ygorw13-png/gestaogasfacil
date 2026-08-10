import { supabase } from "@/integrations/supabase/client";

export const PROMISSORY_TERM_DAYS = 30;

export function isPromissoryPayment(method?: string | null) {
  if (!method) return false;
  const m = method.toLowerCase();
  return m === "promissoria" || m === "promissória" || m === "promissory";
}

export function promissoryDueDate(from: Date = new Date()) {
  const due = new Date(from);
  due.setDate(due.getDate() + PROMISSORY_TERM_DAYS);
  return due.toISOString().slice(0, 10);
}

interface CreateArgs {
  clientId?: string | null;
  clientName: string;
  value: number;
  referenceId?: string | null;
  description?: string;
}

/**
 * Cria a nota promissória (vencimento em 30 dias) de uma venda a prazo.
 * Evita duplicidade usando o id da venda na observação.
 */
export async function createPromissoryFromSale({
  clientId,
  clientName,
  value,
  referenceId,
  description,
}: CreateArgs): Promise<{ error: string | null; skipped?: boolean }> {
  const tag = referenceId ? `[venda:${referenceId}]` : "";

  if (referenceId) {
    const { data: existing } = await supabase
      .from("promissory_notes")
      .select("id")
      .like("notes", `%${tag}%`)
      .limit(1);
    if (existing && existing.length > 0) return { error: null, skipped: true };
  }

  const { error } = await supabase.from("promissory_notes").insert({
    client_id: clientId || null,
    client_name: clientName,
    value: Number(value) || 0,
    due_date: promissoryDueDate(),
    status: "pending",
    notes: [description, tag].filter(Boolean).join(" "),
  } as any);

  return { error: error?.message ?? null };
}
