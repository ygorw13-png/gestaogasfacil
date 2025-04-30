
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useUserCreation } from "./dialogs/useUserCreation";
import { UserDetailsSection } from "./dialogs/UserDetailsSection";
import { PasswordSection } from "./dialogs/PasswordSection";

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewUserDialog({ open, onOpenChange }: NewUserDialogProps) {
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
        <form onSubmit={form.handleSubmit(handleCreateUser)}>
          <div className="space-y-4 py-2">
            <UserDetailsSection form={form} />
            
            <Separator className="my-4" />
            
            <PasswordSection form={form} />

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
