
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserDetailsSection } from './UserDetailsSection';
import { PasswordSection } from './PasswordSection';
import { useUserCreation } from './useUserCreation';

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewUserDialog({ open, onOpenChange, onSuccess }: NewUserDialogProps) {
  const {
    newUserEmail,
    setNewUserEmail,
    newUserName,
    setNewUserName,
    newUserPassword,
    setNewUserPassword,
    newUserConfirmPassword,
    setNewUserConfirmPassword,
    newUserRole,
    setNewUserRole,
    passwordError,
    creatingUser,
    handleCreateNewUser
  } = useUserCreation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleCreateNewUser();
    
    if (result?.success) {
      // Reset form
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setNewUserConfirmPassword("");
      setNewUserRole("vendedor");
      
      // Close dialog and trigger success callback
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <UserDetailsSection
            email={newUserEmail}
            setEmail={setNewUserEmail}
            name={newUserName}
            setName={setNewUserName}
            role={newUserRole}
            setRole={setNewUserRole}
          />
          
          <PasswordSection
            password={newUserPassword}
            setPassword={setNewUserPassword}
            confirmPassword={newUserConfirmPassword}
            setConfirmPassword={setNewUserConfirmPassword}
            error={passwordError}
          />
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={creatingUser}>
              {creatingUser ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
