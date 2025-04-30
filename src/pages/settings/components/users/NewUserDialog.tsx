
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/userTypes";
import { PasswordSection } from "./dialogs/PasswordSection";
import { UserDetailsSection } from "./dialogs/UserDetailsSection";
import { useUserCreation } from "./dialogs/useUserCreation";

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: { id: string; name: string; role: UserRole }) => void;
  organizationId: string | null;
}

export function NewUserDialog({ 
  open, 
  onOpenChange,
  onUserCreated,
  organizationId
}: NewUserDialogProps) {
  const {
    newUserEmail,
    setNewUserEmail,
    newUserName,
    setNewUserName,
    newUserPassword,
    setNewUserPassword,
    newUserRole,
    setNewUserRole,
    passwordError,
    setPasswordError,
    creatingUser,
    handleCreateNewUser
  } = useUserCreation({
    organizationId,
    onUserCreated,
    onClose: () => onOpenChange(false)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário para sua organização. Todos os usuários terão acesso apenas aos dados da sua organização.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <UserDetailsSection
            name={newUserName}
            setName={setNewUserName}
            email={newUserEmail}
            setEmail={setNewUserEmail}
            role={newUserRole}
            setRole={setNewUserRole}
          />
          
          <PasswordSection 
            password={newUserPassword}
            setPassword={setNewUserPassword}
            passwordError={passwordError}
            setPasswordError={setPasswordError}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateNewUser} disabled={creatingUser}>
            {creatingUser ? "Criando..." : "Criar Usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
