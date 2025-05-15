
import { Badge } from "@/components/ui/badge";

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled":
      return <Badge className="bg-blue-500">Agendada</Badge>;
    case "in-progress":
      return <Badge className="bg-yellow-500">Em Andamento</Badge>;
    case "completed":
      return <Badge className="bg-green-500">Concluída</Badge>;
    case "cancelled":
      return <Badge className="bg-red-500">Cancelada</Badge>;
    default:
      return <Badge className="bg-gray-500">Desconhecido</Badge>;
  }
};

export const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge className="bg-red-500">Alta</Badge>;
    case "medium":
      return <Badge className="bg-yellow-500">Média</Badge>;
    case "low":
      return <Badge className="bg-green-500">Baixa</Badge>;
    default:
      return <Badge className="bg-gray-500">Normal</Badge>;
  }
};
