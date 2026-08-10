import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditarVenda } from "../../hooks/useEditarVenda";

const PRODUTOS = ["GLP P13", "GLP P20", "GLP P45", "Vasilhame P13", "Água 20L"];

const PAGAMENTOS = [
  { value: "money", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credit", label: "Crédito" },
  { value: "debit", label: "Débito" },
  { value: "promissoria", label: "Promissória" },
  { value: "convenio", label: "Convênio" },
  { value: "gas-povo", label: "Gás-Povo" },
  { value: "vale-gas", label: "Vale Gás" },
];

interface EditSaleButtonProps {
  saleId: string;
  client: string;
  product: string;
  quantity: number;
  amount: number;
  paymentCode?: string;
}

export function EditSaleButton({
  saleId,
  client,
  product,
  quantity,
  amount,
  paymentCode,
}: EditSaleButtonProps) {
  const editar = useEditarVenda();
  const [open, setOpen] = useState(false);
  const [prod, setProd] = useState(product);
  const [qtd, setQtd] = useState(String(quantity));
  const [valor, setValor] = useState(String(amount ?? 0));
  const [pagamento, setPagamento] = useState(paymentCode || "money");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (open) {
      setProd(PRODUTOS.includes(product) ? product : PRODUTOS[0]);
      setQtd(String(quantity));
      setValor(String(amount ?? 0));
      setPagamento(paymentCode || "money");
      setMotivo("");
    }
  }, [open, product, quantity, amount, paymentCode]);

  const qtdNum = Number(qtd);
  const valido = qtdNum > 0 && motivo.trim().length >= 3;

  const salvar = () => {
    if (!valido) return;
    editar.mutate(
      {
        orderId: saleId,
        product: prod,
        quantity: qtdNum,
        price: Number(valor) || 0,
        payment_method: pagamento,
        motivo: motivo.trim(),
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="mr-1 h-4 w-4" /> Editar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar venda</DialogTitle>
            <DialogDescription>
              {client} — o estoque da portaria e a ficha do parceiro são ajustados pela diferença.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={prod} onValueChange={setProd}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUTOS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`qtd-${saleId}`}>Quantidade</Label>
                <Input
                  id={`qtd-${saleId}`}
                  type="number"
                  min={1}
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`valor-${saleId}`}>Valor total (R$)</Label>
                <Input
                  id={`valor-${saleId}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={pagamento} onValueChange={setPagamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGAMENTOS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`motivo-edicao-${saleId}`}>Motivo da correção</Label>
              <Textarea
                id={`motivo-edicao-${saleId}`}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: quantidade lançada errada, valor incorreto..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={!valido || editar.isPending}>
              {editar.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
