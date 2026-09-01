import { readPrinterSettings, type PrinterSettings } from "@/hooks/usePrinterSettings";

export interface ReceiptData {
  id?: string;
  clientName: string;
  clientPhone?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
  };
  product: string;
  quantity: number;
  price?: number;
  paymentMethod?: string;
  notes?: string;
  createdAt?: Date;
}

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const esc = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

function buildHtml(data: ReceiptData, s: PrinterSettings) {
  const width = s.paperWidth === "58mm" ? "58mm" : "80mm";
  const created = data.createdAt ?? new Date();
  const addr = data.address
    ? [
        [data.address.street, data.address.number].filter(Boolean).join(", "),
        data.address.complement,
        data.address.neighborhood,
      ]
        .filter(Boolean)
        .join(" - ")
    : "";
  const total = (data.price ?? 0) || 0;

  const body = `
    <div class="center bold big">${esc(s.headerText || "")}</div>
    <div class="center">CUPOM NAO FISCAL</div>
    <div class="line"></div>
    <div>Data: ${created.toLocaleString("pt-BR")}</div>
    ${data.id ? `<div>Pedido: ${esc(String(data.id).slice(0, 8))}</div>` : ""}
    <div class="line"></div>
    <div class="bold">CLIENTE</div>
    <div>${esc(data.clientName || "-")}</div>
    ${data.clientPhone ? `<div>Tel: ${esc(data.clientPhone)}</div>` : ""}
    ${addr ? `<div>${esc(addr)}</div>` : ""}
    <div class="line"></div>
    <div class="row bold"><span>ITEM</span><span>QTD</span></div>
    <div class="row"><span>${esc(data.product || "-")}</span><span>${data.quantity ?? 0}</span></div>
    <div class="line"></div>
    <div class="row bold big"><span>TOTAL</span><span>${money(total)}</span></div>
    ${data.paymentMethod ? `<div>Pagamento: ${esc(data.paymentMethod)}</div>` : ""}
    ${data.notes ? `<div class="line"></div><div>Obs: ${esc(data.notes)}</div>` : ""}
    <div class="line"></div>
    <div class="center">${esc(s.footerText || "")}</div>
    <div class="feed"></div>
  `;

  const copies = Array.from({ length: Math.max(1, s.copies) }, () => body).join(
    '<div class="cut"></div>'
  );

  return `<!doctype html><html><head><meta charset="utf-8" />
  <title>Cupom</title>
  <style>
    @page { size: ${width} auto; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body { width: ${width}; font-family: "Courier New", monospace; font-size: 12px; color: #000; padding: 4mm 3mm; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .big { font-size: 14px; }
    .line { border-top: 1px dashed #000; margin: 4px 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    .feed { height: 10mm; }
    .cut { page-break-after: always; }
  </style></head><body>${copies}</body></html>`;
}

/** Abre a caixa de impressão do navegador com o cupom formatado para impressora térmica. */
export function printReceipt(data: ReceiptData, override?: Partial<PrinterSettings>) {
  const settings = { ...readPrinterSettings(), ...override };
  const html = buildHtml(data, settings);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  const run = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => iframe.remove(), 2000);
    }
  };

  if (iframe.contentWindow?.document.readyState === "complete") run();
  else iframe.onload = run;
}
