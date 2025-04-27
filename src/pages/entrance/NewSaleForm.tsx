
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSaleForm } from "./components/sale-form/MobileSaleForm";
import { DesktopSaleForm } from "./components/sale-form/DesktopSaleForm";
import type { NewSaleFormProps } from "./types/saleTypes";

export default function NewSaleForm(props: NewSaleFormProps) {
  const isMobile = useIsMobile();

  return isMobile ? <MobileSaleForm {...props} /> : <DesktopSaleForm {...props} />;
}
