import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface PendingClient {
  name: string;
  phone: string;
  address: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
  };
}

interface Props {
  pending: PendingClient | null;
  onClose: () => void;
}

const onlyDigits = (v?: string) => (v || "").replace(/\D/g, "");

/**
 * Após lançar um pedido, verifica se o cliente já existe na base
 * (por telefone ou nome). Se não existir, oferece o cadastro.
 */
export default function SaveClientPrompt({ pending, onClose }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (!pending) {
      setOpen(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase.from("clients").select("id, name, phone");
      if (!active) return;
      if (error) {
        setOpen(false);
        onClose();
        return;
      }
      const phone = onlyDigits(pending.phone);
      const name = (pending.name || "").trim().toLowerCase();
      const exists = (data || []).some((c: any) => {
        const cPhone = onlyDigits(c.phone);
        if (phone && cPhone && cPhone === phone) return true;
        return !phone && (c.name || "").trim().toLowerCase() === name;
      });
      if (exists) {
        onClose();
        return;
      }
      setOpen(true);
    })();
    return () => {
      active = false;
    };
  }, [pending, onClose]);

  const handleSave = async () => {
    if (!pending) return;
    setSaving(true);
    const { error } = await supabase.from("clients").insert({
      name: pending.name,
      phone: onlyDigits(pending.phone) || null,
      address: pending.address || {},
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao cadastrar cliente", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente cadastrado", description: `${pending.name} foi adicionado à base de clientes.` });
    setOpen(false);
    onClose();
  };

  const handleCancel = () => {
    setOpen(false);
    onClose();
  };

  const endereco = pending
    ? [
        pending.address?.street && `${pending.address.street}${pending.address.number ? `, ${pending.address.number}` : ""}`,
        pending.address?.neighborhood,
      ]
        .filter(Boolean)
        .join(" - ")
    : "";

  return (
    <AlertDialog open={open} onOpenChange={(v) => (!v ? handleCancel() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cadastrar este cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              <strong>{pending?.name}</strong>
              {pending?.phone ? ` • ${pending.phone}` : ""}
            </span>
            {endereco && <span className="block text-xs">{endereco}</span>}
            <span className="mt-2 block">
              Ele ainda não está na base de clientes. Deseja cadastrar para facilitar os próximos pedidos?
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={saving}>
            Agora não
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleSave();
            }}
            disabled={saving}
          >
            {saving ? "Cadastrando..." : "Cadastrar cliente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
