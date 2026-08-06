import { formatAddress, mapsRouteUrl } from "@/utils/mapsLinks";

/** Normaliza telefone brasileiro para o formato aceito pelo wa.me (55 + DDD + número). */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (!digits.startsWith("55")) digits = `55${digits}`;
  // 55 + DDD(2) + 8 ou 9 dígitos
  if (digits.length < 12 || digits.length > 13) return null;
  return digits;
}

/** Monta o link wa.me com a mensagem já preenchida. Retorna null se o telefone for inválido. */
export function waUrl(phone: string | null | undefined, message: string): string | null {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Abre o WhatsApp em nova aba. Retorna false se não foi possível (telefone inválido). */
export function openWhatsApp(phone: string | null | undefined, message: string): boolean {
  const url = waUrl(phone, message);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

type OrderLike = {
  clientName?: string;
  clientPhone?: string;
  address?: any;
  product?: string;
  quantity?: number;
  price?: number;
  notes?: string;
  paymentMethod?: string;
};

function firstName(name?: string) {
  return (name || "").trim().split(" ")[0] || "";
}

function money(v?: number) {
  return typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "";
}

/** Mensagem para o entregador quando uma entrega é atribuída a ele. */
export function msgEntregaAtribuida(order: OrderLike, entregadorNome?: string): string {
  const endereco = formatAddress(order.address);
  const linhas = [
    `Olá${entregadorNome ? ` ${firstName(entregadorNome)}` : ""}! 🛵 Nova entrega atribuída a você.`,
    "",
    `👤 Cliente: ${order.clientName || "-"}`,
    order.clientPhone ? `📞 Telefone: ${order.clientPhone}` : null,
    `📍 Endereço: ${endereco || "-"}`,
    order.product ? `📦 Produto: ${order.product}${order.quantity ? ` (${order.quantity}x)` : ""}` : null,
    order.price ? `💰 Valor: ${money(order.price)}` : null,
    order.paymentMethod ? `💳 Pagamento: ${order.paymentMethod}` : null,
    order.notes ? `📝 Obs: ${order.notes}` : null,
    "",
    endereco ? `🗺️ Rota: ${mapsRouteUrl(order.address)}` : null,
    "",
    "➡️ Abra o app e *aceite a entrega* para confirmarmos na portaria.",
  ].filter(Boolean);
  return linhas.join("\n");
}

/** Mensagem para o cliente avisando que o pedido saiu para entrega. */
export function msgSaiuParaEntrega(order: OrderLike, entregadorNome?: string): string {
  return [
    `Olá ${firstName(order.clientName)}! 🚚 Seu pedido saiu para entrega.`,
    entregadorNome ? `Entregador: ${firstName(entregadorNome)}` : null,
    order.product ? `Pedido: ${order.product}${order.quantity ? ` (${order.quantity}x)` : ""}` : null,
    order.price ? `Valor: ${money(order.price)}` : null,
    "",
    "Qualquer coisa é só responder por aqui. 😉",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Mensagem de confirmação do pedido recebido. */
export function msgPedidoConfirmado(order: OrderLike): string {
  return [
    `Olá ${firstName(order.clientName)}! ✅ Recebemos seu pedido.`,
    order.product ? `Pedido: ${order.product}${order.quantity ? ` (${order.quantity}x)` : ""}` : null,
    order.address ? `Endereço: ${formatAddress(order.address)}` : null,
    order.price ? `Valor: ${money(order.price)}` : null,
    "",
    "Já estamos separando e avisamos quando sair para entrega. 🔥",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Mensagem de cobrança de nota promissória. */
export function msgPromissoria(params: {
  clientName: string;
  value: number;
  dueDate: Date | string;
  vencida?: boolean;
}): string {
  const venc =
    typeof params.dueDate === "string"
      ? new Date(params.dueDate).toLocaleDateString("pt-BR")
      : params.dueDate.toLocaleDateString("pt-BR");
  return params.vencida
    ? [
        `Olá ${firstName(params.clientName)}! 😊`,
        `Passando para lembrar da nota promissória de ${money(params.value)}, com vencimento em ${venc}.`,
        "Se já tiver pago, pode desconsiderar. Qualquer dúvida é só chamar!",
      ].join("\n")
    : [
        `Olá ${firstName(params.clientName)}! 😊`,
        `Sua nota promissória de ${money(params.value)} vence em ${venc}.`,
        "Qualquer dúvida é só chamar por aqui!",
      ].join("\n");
}

/** Mensagem de cobrança de vasilhame emprestado (casco). */
export function msgCascoEmprestado(clientName: string, quantidade: number, dias: number): string {
  return [
    `Olá ${firstName(clientName)}! 👋`,
    `Consta com você ${quantidade} vasilhame(s) emprestado(s) há ${dias} dias.`,
    "Pode nos avisar quando puder devolver ou se prefere já converter na próxima recarga?",
  ].join("\n");
}

type UltimoPedidoLike = {
  produto?: string | null;
  quantidade?: number | null;
  preco?: number | null;
  tipo_venda?: string | null;
  pagamento?: string | null;
  data?: string | null;
} | null;

const TIPO_VENDA_LABEL: Record<string, string> = {
  completa: "gás completo (com vasilhame)",
  recarga: "recarga (troca de vasilhame)",
  vasilhame: "somente vasilhame",
};

/** Resumo curto do último pedido, usado nas mensagens de recompra. */
export function resumoUltimoPedido(up: UltimoPedidoLike): string | null {
  if (!up) return null;
  const partes = [
    up.quantidade ? `${up.quantidade}x` : null,
    up.produto || "gás",
    up.tipo_venda ? `(${TIPO_VENDA_LABEL[up.tipo_venda] || up.tipo_venda})` : null,
    typeof up.preco === "number" && up.preco > 0 ? `— ${money(up.preco)}` : null,
  ].filter(Boolean);
  return partes.join(" ");
}

/**
 * Mensagem de recompra baseada no histórico do CRM.
 * - `pre`: lembrete de que está na hora de recomprar
 * - `atrasado`: cliente passou da média de dias
 * - `pos`: pós-venda logo após a entrega
 * - `aniversario`: felicitação
 */
export function msgRecompra(params: {
  clientName: string;
  tipo: "pre" | "atrasado" | "pos" | "aniversario";
  diasDesdeUltima?: number | null;
  mediaDias?: number | null;
  ultimoPedido?: UltimoPedidoLike;
}): string {
  const nome = firstName(params.clientName);
  const resumo = resumoUltimoPedido(params.ultimoPedido);
  const sugestao = resumo
    ? [
        "",
        `Seu último pedido foi: *${resumo}*.`,
        "Quer que eu repita o mesmo pedido? É só responder *SIM* que já deixamos separado. 🔥",
      ]
    : ["", "Quer que a gente já agende sua entrega? É só responder por aqui. 🔥"];

  if (params.tipo === "aniversario") {
    return [
      `Feliz aniversário, ${nome}! 🎂`,
      "Toda a equipe deseja muitas felicidades — conta com a gente sempre!",
      ...(resumo ? ["", `Se precisar repetir seu último pedido (${resumo}), é só chamar. 😉`] : []),
    ].join("\n");
  }

  if (params.tipo === "pos") {
    return [
      `Olá ${nome}! 😊 Tudo certo com sua última entrega?`,
      resumo ? `Pedido: ${resumo}.` : null,
      "",
      "Se algo não saiu como esperado, me conta por aqui que a gente resolve rapidinho.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (params.tipo === "atrasado") {
    const linha1 = params.mediaDias
      ? `Olá ${nome}! 👋 Já faz ${params.diasDesdeUltima ?? "alguns"} dias desde sua última compra de gás e normalmente você recompra a cada ${params.mediaDias} dias.`
      : `Olá ${nome}! 👋 Já faz ${params.diasDesdeUltima ?? "alguns"} dias desde sua última compra de gás.`;
    return [linha1, "Não queremos que o seu acabe na hora do almoço 😅", ...sugestao].join("\n");
  }

  return [
    `Oi ${nome}! 👋 Notamos que já faz ${params.diasDesdeUltima ?? "alguns"} dias da sua última compra de gás.`,
    ...sugestao,
  ].join("\n");
}
