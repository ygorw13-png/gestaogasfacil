import { Button, type ButtonProps } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { openWhatsApp, normalizePhone } from "@/utils/whatsappLinks";
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!openWhatsApp(phone, message)) {
      toast.error("Telefone inválido ou não cadastrado");
      return;
    }
    onSent?.();
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={!valid}
      title={valid ? `Enviar no WhatsApp` : "Sem telefone válido"}
      onClick={handleClick}
      className={cn("text-emerald-700 hover:text-emerald-800", className)}
      {...rest}
    >
      <MessageCircle className={cn("h-4 w-4", !iconOnly && "mr-1")} />
      {!iconOnly && label}
    </Button>
  );
}
