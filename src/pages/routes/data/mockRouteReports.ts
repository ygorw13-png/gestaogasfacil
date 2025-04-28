
import { RouteReport } from "./types";

export interface Driver {
  id: string;
  name: string;
}

export type { RouteReport };

export const mockDrivers: Driver[] = [];
export const mockReports: RouteReport[] = [];
