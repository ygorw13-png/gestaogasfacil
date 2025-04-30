
import { RouteItem } from "../types";

export interface RouteStatusProps {
  status: string;
}

export interface RouteFiltersProps {
  filter: string;
  setFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

export interface RouteDetailsDialogProps {
  route: RouteItem;
}

export interface RouteTableProps {
  filteredRoutes: RouteItem[];
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}
