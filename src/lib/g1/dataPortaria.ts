import { dataOperacional, dataUTC } from "@/lib/dataOperacional";

/**
 * Dia da portaria usado pelas telas. Ativação coordenada com o SQL 006:
 *  - VITE_G1_ACOES=on  → America/Bahia (o banco grava `data_operacional()` no mesmo fuso);
 *  - desligado         → data UTC, igual ao `CURRENT_DATE` do banco publicado hoje.
 * Assim tela e banco sempre consultam o mesmo dia, inclusive entre 21:00 e 23:59.
 */
export function hojePortaria(d: Date = new Date()): string {
  return import.meta.env.VITE_G1_ACOES === "on" ? dataOperacional(d) : dataUTC(d);
}
