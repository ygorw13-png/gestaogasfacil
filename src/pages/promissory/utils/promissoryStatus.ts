import { PromissoryNote } from "../types";

export type Severity = "critico" | "vencido" | "proximo" | "emdia";

const DIA = 1000 * 60 * 60 * 24;

export function diasAtraso(dueDate: Date) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = new Date(dueDate);
  d.setHours(0, 0, 0, 0);
  return Math.round((hoje.getTime() - d.getTime()) / DIA);
}

/** critico: vencida há mais de 30 dias | vencido: vencida | proximo: vence em até 5 dias */
export function noteSeverity(note: PromissoryNote): Severity {
  const atraso = diasAtraso(note.dueDate);
  if (atraso > 30) return "critico";
  if (atraso > 0) return "vencido";
  if (atraso >= -5) return "proximo";
  return "emdia";
}

export function worstSeverity(notes: PromissoryNote[]): Severity {
  const order: Severity[] = ["critico", "vencido", "proximo", "emdia"];
  return notes.map(noteSeverity).sort((a, b) => order.indexOf(a) - order.indexOf(b))[0] ?? "emdia";
}

export function severityBadgeClass(sev: Severity) {
  switch (sev) {
    case "critico":
      return "border-destructive bg-destructive/10 text-destructive";
    case "vencido":
      return "border-destructive/60 bg-destructive/5 text-destructive";
    case "proximo":
      return "border-warning bg-warning/10 text-warning-foreground";
    default:
      return "";
  }
}

export function severityRowClass(sev: Severity) {
  switch (sev) {
    case "critico":
      return "border-l-4 border-l-destructive bg-destructive/5";
    case "vencido":
      return "border-l-4 border-l-destructive/50";
    case "proximo":
      return "border-l-4 border-l-warning bg-warning/5";
    default:
      return "border-l-4 border-l-transparent";
  }
}

export function severityLabel(sev: Severity, atraso: number) {
  switch (sev) {
    case "critico":
      return `Vencida há ${atraso} dias`;
    case "vencido":
      return `Vencida há ${atraso} dia${atraso > 1 ? "s" : ""}`;
    case "proximo":
      return atraso === 0 ? "Vence hoje" : `Vence em ${Math.abs(atraso)} dia${Math.abs(atraso) > 1 ? "s" : ""}`;
    default:
      return "Em dia";
  }
}
