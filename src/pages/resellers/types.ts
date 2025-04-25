
export interface Reseller {
  id: string;
  name: string;
  phone: string;
  address?: string;
  contactPerson?: string;
  priceP13: number;
  priceP20: number;
  priceP45: number;
  priceWater: number;
  notes?: string;
  createdAt: Date;
}
