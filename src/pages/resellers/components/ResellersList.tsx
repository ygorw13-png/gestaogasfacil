
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Phone } from "lucide-react";
import { Reseller } from "../types";

interface ResellersListProps {
  resellers: Reseller[];
  canViewPrices: boolean;
  onViewReseller: (reseller: Reseller) => void;
}

export function ResellersList({ resellers, canViewPrices, onViewReseller }: ResellersListProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            {canViewPrices && <TableHead className="text-right">P13</TableHead>}
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resellers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canViewPrices ? 4 : 3} className="text-center py-10 text-muted-foreground">
                Nenhum agregado cadastrado
              </TableCell>
            </TableRow>
          ) : (
            resellers.map((reseller) => (
              <TableRow key={reseller.id}>
                <TableCell className="font-medium">
                  {reseller.name}
                  {reseller.contactPerson && (
                    <div className="text-xs text-muted-foreground">
                      Responsável: {reseller.contactPerson}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {reseller.phone}
                  </div>
                  {reseller.address && (
                    <div className="text-xs text-muted-foreground">{reseller.address}</div>
                  )}
                </TableCell>
                {canViewPrices && (
                  <TableCell className="text-right font-medium">R$ {reseller.priceP13.toFixed(2)}</TableCell>
                )}
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => onViewReseller(reseller)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
