
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { validatePasswordStrength, generateSecurePassword } from "@/utils/securityUtils";

interface PasswordSectionProps {
  password: string;
  setPassword: (password: string) => void;
  passwordError: string | null;
  setPasswordError: (error: string | null) => void;
}

export function PasswordSection({ 
  password, 
  setPassword, 
  passwordError, 
  setPasswordError 
}: PasswordSectionProps) {
  
  const handleGeneratePassword = () => {
    const securePassword = generateSecurePassword();
    setPassword(securePassword);
    setPasswordError(null);
  };

  const validatePassword = (password: string) => {
    if (password) {
      const validation = validatePasswordStrength(password);
      setPasswordError(validation.valid ? null : validation.message);
    }
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="password" className="text-right">
        Senha
      </Label>
      <div className="col-span-3 space-y-2">
        <div className="flex gap-2">
          <Input
            id="password"
            type="text" // Mostrar a senha para facilitar compartilhamento
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (e.target.value) validatePassword(e.target.value);
            }}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGeneratePassword}
            className="whitespace-nowrap"
          >
            Gerar Senha
          </Button>
        </div>
        
        {passwordError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{passwordError}</AlertDescription>
          </Alert>
        )}
        
        <p className="text-xs text-gray-500">
          A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, um número e um caractere especial.
        </p>
      </div>
    </div>
  );
}
