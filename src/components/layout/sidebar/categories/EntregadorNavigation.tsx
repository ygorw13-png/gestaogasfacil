import { Bike, UserPlus, Package, Trophy } from "lucide-react";
import { SidebarLink } from "../SidebarLink";

export const EntregadorNavigation = () => {
  return (
    <>
      <SidebarLink to="/entregador/entregas" icon={Package} label="Minhas Entregas" />
      <SidebarLink to="/entregador/venda-rua" icon={Bike} label="Venda na Rua" />
      <SidebarLink to="/entregador/cadastro" icon={UserPlus} label="Cadastro Rápido" />
      <SidebarLink to="/entregador/perfil" icon={Trophy} label="Meu Desempenho" />
    </>
  );
};
