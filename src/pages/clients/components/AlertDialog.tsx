
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Client } from "../hooks/useClients";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientsWithManyLoans: Client[];
  onGenerateReport: () => void;
}

export function ClientsAlertDialog({ 
  open, 
  onOpenChange, 
  clientsWithManyLoans,
  onGenerateReport
}: AlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alertas de Comodato</AlertDialogTitle>
          <AlertDialogDescription>
            Os seguintes clientes estão com um número elevado de vasilhames:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vasilhames</TableHead>
                <TableHead>Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsWithManyLoans.map(client => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.cylinderCount}</TableCell>
                  <TableCell>{new Date(client.loanDate).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Fechar</AlertDialogCancel>
          <AlertDialogAction onClick={onGenerateReport}>Gerar Relatório</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
