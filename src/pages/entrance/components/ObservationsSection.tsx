
import { Textarea } from "@/components/ui/textarea";

export const ObservationsSection = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Observações</h3>
      <textarea 
        className="w-full min-h-[100px] p-3 border rounded-md resize-y"
        placeholder="Digite observações sobre o fechamento de caixa..."
      />
    </div>
  );
};
