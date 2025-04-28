
export type UserRole = 'admin' | 'gerente' | 'portaria' | 'estoque' | 'vendedor' | 'entregador';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  portaria: 'Portaria',
  estoque: 'Estoque',
  vendedor: 'Vendedor',
  entregador: 'Entregador'
};

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800 hover:bg-red-200',
  gerente: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  portaria: 'bg-green-100 text-green-800 hover:bg-green-200',
  estoque: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  vendedor: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  entregador: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
};
