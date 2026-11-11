import { dataOperacional, dataUTC } from "@/lib/dataOperacional";
import { G1_ACOES } from "@/lib/g1/flag";

/**
 * Dia da portaria usado pelas telas. Ativação coordenada com o SQL 006:
 *  - ações ligadas (padrão) → America/Bahia (o banco grava `data_operacional()` no mesmo fuso);
 *  - VITE_G1_ACOES=off       → data UTC (comportamento anterior ao SQL 006).
 * Assim tela e banco sempre consultam o mesmo dia, inclusive entre 21:00 e 23:59.
 */
export function hojePortaria(d: Date = new Date()): string {
  return G1_ACOES ? dataOperacional(d) : dataUTC(d);
}
