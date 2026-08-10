
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phone, MapPin, User, Calendar } from "lucide-react";
import { Reseller } from "../types";
import { format } from "date-fns";

interface ResellerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller: Reseller | null;
  canViewPrices: boolean;
}

export function ResellerDetailsDialog({ 
  open, 
  onOpenChange, 
  reseller, 
  canViewPrices 
}: ResellerDetailsDialogProps) {
  if (!reseller) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Agregado</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">{reseller.name}</h3>
            <p className="text-sm text-muted-foreground">
              Cadastrado em {format(new Date(reseller.createdAt), "dd/MM/yyyy")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{reseller.phone}</span>
              </div>
              
              {reseller.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{reseller.address}</span>
                </div>
              )}
              
              {reseller.contactPerson && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{reseller.contactPerson}</span>
                </div>
              )}
              
              {reseller.notes && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-1">Observações:</h4>
                  <p className="text-sm text-muted-foreground">{reseller.notes}</p>
                </div>
              )}
            </div>
            
            {canViewPrices && (
              <div className="bg-muted p-4 rounded-md">
                <h4 className="text-sm font-medium mb-3">Preço de Revenda</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>P13</TableCell>
                      <TableCell className="text-right font-medium">
                        {reseller.priceP13 > 0 ? `R$ ${reseller.priceP13.toFixed(2)}` : "Não informado"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
