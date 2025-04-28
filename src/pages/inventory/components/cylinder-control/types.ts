
export interface CylinderLoanFormData {
  clientId: string;
  tipoCliente: "cliente" | "agregado";
  tipoVasilhame: "P13" | "P20" | "P45" | "agua";
  quantidade: number;
}

export interface Client {
  id: string;
  name: string;
}
