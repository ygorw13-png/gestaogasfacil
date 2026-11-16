// Núcleo do aviso de entrega pelo WhatsApp oficial (sem dependências: testado também pelo vitest).

export const GATEWAY_URL = "https://connector-gateway.lovable.dev/whatsapp";
export const MODELO_PADRAO = "gasfacil_entrega_atribuida";

/** Texto do modelo (categoria UTILITY, pt_BR). 8 variáveis, nesta ordem. */
export const TEXTO_MODELO =
  "Nova entrega do GásFácil para você. Pedido {{1}}. Cliente: {{2}}. Endereço: {{3}}. " +
  "Produto: {{4}}, quantidade {{5}}. Valor: {{6}}. Pagamento: {{7}}. Observações: {{8}}. " +
  "Confira os dados antes de sair e responda pelo aplicativo do GásFácil.";

export const EXEMPLO_MODELO = ["#A1B2C3D4", "Maria Exemplo", "Rua Exemplo, 10, Centro", "GLP P13", "2", "R$ 240,00", "Dinheiro", "Portão azul"];

/** Os mesmos 8 nomes de src/lib/formasPagamento.ts (FORMAS_PAGAMENTO[].nome), pelo código gravado. */
export const NOMES_FORMA: Record<string, string> = {
  money: "Dinheiro", pix: "PIX", credit: "Crédito", debit: "Débito", promissoria: "Nota promissória",
  "vale-gas": "Vale-gás", "gas-povo": "Gás do Povo", convenio: "Convênio",
};

export interface PedidoAviso {
  id: string; client_name?: string | null; address?: Record<string, unknown> | null; product?: string | null;
  quantity?: number | null; price?: number | string | null; payment_method?: string | null; notes?: string | null;
}

export const numeroPedido = (id: string) => `#${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

/** Parâmetro de modelo: sem quebra de linha/tab, sem espaços repetidos, nunca vazio. */
export function param(v: unknown, vazio = "não informado"): string {
  const s = String(v ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 300);
  return s || vazio;
}

export function enderecoTexto(a?: Record<string, unknown> | null): string {
  if (!a) return "";
  return ["street", "number", "complement", "neighborhood", "city", "reference"]
    .map((k) => String(a[k] ?? "").trim()).filter(Boolean).join(", ");
}

export function parametrosAviso(o: PedidoAviso): string[] {
  const preco = o.price === null || o.price === undefined || o.price === "" ? null : Number(o.price);
  const valor = preco !== null && Number.isFinite(preco) && preco > 0
    ? preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\u00a0/g, " ")
    : "não informado";
  const forma = o.payment_method ? (NOMES_FORMA[o.payment_method] ?? o.payment_method) : "";
  return [numeroPedido(o.id), param(o.client_name), param(enderecoTexto(o.address)), param(o.product),
    param(o.quantity ?? 1), valor, param(forma), param(o.notes, "nenhuma")];
}

export function corpoModelo(telefone: string, modelo: string, idioma: string, params: string[]) {
  return {
    messaging_product: "whatsapp", to: telefone, type: "template",
    template: { name: modelo, language: { code: idioma }, components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] },
  };
}

export type Resultado = { status: "enviado" | "falha" | "incerto"; id: string | null; erro: string | null };

/** Classifica a resposta: 2xx com id = enviado à plataforma; 4xx = falha (não saiu); 5xx/sem id/rede = incerto. */
export function classificar(httpStatus: number | null, corpo: string): Resultado {
  if (httpStatus === null) return { status: "incerto", id: null, erro: `Sem resposta da plataforma: ${corpo}`.slice(0, 500) };
  let j: any = null;
  try { j = JSON.parse(corpo); } catch { /* corpo não-JSON */ }
  if (httpStatus >= 200 && httpStatus < 300) {
    const id = j?.messages?.[0]?.id ?? null;
    return id ? { status: "enviado", id, erro: null } : { status: "incerto", id: null, erro: `Resposta sem identificador: ${corpo}`.slice(0, 500) };
  }
  const msg = j?.error?.error_user_msg ?? j?.error?.message ?? j?.message ?? corpo;
  if (httpStatus >= 500) return { status: "incerto", id: null, erro: `[${httpStatus}] ${msg}`.slice(0, 500) };
  return { status: "falha", id: null, erro: `[${httpStatus}] ${msg}`.slice(0, 500) };
}

/** Motivo para não enviar antes de tocar na plataforma (null = pode enviar). */
export function impedimento(cfg: { modelo?: string | null; envio_ativo?: boolean | null } | null, conectado: boolean): string | null {
  if (!conectado) return "WhatsApp da empresa não conectado (Configurações > WhatsApp)";
  if (!cfg?.modelo) return "Modelo de mensagem não configurado (Configurações > WhatsApp)";
  if (!cfg.envio_ativo) return "Envio pelo WhatsApp não ativado pelo administrador (Configurações > WhatsApp)";
  return null;
}

/** Número de teste da Meta (sandbox ou +1 555…) nunca é tratado como o número da empresa. */
export function ambienteNumero(n: { display_phone_number?: string | null; account_mode?: string | null } | null | undefined): "teste" | "producao" | "desconhecido" {
  if (!n || typeof n !== "object") return "desconhecido";
  const digitos = String(n.display_phone_number ?? "").replace(/\D/g, "");
  if (String(n.account_mode ?? "").toUpperCase() === "SANDBOX" || /^1555/.test(digitos)) return "teste";
  if (!digitos) return "desconhecido";
  return "producao";
}

/** Motivo para recusar ligar o envio automático (null = pode ligar). */
export function motivoNaoAtivar(ambiente: string, statusModelo: string | null | undefined): string | null {
  if (ambiente === "teste") return "O WhatsApp conectado é um número de teste da Meta, não o número da empresa. Conecte o número real antes de ligar o envio.";
  if (ambiente !== "producao") return "Não foi possível confirmar o número conectado.";
  if (statusModelo !== "APPROVED") return "O modelo de mensagem ainda não foi aprovado pela Meta.";
  return null;
}
