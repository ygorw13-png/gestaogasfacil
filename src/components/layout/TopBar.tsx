
import { Bell, Menu, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { roleColors, roleLabels } from "@/types/userTypes";
import { useUserRole } from "@/hooks/useUserRole";

export function TopBar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isEntregador } = useUserRole();
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Função para obter as iniciais do nome do usuário ou um valor padrão
  const getUserInitials = () => {
    // Verificar se temos dados de usuário e email
    if (user?.email) {
      // Usar a primeira parte do email (antes do @) como fallback
      const emailName = user.email.split('@')[0];
      return emailName.substring(0, 2).toUpperCase();
    }
    return 'AU'; // Avatar do Usuário - valor padrão
  };

  // Função para obter o nome de exibição do usuário
  const getDisplayName = () => {
    // Se tivermos metadados de usuário, tente obter o nome de lá
    if (user?.user_metadata && user.user_metadata.name) {
      return user.user_metadata.name;
    }
    // Caso contrário, use o email ou um valor padrão
    return user?.email ? user.email.split('@')[0] : 'Usuário';
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
      <div className="flex h-16 items-center px-4 gap-4">
        <SidebarTrigger aria-label="Abrir ou fechar o menu lateral">
          <Menu className="h-6 w-6" aria-hidden="true" />
        </SidebarTrigger>
        
        <div className="flex-1"></div>
        
        <div className="flex items-center gap-4">
          {user && (
            <Badge variant="outline" className={user.role ? roleColors[user.role] : ''}>
              {user.role ? roleLabels[user.role] : 'Usuário'}
            </Badge>
          )}
          
          <Button variant="ghost" size="icon" className="relative" aria-label="Ver notificações">
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" aria-label="Notificações não lidas"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Abrir menu de usuário">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gasflow-100 text-gasflow-700">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>
                  {getDisplayName()}
                  {user?.role && (
                    <p className="text-xs font-normal text-muted-foreground mt-1">
                      {roleLabels[user.role]}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(isEntregador ? '/entregador/perfil' : '/profile')}>Perfil</DropdownMenuItem>
              {!isEntregador && (
                <DropdownMenuItem onClick={() => navigate('/settings')}>Configurações</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
