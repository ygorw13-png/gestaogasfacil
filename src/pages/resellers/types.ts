
export interface Reseller {
  id: string;
  name: string;
  phone: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  createdAt: Date;
}
