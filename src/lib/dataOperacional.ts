/**
 * Data operacional da empresa: a data civil em America/Bahia (UTC-3, sem horário de verão).
 * Módulo puro (sem rede). O servidor tem a mesma regra em `public.data_operacional()` (SQL 006).
 *
 * Por que: `new Date().toISOString().slice(0,10)` é a data em UTC — entre 21:00 e 23:59 em Bahia
 * já é "amanhã" — e o `CURRENT_DATE` do banco no Cloud também é UTC.
 */
export const FUSO_OPERACIONAL = "America/Bahia";

/** "AAAA-MM-DD" do instante `d` no fuso operacional. */
export function dataOperacional(d: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_OPERACIONAL, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}`;
}

/** Regra antiga (data em UTC), mantida só enquanto o banco publicado não tem o SQL 006. */
export function dataUTC(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Soma dias a uma data "AAAA-MM-DD" (sem depender do fuso da máquina). */
export function somarDias(data: string, dias: number): string {
  const [a, m, d] = data.split("-").map(Number);
  const t = Date.UTC(a, m - 1, d) + dias * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}
