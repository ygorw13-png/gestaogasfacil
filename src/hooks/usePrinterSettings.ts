import { useCallback, useEffect, useState } from "react";

export type PaperWidth = "58mm" | "80mm";

export interface PrinterSettings {
  enabled: boolean;
  autoPrint: boolean;
  printerName: string;
  paperWidth: PaperWidth;
  headerText: string;
  footerText: string;
  copies: number;
}

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  enabled: true,
  autoPrint: false,
  printerName: "Bematech MP-4200 TH",
  paperWidth: "80mm",
  headerText: "GásFácil",
  footerText: "Obrigado pela preferência!",
  copies: 1,
};

const STORAGE_KEY = "gasfacil:printer-settings";

export function readPrinterSettings(): PrinterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRINTER_SETTINGS;
    return { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRINTER_SETTINGS;
  }
}

/** Configuração de impressora de cupom — por usuário/dispositivo (localStorage). */
export function usePrinterSettings() {
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);

  useEffect(() => {
    setSettings(readPrinterSettings());
  }, []);

  const save = useCallback((next: Partial<PrinterSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      return merged;
    });
  }, []);

  return { settings, save };
}
