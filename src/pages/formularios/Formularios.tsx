import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Info, Printer } from "lucide-react";
import {
  gerarFolhaRota,
  gerarFolhaVendasPortaria,
  gerarFolhaFechamentoManual,
} from "@/utils/formulariosPdf";

const FORMULARIOS = [
  {
    titulo: "Folha de Rota (entregador)",
    descricao:
      "Para levar na moto/carro quando não há sinal. O entregador anota cliente, quantidade, forma de pagamento, vasilhame devolvido e as despesas da rota.",
    acao: () => gerarFolhaRota(),
    botao: "Imprimir folha de rota",
  },
  {
    titulo: "Vendas da Portaria (manual)",
    descricao:
      "Para dias sem internet, sem energia, com problema no PC — ou para quem ainda não sabe usar o sistema (fins de semana e feriados). Uma linha por venda.",
    acao: () => gerarFolhaVendasPortaria(),
    botao: "Imprimir folha de vendas",
  },
  {
    titulo: "Fechamento de Caixa (manual)",
    descricao:
      "Folha em branco para fechar o caixa no papel: totais por forma de pagamento, contagem de cheios e vazios, despesas e assinaturas.",
    acao: () => gerarFolhaFechamentoManual(),
    botao: "Imprimir folha de fechamento",
  },
];

export default function Formularios() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Formulários para Impressão</h1>
        <p className="text-muted-foreground">
          Imprima as folhas, preencha à mão e depois lance no sistema com calma.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como usar</AlertTitle>
        <AlertDescription>
          1. Imprima algumas cópias e deixe na portaria e no veículo. 2. Anote tudo à mão durante o
          dia ou a rota. 3. Quando o sistema estiver disponível, lance as vendas em{" "}
          <strong>Portaria → Nova Venda</strong> e as despesas em <strong>Financeiro → Despesas</strong>.
          4. Guarde a folha preenchida junto ao envelope do dia.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        {FORMULARIOS.map((f) => (
          <Card key={f.titulo} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                {f.titulo}
              </CardTitle>
              <CardDescription>{f.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button className="w-full gap-2" onClick={f.acao}>
                <Printer className="h-4 w-4" />
                {f.botao}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
