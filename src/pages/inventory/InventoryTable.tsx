
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUp, ArrowDown, X, Edit } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface InventoryItem {
  id: number;
  product: string;
  stock: number;
  category: string;
  min_stock: number;
  type?: string;
  status?: string;
  location?: string;
  quantity?: number;
  lastUpdate?: string;
}

interface InventoryTableProps {
  data: InventoryItem[];
  filterText: string;
}

export default function InventoryTable({ data, filterText }: InventoryTableProps) {
  const { toast } = useToast();
  
  const filteredData = data.filter((item) => {
    if (!filterText) return true;
    const searchTermLower = filterText.toLowerCase();
    
    return (
      item.product.toLowerCase().includes(searchTermLower) ||
      (item.status && item.status.toLowerCase().includes(searchTermLower)) ||
      (item.location && item.location.toLowerCase().includes(searchTermLower)) ||
      item.category.toLowerCase().includes(searchTermLower)
    );
  });

  const handleAction = (action: string, item: InventoryItem) => {
    switch (action) {
      case "edit":
        toast({
          title: "Editar item",
          description: `Editando ${item.product} em ${item.location || 'estoque'}`,
        });
        break;
      case "transfer":
        toast({
          title: "Transferir item",
          description: `Preparando para transferir ${item.product}`,
        });
        break;
      case "remove":
        toast({
          title: "Remover item",
          description: `Item removido: ${item.product}`,
          variant: "destructive",
        });
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status.toLowerCase()) {
      case "cheio":
        return "bg-green-100 text-green-800";
      case "vazio":
        return "bg-gray-100 text-gray-800";
      case "defeituoso":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLocationIcon = (location?: string) => {
    if (!location) return null;
    if (location.toLowerCase() === "pátio") {
      return <ArrowUp size={14} />;
    } else {
      return <ArrowDown size={14} />;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Localização</TableHead>
          <TableHead className="text-right">Quantidade</TableHead>
          <TableHead>Última Atualização</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
              Nenhum resultado encontrado para "{filterText}"
            </TableCell>
          </TableRow>
        ) : (
          filteredData.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.product}</TableCell>
              <TableCell>
                {item.status ? (
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                    Disponível
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {getLocationIcon(item.location)}
                  <span>{item.location || "Estoque"}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">{item.stock}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(item.lastUpdate) || "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleAction("edit", item)}>
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction("transfer", item)}>
                      <ArrowDown className="h-4 w-4 mr-2" /> Transferir
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleAction("remove", item)}
                      className="text-red-600"
                    >
                      <X className="h-4 w-4 mr-2" /> Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
