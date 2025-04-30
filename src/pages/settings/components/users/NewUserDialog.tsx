
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useUserCreation } from "./dialogs/useUserCreation";
import { UserDetailsSection } from "./dialogs/UserDetailsSection";
import { PasswordSection } from "./dialogs/PasswordSection";
import { UserRole } from "@/types/userTypes";

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onUserCreated?: (user: {id: string; name: string; role: UserRole}) => void;
  organizationId?: string | null;
}

export function NewUserDialog({ open, onOpenChange, onSuccess, onUserCreated, organizationId }: NewUserDialogProps) {
  const {
    form,
    isCreateUserLoading,
    errors,
    handleCreateUser,
    clearForm
  } = useUserCreation();

  function handleOpenChange(open: boolean) {
    onOpenChange(open);
    
    // Clear form when dialog closes
    if (!open) {
      clearForm();
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await handleCreateUser(form.getValues());
      
      if (result) {
        if (onSuccess) {
          onSuccess();
        }
        
        if (onUserCreated && result.user) {
          onUserCreated({
            id: result.user.id,
            name: result.user.name,
            role: result.user.role as UserRole
          });
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          <UserPlus2 className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-2">
            <UserDetailsSection 
              email={form.watch('email') || ''}
              name={form.watch('name') || ''}
              role={form.watch('role') || ''}
              setEmail={(value) => form.setValue('email', value)}
              setName={(value) => form.setValue('name', value)}
              setRole={(value) => form.setValue('role', value)}
              errors={{
                email: form.formState.errors.email?.message,
                name: form.formState.errors.name?.message,
                role: form.formState.errors.role?.message
              }}
            />
            
            <Separator className="my-4" />
            
            <PasswordSection 
              password={form.watch('password') || ''}
              confirmPassword={form.watch('confirmPassword') || ''}
              setPassword={(value) => form.setValue('password', value)}
              setConfirmPassword={(value) => form.setValue('confirmPassword', value)}
              error={form.formState.errors.confirmPassword?.message || form.formState.errors.password?.message}
            />

            {errors && (
              <div className="text-red-500 text-sm mt-2">
                {errors}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isCreateUserLoading}
              >
                {isCreateUserLoading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
