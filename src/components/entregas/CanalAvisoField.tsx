import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CANAIS_AVISO, type CanalAviso } from "@/lib/avisoWhatsapp";
import { impedimentoAviso, type EntregadorApp } from "@/hooks/useEntregadoresApp";

/** Canal obrigatório do aviso ao entregador (App + WhatsApp / Só WhatsApp) e situação do telefone vinculado. */
export function CanalAvisoField({ value, onChange, entregador }: {
  value: CanalAviso | ""; onChange: (v: CanalAviso) => void; entregador?: EntregadorApp | null;
}) {
  const imp = impedimentoAviso(entregador);
  return (
    <div className="space-y-2 rounded-md border p-3 text-sm">
      <p className="font-medium">Aviso ao entregador *</p>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as CanalAviso)}>
        {CANAIS_AVISO.map((c) => (
          <div key={c.valor} className="flex items-start gap-2">
            <RadioGroupItem id={`canal-${c.valor}`} value={c.valor} disabled={!c.disponivel} className="mt-0.5" />
            <Label htmlFor={`canal-${c.valor}`} className={`font-normal ${c.disponivel ? "" : "text-muted-foreground"}`}>
              {c.rotulo}
              <span className="block text-xs text-muted-foreground">{c.nota}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
      {entregador && (imp
        ? <p className="text-xs text-destructive">{imp}</p>
        : <p className="text-xs text-muted-foreground">WhatsApp do entregador: final {entregador.telefoneFinal}.</p>)}
    </div>
  );
}
