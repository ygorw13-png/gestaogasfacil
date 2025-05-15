
import React from 'react';
import { Badge } from "@/components/ui/badge";

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

export const getStatusBadge = (status: string): React.ReactNode => {
  switch (status) {
    case "scheduled":
      return React.createElement(Badge, { className: "bg-blue-500" }, "Agendada");
    case "in-progress":
      return React.createElement(Badge, { className: "bg-yellow-500" }, "Em Andamento");
    case "completed":
      return React.createElement(Badge, { className: "bg-green-500" }, "Concluída");
    case "cancelled":
      return React.createElement(Badge, { className: "bg-red-500" }, "Cancelada");
    default:
      return React.createElement(Badge, { className: "bg-gray-500" }, "Desconhecido");
  }
};

export const getPriorityBadge = (priority: string): React.ReactNode => {
  switch (priority) {
    case "high":
      return React.createElement(Badge, { className: "bg-red-500" }, "Alta");
    case "medium":
      return React.createElement(Badge, { className: "bg-yellow-500" }, "Média");
    case "low":
      return React.createElement(Badge, { className: "bg-green-500" }, "Baixa");
    default:
      return React.createElement(Badge, { className: "bg-gray-500" }, "Normal");
  }
};
