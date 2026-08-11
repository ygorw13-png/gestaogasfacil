import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2, MessageCircle } from "lucide-react";
import { normalizePhone } from "@/utils/whatsappLinks";
import { useEnviarWhatsApp } from "@/hooks/useEnviarWhatsApp";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps extends Omit<ButtonProps, "onClick"> {
  phone?: string | null;
  message: string;
  label?: string;
  iconOnly?: boolean;
  /** Categoria do aviso, usada no histórico de mensagens. */
  tipo?: string;
  /** Id do pedido/nota relacionado, para rastreio. */
  referenciaId?: string | null;
  nome?: string | null;
  onSent?: () => void;
}

export function WhatsAppButton({
  phone,
  message,
  label = "WhatsApp",
  iconOnly = false,
  tipo = "manual",
  referenciaId,
  nome,
  onSent,
  className,
  variant = "outline",
  size = iconOnly ? "icon" : "sm",
  ...rest
}: WhatsAppButtonProps) {
  const valid = !!normalizePhone(phone);
  const { enviar, enviando } = useEnviarWhatsApp();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await enviar({
      telefone: phone,
      mensagem: message,
      nome,
      tipo,
      referencia_id: referenciaId ?? null,
    });
    onSent?.();
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={!valid || enviando}
      title={valid ? "Enviar no WhatsApp" : "Sem telefone válido"}
      onClick={handleClick}
      className={cn("text-emerald-700 hover:text-emerald-800", className)}
      {...rest}
    >
      {enviando ? (
        <Loader2 className={cn("h-4 w-4 animate-spin", !iconOnly && "mr-1")} />
      ) : (
        <MessageCircle className={cn("h-4 w-4", !iconOnly && "mr-1")} />
      )}
      {!iconOnly && label}
    </Button>
  );
}
