
export interface RouteReport {
  id: string;
  date: string;
  driver: string;
  destination: string;
  salesCount: number;
  totalAmount: number;
  details: {
    gasP13Sold: number;
    gasP20Sold: number;
    gasP45Sold: number;
    waterSold: number;
    clients: {
      name: string;
      items: string;
      value: number;
    }[];
  };
}
