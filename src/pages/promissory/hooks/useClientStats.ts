
import { useMemo } from 'react';
import { PromissoryNote } from "../types";

export interface ClientStat {
  name: string;
  count: number;
  totalValue: number;
  paidPercent: number;
}

export function calculateClientStats(notes: PromissoryNote[]): ClientStat[] {
  const stats = new Map<string, { count: number, totalValue: number, paid: number }>();
  
  notes.forEach(note => {
    if (!stats.has(note.clientName)) {
      stats.set(note.clientName, { count: 0, totalValue: 0, paid: 0 });
    }
    
    const clientStat = stats.get(note.clientName)!;
    clientStat.count += 1;
    clientStat.totalValue += note.value;
    
    if (note.status === "paid") {
      clientStat.paid += 1;
    }
  });
  
  return Array.from(stats.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      totalValue: data.totalValue,
      paidPercent: data.count > 0 ? (data.paid / data.count) * 100 : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);
}

export function useClientStats(notes: PromissoryNote[]): ClientStat[] {
  return useMemo(() => calculateClientStats(notes), [notes]);
}
