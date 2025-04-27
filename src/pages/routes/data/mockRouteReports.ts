
import { RouteReport } from "./types";

export interface Driver {
  id: string;
  name: string;
}

// Only export RouteReport as a type, since Driver is already exported directly
export type { RouteReport };

export const mockDrivers: Driver[] = [];
export const mockReports: RouteReport[] = [];
