import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFechamentoDeHoje } from "@/pages/entrance/hooks/useFechamentosCaixa";
import { useNavigate } from "react-router-dom";
import { ToastAction } from "@/components/ui/toast";

const REMINDER_HOUR = 17;
const DISMISS_KEY = "portaria:lembrete-fechamento";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Lembra o operador de fazer o fechamento do caixa da portaria
 * a partir das 17:00, enquanto o dia não tiver fechamento total.
 */
export function FechamentoReminder() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: fechamentoHoje } = useFechamentoDeHoje();
  const lastShown = useRef<string>("");

  useEffect(() => {
    const check = () => {
      const now = new Date();
      if (now.getHours() < REMINDER_HOUR) return;
      if (fechamentoHoje) return;

      const hoje = todayStr();
      if (localStorage.getItem(DISMISS_KEY) === hoje) return;

      // mostra no máximo 1x por hora
      const slot = `${hoje}-${now.getHours()}`;
      if (lastShown.current === slot) return;
      lastShown.current = slot;

      toast({
        title: "Hora de fechar o caixa da portaria",
        description:
          "O caixa de hoje ainda não foi fechado. Confira os valores e a contagem de estoque antes de encerrar o dia.",
        duration: 15000,
        action: (
          <ToastAction
            altText="Abrir fechamento"
            onClick={() => navigate("/entrance?fechamento=1")}
          >
            Fechar caixa
          </ToastAction>
        ),
      });
    };

    check();
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [fechamentoHoje, toast, navigate]);

  return null;
}
