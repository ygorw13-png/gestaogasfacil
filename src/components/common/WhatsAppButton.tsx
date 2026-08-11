import { Button, type ButtonProps } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { normalizePhone, waUrl } from "@/utils/whatsappLinks";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps extends Omit<ButtonProps, "onClick"> {
  phone?: string | null;
  message: string;
  label?: string;
  iconOnly?: boolean;
  onSent?: () => void;
}

export function WhatsAppButton({
  phone,
  message,
  label = "WhatsApp",
  iconOnly = false,
  onSent,
  className,
  variant = "outline",
  size = iconOnly ? "icon" : "sm",
  ...rest
}: WhatsAppButtonProps) {
  const valid = !!normalizePhone(phone);
  const url = waUrl(phone, message);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) {
      e.preventDefault();
      navigator.clipboard?.writeText(message).catch(() => {});
      toast.error("Não foi possível abrir o WhatsApp. Mensagem copiada — cole no app.");
      return;
    }
    onSent?.();
  };

  return (
    <Button
      asChild={valid}
      type="button"
      variant={variant}
      size={size}
      disabled={!valid}
      title={valid ? `Enviar no WhatsApp` : "Sem telefone válido"}
      onClick={handleClick}
      className={cn("text-emerald-700 hover:text-emerald-800", className)}
      {...rest}
    >
      {valid && url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <MessageCircle className={cn("h-4 w-4", !iconOnly && "mr-1")} />
          {!iconOnly && label}
        </a>
      ) : (
        <>
          <MessageCircle className={cn("h-4 w-4", !iconOnly && "mr-1")} />
          {!iconOnly && label}
        </>
      )}
    </Button>
  );
}
